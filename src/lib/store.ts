import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  Client, Empreendimento, Project, Survey, ModuleState, FieldStatus, Pendencia,
  SurveyType, Attachment, SurveyTemplate,
  FormStructureOverrides, FieldPatch, SubgroupPatch, ModulePatch, SubgroupDef, FieldDef,
} from "./types";
import {
  getModulesForType, ensureLegacyAdapters, getEffectiveModulesForType,
  setGlobalFormOverrides,
} from "./modules";

const KEY = "ramos_eng_db_v1";
const INDEXED_DB_NAME = "ramos-eng-db";
const INDEXED_DB_STORE = "app-state";
const INDEXED_DB_RECORD = "snapshot";

interface DB {
  clients: Client[];
  empreendimentos: Empreendimento[];
  projects: Project[];
  surveys: Survey[];
  templates: SurveyTemplate[];
  formOverrides: FormStructureOverrides;
}

interface DBStatus {
  hydrated: boolean;
  persistPending: boolean;
  persistenceError?: string;
}

interface StoreRuntime {
  db: DB;
  status: DBStatus;
  listeners: Set<() => void>;
  initPromise?: Promise<void>;
  idbPromise?: Promise<IDBDatabase>;
  persistTimer?: number;
  persistChain: Promise<void>;
}

const EMPTY_DB: DB = { clients: [], empreendimentos: [], projects: [], surveys: [], templates: [], formOverrides: {} };

function createModuleState(): ModuleState {
  return {
    status: "nao_iniciado",
    values: {},
    fieldStatus: {},
    attachments: [],
    fieldNotes: {},
    nonApplicable: {},
  };
}

function normalizeModuleState(module?: Partial<ModuleState> | null): ModuleState {
  return {
    status: module?.status ?? "nao_iniciado",
    values: module?.values ?? {},
    fieldStatus: module?.fieldStatus ?? {},
    notes: module?.notes,
    attachments: Array.isArray(module?.attachments) ? module.attachments : [],
    fieldNotes: module?.fieldNotes ?? {},
    subgroupNotes: module?.subgroupNotes ?? {},
    nonApplicable: module?.nonApplicable ?? {},
    naModule: module?.naModule ?? false,
    naSubgroups: module?.naSubgroups ?? {},
    moduleDone: module?.moduleDone ?? false,
    subgroupDone: module?.subgroupDone ?? {},
  };
}

function normalizeSurvey(survey: Survey): Survey {
  const nextModules = { ...(survey.modules ?? {}) };

  for (const mod of getModulesForType(survey.type)) {
    const current = nextModules[mod.id];
    nextModules[mod.id] = current ? normalizeModuleState(current) : createModuleState();
  }

  return {
    ...survey,
    modules: ensureLegacyAdapters(nextModules),
    pendencias: Array.isArray(survey.pendencias) ? survey.pendencias : [],
    signatures: survey.signatures ?? {},
  };
}

function normalizeDB(raw: Partial<DB> | null | undefined): DB {
  const db: DB = {
    clients: Array.isArray(raw?.clients) ? raw.clients : [],
    empreendimentos: Array.isArray(raw?.empreendimentos) ? raw.empreendimentos : [],
    projects: Array.isArray(raw?.projects) ? raw.projects : [],
    surveys: Array.isArray(raw?.surveys) ? raw.surveys.map((survey) => normalizeSurvey(survey)) : [],
    templates: Array.isArray(raw?.templates) ? raw.templates : [],
    formOverrides: (raw?.formOverrides && typeof raw.formOverrides === "object") ? raw.formOverrides as FormStructureOverrides : {},
  };

  // Recupera clientes "órfãos": se um projeto/empreendimento/levantamento referencia
  // um clientId que não existe mais na lista de clientes, recria um placeholder
  // para que o usuário consiga acessar e renomear depois.
  const knownClientIds = new Set(db.clients.map((c) => c.id));
  const orphanClientIds = new Set<string>();
  for (const e of db.empreendimentos) {
    if (e.clientId && !knownClientIds.has(e.clientId)) orphanClientIds.add(e.clientId);
  }
  for (const p of db.projects) {
    if (p.clientId && !knownClientIds.has(p.clientId)) orphanClientIds.add(p.clientId);
  }
  if (orphanClientIds.size > 0) {
    const recovered: Client[] = Array.from(orphanClientIds).map((cid, idx) => ({
      id: cid,
      name: `Cliente recuperado ${idx + 1}`,
      personType: "PJ",
      notes: "Registro reconstruído automaticamente — confira e atualize os dados.",
      createdAt: new Date().toISOString(),
    }));
    db.clients = [...recovered, ...db.clients];
  }

  return db;
}

