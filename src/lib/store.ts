import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Client, Empreendimento, Project, Survey, ModuleState, FieldStatus, Pendencia, SurveyType, Attachment } from "./types";
import { getModulesForType } from "./modules";

const KEY = "ramos_eng_db_v1";

interface DB {
  clients: Client[];
  empreendimentos: Empreendimento[];
  projects: Project[];
  surveys: Survey[];
}

const EMPTY_DB: DB = { clients: [], empreendimentos: [], projects: [], surveys: [] };

function createModuleState(): ModuleState {
  return { status: "nao_iniciado", values: {}, fieldStatus: {}, attachments: [] };
}

function normalizeModuleState(module?: Partial<ModuleState> | null): ModuleState {
  return {
    status: module?.status ?? "nao_iniciado",
    values: module?.values ?? {},
    fieldStatus: module?.fieldStatus ?? {},
    notes: module?.notes,
    attachments: Array.isArray(module?.attachments) ? module.attachments : [],
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
    modules: nextModules,
    pendencias: Array.isArray(survey.pendencias) ? survey.pendencias : [],
    signatures: survey.signatures ?? {},
  };
}

function normalizeDB(raw: Partial<DB> | null | undefined): DB {
  return {
    clients: Array.isArray(raw?.clients) ? raw.clients : [],
    empreendimentos: Array.isArray(raw?.empreendimentos) ? raw.empreendimentos : [],
    projects: Array.isArray(raw?.projects) ? raw.projects : [],
    surveys: Array.isArray(raw?.surveys) ? raw.surveys.map((survey) => normalizeSurvey(survey)) : [],
  };
}

function load(): DB {
  if (typeof window === "undefined") return EMPTY_DB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DB;
    return normalizeDB(JSON.parse(raw));
  } catch {
    return EMPTY_DB;
  }
}

function save(nextDB: DB) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(nextDB));
  } catch (error) {
    console.error("Falha ao persistir dados no navegador", error);
  }
}

let db: DB = load();
const listeners = new Set<() => void>();

const persistLifecycle = globalThis as typeof globalThis & { __ramosPersistLifecycleBound?: boolean };
if (typeof window !== "undefined" && !persistLifecycle.__ramosPersistLifecycleBound) {
  const syncFromStorage = () => {
    db = load();
    listeners.forEach((l) => l());
  };

  window.addEventListener("pageshow", syncFromStorage);
  window.addEventListener("storage", (event) => {
    if (event.key && event.key !== KEY) return;
    syncFromStorage();
  });
  persistLifecycle.__ramosPersistLifecycleBound = true;
}

function persist() {
  save(db);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return db;
}

function getServerSnapshot(): DB {
  return EMPTY_DB;
}

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDBSelector<T>(selector: (state: DB) => T, isEqual: (a: T, b: T) => boolean = Object.is) {
  const [selected, setSelected] = useState(() => selector(db));
  const selectedRef = useRef(selected);
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  useEffect(() => {
    const next = selector(db);
    if (!isEqualRef.current(selectedRef.current, next)) {
      selectedRef.current = next;
      setSelected(next);
    }
  }, [selector]);

  useEffect(() => {
    return subscribe(() => {
      const next = selectorRef.current(db);
      if (!isEqualRef.current(selectedRef.current, next)) {
        selectedRef.current = next;
        setSelected(next);
      }
    });
  }, []);

  return selected;
}

const id = () => Math.random().toString(36).slice(2, 11);

// Clients
export function addClient(data: Omit<Client, "id" | "createdAt">) {
  const c: Client = { ...data, id: id(), createdAt: new Date().toISOString() };
  db = { ...db, clients: [c, ...db.clients] };
  persist();
  return c;
}
export function updateClient(cid: string, data: Partial<Client>) {
  db = { ...db, clients: db.clients.map((c) => (c.id === cid ? { ...c, ...data } : c)) };
  persist();
}
export function deleteClient(cid: string) {
  db = {
    ...db,
    clients: db.clients.filter((c) => c.id !== cid),
    empreendimentos: db.empreendimentos.filter((e) => e.clientId !== cid),
    projects: db.projects.filter((p) => p.clientId !== cid),
    surveys: db.surveys.filter((s) => {
      const proj = db.projects.find((p) => p.id === s.projectId);
      return proj && proj.clientId !== cid;
    }),
  };
  persist();
}