function isEmptyDB(nextDB: DB) {
  return nextDB.clients.length === 0
    && nextDB.empreendimentos.length === 0
    && nextDB.projects.length === 0
    && nextDB.surveys.length === 0
    && nextDB.templates.length === 0;
}

function loadLegacyLocalStorage(): DB {
  if (typeof window === "undefined") return EMPTY_DB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DB;
    return normalizeDB(JSON.parse(raw));
  } catch {
    return EMPTY_DB;
  }
}

function saveLegacyLocalStorage(nextDB: DB) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(nextDB));
  } catch (error) {
    console.error("Falha ao criar backup local dos dados", error);
  }
}

const runtimeGlobal = globalThis as typeof globalThis & {
  __ramosStoreRuntime?: StoreRuntime;
  __ramosPersistLifecycleBound?: boolean;
};

const store = runtimeGlobal.__ramosStoreRuntime ??= {
  db: EMPTY_DB,
  status: { hydrated: typeof window === "undefined", persistPending: false },
  listeners: new Set<() => void>(),
  persistChain: Promise.resolve(),
};

function emit() {
  store.listeners.forEach((listener) => listener());
}

function syncGlobalOverrides() {
  setGlobalFormOverrides(store.db.formOverrides);
}

function openIndexedDB() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB indisponível neste navegador."));
  }

  if (!store.idbPromise) {
    store.idbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(INDEXED_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(INDEXED_DB_STORE)) {
          database.createObjectStore(INDEXED_DB_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
    });
  }

  return store.idbPromise;
}

async function readIndexedDB(): Promise<DB | null> {
  const database = await openIndexedDB();

  return new Promise<DB | null>((resolve, reject) => {
    const transaction = database.transaction(INDEXED_DB_STORE, "readonly");
    const request = transaction.objectStore(INDEXED_DB_STORE).get(INDEXED_DB_RECORD);

    request.onsuccess = () => {
      resolve(request.result ? normalizeDB(request.result as Partial<DB>) : null);
    };
    request.onerror = () => reject(request.error ?? new Error("Não foi possível ler os dados locais."));
  });
}

async function writeIndexedDB(nextDB: DB) {
  const database = await openIndexedDB();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(INDEXED_DB_STORE, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar os dados locais."));
    transaction.objectStore(INDEXED_DB_STORE).put(nextDB, INDEXED_DB_RECORD);
  });
}

async function loadPersistedDB() {
  let indexed: DB | null = null;
  try {
    indexed = await readIndexedDB();
  } catch (error) {
    console.warn("Falha ao ler IndexedDB, usando backup legado.", error);
  }

  const legacy = loadLegacyLocalStorage();

  // Mescla IndexedDB e backup legado priorizando o snapshot mais "rico" para cada
  // coleção. Isso recupera clientes/projetos que ficaram apenas no backup legado
  // após uma migração parcial para o IndexedDB.
  if (indexed && !isEmptyDB(legacy)) {
    const merged = mergeDBs(indexed, legacy);
    if (!isEmptyDB(merged)) {
      try { await writeIndexedDB(merged); } catch { /* ignore */ }
      return merged;
    }
  }

  if (indexed && !isEmptyDB(indexed)) return indexed;

  if (!isEmptyDB(legacy)) {
    try {
      await writeIndexedDB(legacy);
    } catch (error) {
      console.warn("Falha ao migrar dados legados para IndexedDB.", error);
    }
    return legacy;
  }

  return EMPTY_DB;
}

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) if (!map.has(item.id)) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeDBs(a: DB, b: DB): DB {
  return normalizeDB({
    clients: mergeById(a.clients, b.clients),
    empreendimentos: mergeById(a.empreendimentos, b.empreendimentos),
    projects: mergeById(a.projects, b.projects),
    surveys: mergeById(a.surveys, b.surveys),
    templates: mergeById(a.templates ?? [], b.templates ?? []),
  });
}

async function flushPersist(snapshot: DB) {
  try {
    await writeIndexedDB(snapshot);
    store.status = { ...store.status, persistPending: false, persistenceError: undefined };
  } catch (error) {
    console.error("Falha ao persistir dados no navegador", error);
    saveLegacyLocalStorage(snapshot);
    store.status = {
      ...store.status,
      persistPending: false,
      persistenceError: "Alguns dados foram mantidos em backup local por segurança.",
    };
  }
  emit();
}

function queuePersist(immediate = false) {
  if (typeof window === "undefined") return;

  const schedule = () => {
    store.persistTimer = undefined;
    const snapshot = store.db;
    store.persistChain = store.persistChain.then(() => flushPersist(snapshot));
  };

  store.status = { ...store.status, persistPending: true, persistenceError: undefined };
  emit();

  if (store.persistTimer) {
    window.clearTimeout(store.persistTimer);
  }

  if (immediate) {
    schedule();
    return;
  }

  store.persistTimer = window.setTimeout(schedule, 120);
}

function ensureInitialized() {
  if (typeof window === "undefined" || store.initPromise) return;

  store.status = { ...store.status, hydrated: false };
  store.initPromise = loadPersistedDB()
    .then((loaded) => {
      store.db = loaded;
      setGlobalFormOverrides(store.db.formOverrides);
    })
    .catch((error) => {
      console.error("Falha ao carregar dados locais", error);
      store.status = {
        ...store.status,
        persistenceError: "Não foi possível carregar o armazenamento local salvo.",
      };
    })
    .finally(() => {
      store.status = { ...store.status, hydrated: true };
      emit();
    });
}

ensureInitialized();

if (typeof window !== "undefined" && !runtimeGlobal.__ramosPersistLifecycleBound) {
  const flushBeforeExit = () => {
    if (store.persistTimer) {
      window.clearTimeout(store.persistTimer);
      store.persistTimer = undefined;
    }
    saveLegacyLocalStorage(store.db);
    queuePersist(true);
  };

  window.addEventListener("pagehide", flushBeforeExit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushBeforeExit();
  });
  runtimeGlobal.__ramosPersistLifecycleBound = true;
}

function persist() {
  queuePersist();
  emit();
}