// Empreendimentos
export function addEmpreendimento(data: Omit<Empreendimento, "id" | "createdAt">) {
  const e: Empreendimento = { ...data, id: id(), createdAt: new Date().toISOString() };
  db = { ...db, empreendimentos: [e, ...db.empreendimentos] };
  persist();
  return e;
}
export function updateEmpreendimento(eid: string, data: Partial<Empreendimento>) {
  db = { ...db, empreendimentos: db.empreendimentos.map((e) => (e.id === eid ? { ...e, ...data } : e)) };
  persist();
}
export function deleteEmpreendimento(eid: string) {
  db = {
    ...db,
    empreendimentos: db.empreendimentos.filter((e) => e.id !== eid),
    projects: db.projects.map((p) => (p.empreendimentoId === eid ? { ...p, empreendimentoId: undefined } : p)),
  };
  persist();
}

// Projects
export function addProject(data: Omit<Project, "id" | "createdAt">) {
  const p: Project = { ...data, id: id(), createdAt: new Date().toISOString() };
  db = { ...db, projects: [p, ...db.projects] };
  persist();
  return p;
}
export function deleteProject(pid: string) {
  db = {
    ...db,
    projects: db.projects.filter((p) => p.id !== pid),
    surveys: db.surveys.filter((s) => s.projectId !== pid),
  };
  persist();
}

// Surveys
export function addSurvey(data: { projectId: string; type: SurveyType; title: string }) {
  const mods = getModulesForType(data.type);
  const modules: Record<string, ModuleState> = {};
  mods.forEach((m) => {
    modules[m.id] = { status: "nao_iniciado", values: {}, fieldStatus: {}, attachments: [] };
  });
  const s: Survey = {
    id: id(),
    projectId: data.projectId,
    type: data.type,
    title: data.title,
    date: new Date().toISOString().slice(0, 10),
    modules,
    pendencias: [],
    signatures: {},
    createdAt: new Date().toISOString(),
  };
  db = { ...db, surveys: [s, ...db.surveys] };
  persist();
  return s;
}
export function updateSurvey(sid: string, data: Partial<Survey>) {
  db = {
    ...db,
    surveys: db.surveys.map((s) => (s.id === sid ? normalizeSurvey({ ...s, ...data }) : s)),
  };
  persist();
}
export function deleteSurvey(sid: string) {
  db = { ...db, surveys: db.surveys.filter((s) => s.id !== sid) };
  persist();
}

export function updateModule(sid: string, modId: string, patch: Partial<ModuleState>) {
  db = {
    ...db,
    surveys: db.surveys.map((s) =>
      s.id === sid
        ? {
            ...s,
            modules: {
              ...s.modules,
              [modId]: normalizeModuleState({ ...(s.modules[modId] ?? createModuleState()), ...patch }),
            },
          }
        : s,
    ),
  };
  persist();
}

export function setFieldValue(sid: string, modId: string, fieldId: string, value: any) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  const mod = survey.modules[modId];
  updateModule(sid, modId, {
    values: { ...mod.values, [fieldId]: value },
    status: mod.status === "nao_iniciado" ? "em_andamento" : mod.status,
  });
}

export function setFieldStatus(sid: string, modId: string, fieldId: string, status: FieldStatus) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  const mod = survey.modules[modId];
  updateModule(sid, modId, { fieldStatus: { ...mod.fieldStatus, [fieldId]: status } });
}

export function addAttachment(sid: string, modId: string, att: Attachment) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  const mod = survey.modules[modId];
  updateModule(sid, modId, { attachments: [...mod.attachments, att] });
}

export function removeAttachment(sid: string, modId: string, attId: string) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  const mod = survey.modules[modId];
  updateModule(sid, modId, { attachments: mod.attachments.filter((a) => a.id !== attId) });
}

export function addPendencia(sid: string, p: Omit<Pendencia, "id" | "createdAt">) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  const np: Pendencia = { ...p, id: id(), createdAt: new Date().toISOString() };
  updateSurvey(sid, { pendencias: [np, ...survey.pendencias] });
}
export function removePendencia(sid: string, pid: string) {
  const survey = db.surveys.find((s) => s.id === sid);
  if (!survey) return;
  updateSurvey(sid, { pendencias: survey.pendencias.filter((p) => p.id !== pid) });
}