function subscribe(listener: () => void) {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function getSnapshot() {
  return store.db;
}

function getServerSnapshot(): DB {
  return EMPTY_DB;
}

function getStatusSnapshot() {
  return store.status;
}

function getServerStatusSnapshot(): DBStatus {
  return { hydrated: false, persistPending: false };
}

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDBStatus() {
  return useSyncExternalStore(subscribe, getStatusSnapshot, getServerStatusSnapshot);
}

export function useDBSelector<T>(selector: (state: DB) => T, isEqual: (a: T, b: T) => boolean = Object.is) {
  const [selected, setSelected] = useState(() => selector(store.db));
  const selectedRef = useRef(selected);
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  useEffect(() => {
    const next = selector(store.db);
    if (!isEqualRef.current(selectedRef.current, next)) {
      selectedRef.current = next;
      setSelected(next);
    }
  }, [selector]);

  useEffect(() => {
    return subscribe(() => {
      const next = selectorRef.current(store.db);
      if (!isEqualRef.current(selectedRef.current, next)) {
        selectedRef.current = next;
        setSelected(next);
      }
    });
  }, []);

  return selected;
}

const id = () => Math.random().toString(36).slice(2, 11);

export function addClient(data: Omit<Client, "id" | "createdAt">) {
  const client: Client = { ...data, id: id(), createdAt: new Date().toISOString() };
  store.db = { ...store.db, clients: [client, ...store.db.clients] };
  persist();
  return client;
}

export function updateClient(cid: string, data: Partial<Client>) {
  store.db = { ...store.db, clients: store.db.clients.map((client) => (client.id === cid ? { ...client, ...data } : client)) };
  persist();
}

export function deleteClient(cid: string) {
  const remainingProjects = store.db.projects.filter((project) => project.clientId !== cid);
  const remainingProjectIds = new Set(remainingProjects.map((project) => project.id));

  store.db = {
    ...store.db,
    clients: store.db.clients.filter((client) => client.id !== cid),
    empreendimentos: store.db.empreendimentos.filter((empreendimento) => empreendimento.clientId !== cid),
    projects: remainingProjects,
    surveys: store.db.surveys.filter((survey) => remainingProjectIds.has(survey.projectId)),
  };
  persist();
}

export function addEmpreendimento(data: Omit<Empreendimento, "id" | "createdAt">) {
  const empreendimento: Empreendimento = { ...data, id: id(), createdAt: new Date().toISOString() };
  store.db = { ...store.db, empreendimentos: [empreendimento, ...store.db.empreendimentos] };
  persist();
  return empreendimento;
}

export function updateEmpreendimento(eid: string, data: Partial<Empreendimento>) {
  store.db = {
    ...store.db,
    empreendimentos: store.db.empreendimentos.map((empreendimento) => (empreendimento.id === eid ? { ...empreendimento, ...data } : empreendimento)),
  };
  persist();
}

export function deleteEmpreendimento(eid: string) {
  store.db = {
    ...store.db,
    empreendimentos: store.db.empreendimentos.filter((empreendimento) => empreendimento.id !== eid),
    projects: store.db.projects.map((project) => (project.empreendimentoId === eid ? { ...project, empreendimentoId: undefined } : project)),
  };
  persist();
}

export function addProject(data: Omit<Project, "id" | "createdAt">) {
  const project: Project = { ...data, id: id(), createdAt: new Date().toISOString() };
  store.db = { ...store.db, projects: [project, ...store.db.projects] };
  persist();
  return project;
}

export function deleteProject(pid: string) {
  store.db = {
    ...store.db,
    projects: store.db.projects.filter((project) => project.id !== pid),
    surveys: store.db.surveys.filter((survey) => survey.projectId !== pid),
  };
  persist();
}

export function addSurvey(data: { projectId: string; type: SurveyType; title: string }) {
  const modules: Record<string, ModuleState> = {};
  getModulesForType(data.type).forEach((module) => {
    modules[module.id] = createModuleState();
  });

  // Pré-preenche data e horário de chegada na Identificação.
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const hhmm = now.toTimeString().slice(0, 5);
  if (modules["identificacao"]) {
    modules["identificacao"] = {
      ...modules["identificacao"],
      values: {
        ...modules["identificacao"].values,
        data_visita: todayISO,
        hora_chegada: hhmm,
      },
      fieldStatus: {
        ...modules["identificacao"].fieldStatus,
        data_visita: "concluido",
        hora_chegada: "concluido",
      },
      status: "em_andamento",
    };
  }

  const survey: Survey = {
    id: id(),
    projectId: data.projectId,
    type: data.type,
    title: data.title,
    date: todayISO,
    modules,
    pendencias: [],
    signatures: {},
    createdAt: now.toISOString(),
  };
  // Aplica template padrão do tipo, se houver.
  const def = (store.db.templates ?? []).find((t) => t.type === data.type && t.isDefault);
  if (def && def.moduleIds.length) {
    survey.enabledModules = Array.from(new Set([...def.moduleIds, "identificacao", "validacao"]));
    // Aplica overrides de subgrupos: marca como N/A subgrupos desabilitados pelo template.
    if (def.subgroupOverrides) {
      for (const [mid, sgIds] of Object.entries(def.subgroupOverrides)) {
        if (!survey.modules[mid]) continue;
        const naSub: Record<string, boolean> = { ...(survey.modules[mid].naSubgroups ?? {}) };
        for (const sg of sgIds) naSub[sg] = true;
        survey.modules[mid] = { ...survey.modules[mid], naSubgroups: naSub };
      }
    }
  }

  store.db = { ...store.db, surveys: [survey, ...store.db.surveys] };
  persist();
  return survey;
}

export function updateSurvey(sid: string, data: Partial<Survey>) {
  store.db = {
    ...store.db,
    surveys: store.db.surveys.map((survey) => (survey.id === sid ? normalizeSurvey({ ...survey, ...data }) : survey)),
  };
  persist();
}

export function deleteSurvey(sid: string) {
  store.db = { ...store.db, surveys: store.db.surveys.filter((survey) => survey.id !== sid) };
  persist();
}

export function closeSurvey(sid: string, horaSaida?: string) {
  store.db = {
    ...store.db,
    surveys: store.db.surveys.map((s) =>
      s.id === sid ? { ...s, closedAt: new Date().toISOString(), closedAtSaida: horaSaida } : s,
    ),
  };
  persist();
}

export function reopenSurvey(sid: string) {
  store.db = {
    ...store.db,
    surveys: store.db.surveys.map((s) =>
      s.id === sid ? { ...s, closedAt: undefined, closedAtSaida: undefined } : s,
    ),
  };
  persist();
}

export function updateModule(sid: string, modId: string, patch: Partial<ModuleState>) {
  store.db = {
    ...store.db,
    surveys: store.db.surveys.map((survey) =>
      survey.id === sid
        ? {
            ...survey,
            modules: {
              ...survey.modules,
              [modId]: normalizeModuleState({ ...(survey.modules[modId] ?? createModuleState()), ...patch }),
            },
          }
        : survey,
    ),
  };
  persist();
}

export function setFieldValue(sid: string, modId: string, fieldId: string, value: any) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  updateModule(sid, modId, {
    values: { ...moduleState.values, [fieldId]: value },
    status: moduleState.status === "nao_iniciado" ? "em_andamento" : moduleState.status,
  });
}

export function setFieldStatus(sid: string, modId: string, fieldId: string, status: FieldStatus) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  updateModule(sid, modId, { fieldStatus: { ...moduleState.fieldStatus, [fieldId]: status } });
}

export function setFieldNote(sid: string, modId: string, fieldId: string, note: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  const nextNotes = { ...(moduleState.fieldNotes ?? {}) };
  if (note.trim()) nextNotes[fieldId] = note;
  else delete nextNotes[fieldId];
  updateModule(sid, modId, { fieldNotes: nextNotes });
}

export function setFieldNA(sid: string, modId: string, fieldId: string, na: boolean) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  const nextNonApplicable = { ...(moduleState.nonApplicable ?? {}) };
  if (na) nextNonApplicable[fieldId] = true;
  else delete nextNonApplicable[fieldId];

  const nextFieldStatus = { ...moduleState.fieldStatus };
  if (na) nextFieldStatus[fieldId] = "nao_se_aplica";
  else if (nextFieldStatus[fieldId] === "nao_se_aplica") delete nextFieldStatus[fieldId];

  updateModule(sid, modId, { nonApplicable: nextNonApplicable, fieldStatus: nextFieldStatus });
}

export function setEnabledModules(sid: string, ids: string[]) {
  updateSurvey(sid, { enabledModules: ids });
}

export function setModuleNA(sid: string, modId: string, na: boolean) {
  updateModule(sid, modId, { naModule: na });
}

export function setModuleDone(sid: string, modId: string, done: boolean) {
  updateModule(sid, modId, { moduleDone: done });
}

export function setSubgroupDone(sid: string, modId: string, subId: string, done: boolean) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  const next = { ...(moduleState.subgroupDone ?? {}) };
  if (done) next[subId] = true;
  else delete next[subId];
  updateModule(sid, modId, { subgroupDone: next });
}

export function setSubgroupNA(sid: string, modId: string, subId: string, na: boolean) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  const next = { ...(moduleState.naSubgroups ?? {}) };
  if (na) next[subId] = true;
  else delete next[subId];
  updateModule(sid, modId, { naSubgroups: next });
}

export function setSubgroupNote(sid: string, modId: string, subId: string, note: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  const next = { ...(moduleState.subgroupNotes ?? {}) };
  if (note.trim()) next[subId] = note;
  else delete next[subId];
  updateModule(sid, modId, { subgroupNotes: next });
}

export function enableModule(sid: string, modId: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const current = survey.enabledModules ?? [];
  if (current.includes(modId)) return;
  updateSurvey(sid, { enabledModules: [...current, modId] });
}

export function disableModule(sid: string, modId: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const current = survey.enabledModules ?? [];
  updateSurvey(sid, { enabledModules: current.filter((id) => id !== modId) });
}

export function addAttachment(sid: string, modId: string, att: Attachment) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  updateModule(sid, modId, { attachments: [...moduleState.attachments, att] });
}

export function removeAttachment(sid: string, modId: string, attId: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const moduleState = survey.modules[modId];
  updateModule(sid, modId, { attachments: moduleState.attachments.filter((attachment) => attachment.id !== attId) });
}

export function addPendencia(sid: string, pendencia: Omit<Pendencia, "id" | "createdAt">) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  const nextPendencia: Pendencia = { ...pendencia, id: id(), createdAt: new Date().toISOString() };
  updateSurvey(sid, { pendencias: [nextPendencia, ...survey.pendencias] });
}

export function removePendencia(sid: string, pid: string) {
  const survey = store.db.surveys.find((entry) => entry.id === sid);
  if (!survey) return;
  updateSurvey(sid, { pendencias: survey.pendencias.filter((pendencia) => pendencia.id !== pid) });
}

// =================== Templates de módulos ===================

export function addTemplate(data: Omit<SurveyTemplate, "id" | "createdAt">) {
  const tpl: SurveyTemplate = { ...data, id: id(), createdAt: new Date().toISOString() };
  store.db = { ...store.db, templates: [tpl, ...(store.db.templates ?? [])] };
  persist();
  return tpl;
}

export function updateTemplate(tid: string, patch: Partial<Omit<SurveyTemplate, "id" | "createdAt">>) {
  store.db = {
    ...store.db,
    templates: (store.db.templates ?? []).map((t) => (t.id === tid ? { ...t, ...patch } : t)),
  };
  persist();
}

export function removeTemplate(tid: string) {
  store.db = { ...store.db, templates: (store.db.templates ?? []).filter((t) => t.id !== tid) };
  persist();
}

export function setTemplateDefault(tid: string, isDefault: boolean) {
  const list = store.db.templates ?? [];
  const target = list.find((x) => x.id === tid);
  if (!target) return;
  store.db = {
    ...store.db,
    templates: list.map((t) => {
      if (t.id === tid) return { ...t, isDefault };
      if (isDefault && t.type === target.type) return { ...t, isDefault: false };
      return t;
    }),
  };
  persist();
}

export function duplicateTemplate(tid: string) {
  const list = store.db.templates ?? [];
  const target = list.find((t) => t.id === tid);
  if (!target) return;
  const copy: SurveyTemplate = {
    ...target,
    id: id(),
    name: `${target.name} (cópia)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    subgroupOverrides: target.subgroupOverrides
      ? Object.fromEntries(Object.entries(target.subgroupOverrides).map(([k, v]) => [k, [...v]]))
      : undefined,
    moduleIds: [...target.moduleIds],
  };
  store.db = { ...store.db, templates: [copy, ...list] };
  persist();
  return copy;
}

/* =================== Estrutura dos Formulários =================== */

function mutateOverrides(fn: (o: FormStructureOverrides) => FormStructureOverrides) {
  const current = store.db.formOverrides ?? {};
  store.db = { ...store.db, formOverrides: fn(current) };
  syncGlobalOverrides();
  persist();
}

export function setModulePatch(moduleId: string, patch: ModulePatch | null) {
  mutateOverrides((o) => {
    const next = { ...(o.modules ?? {}) };
    if (!patch) delete next[moduleId]; else next[moduleId] = { ...(next[moduleId] ?? {}), ...patch };
    return { ...o, modules: next };
  });
}

export function setSubgroupPatch(moduleId: string, subgroupId: string, patch: SubgroupPatch | null) {
  const key = `${moduleId}.${subgroupId}`;
  mutateOverrides((o) => {
    const next = { ...(o.subgroups ?? {}) };
    if (!patch) delete next[key]; else next[key] = { ...(next[key] ?? {}), ...patch };
    return { ...o, subgroups: next };
  });
}

export function setFieldPatch(
  moduleId: string, subgroupId: string | null, fieldId: string, patch: FieldPatch | null,
) {
  const key = `${moduleId}.${subgroupId ?? "_"}.${fieldId}`;
  mutateOverrides((o) => {
    const next = { ...(o.fields ?? {}) };
    if (!patch) delete next[key]; else next[key] = { ...(next[key] ?? {}), ...patch };
    return { ...o, fields: next };
  });
}

export function addCustomSubgroup(moduleId: string, subgroup: SubgroupDef) {
  mutateOverrides((o) => {
    const next = { ...(o.customSubgroups ?? {}) };
    next[moduleId] = [...(next[moduleId] ?? []), subgroup];
    return { ...o, customSubgroups: next };
  });
}

export function removeCustomSubgroup(moduleId: string, subgroupId: string) {
  mutateOverrides((o) => {
    const next = { ...(o.customSubgroups ?? {}) };
    if (next[moduleId]) {
      next[moduleId] = next[moduleId].filter((s) => s.id !== subgroupId);
      if (!next[moduleId].length) delete next[moduleId];
    }
    return { ...o, customSubgroups: next };
  });
}

export function addCustomField(moduleId: string, subgroupId: string, field: FieldDef) {
  const key = `${moduleId}.${subgroupId}`;
  mutateOverrides((o) => {
    const next = { ...(o.customFields ?? {}) };
    next[key] = [...(next[key] ?? []), field];
    return { ...o, customFields: next };
  });
}

export function removeCustomField(moduleId: string, subgroupId: string, fieldId: string) {
  const key = `${moduleId}.${subgroupId}`;
  mutateOverrides((o) => {
    const next = { ...(o.customFields ?? {}) };
    if (next[key]) {
      next[key] = next[key].filter((f) => f.id !== fieldId);
      if (!next[key].length) delete next[key];
    }
    return { ...o, customFields: next };
  });
}

export function resetAllFormOverrides() {
  store.db = { ...store.db, formOverrides: {} };
  persist();
}

/** Hook: retorna módulos do tipo já com overrides aplicados. */
export function useEffectiveModulesForType(type: SurveyType) {
  const overrides = useDBSelector(
    (s) => s.formOverrides ?? {},
    (a, b) => a === b,
  );
  return getEffectiveModulesForType(type, overrides);
}
