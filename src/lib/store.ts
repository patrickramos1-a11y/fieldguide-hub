import { useSyncExternalStore } from "react";
import type { Client, Project, Survey, ModuleState, FieldStatus, Pendencia, SurveyType, Attachment } from "./types";
import { getModulesForType } from "./modules";

const KEY = "ramos_eng_db_v1";

interface DB {
  clients: Client[];
  projects: Project[];
  surveys: Survey[];
}

function load(): DB {
  if (typeof window === "undefined") return { clients: [], projects: [], surveys: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { clients: [], projects: [], surveys: [] };
    return JSON.parse(raw);
  } catch {
    return { clients: [], projects: [], surveys: [] };
  }
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(db));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return db;
}

function getServerSnapshot(): DB {
  return { clients: [], projects: [], surveys: [] };
}

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
    clients: db.clients.filter((c) => c.id !== cid),
    projects: db.projects.filter((p) => p.clientId !== cid),
    surveys: db.surveys.filter((s) => {
      const proj = db.projects.find((p) => p.id === s.projectId);
      return proj && proj.clientId !== cid;
    }),
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
  db = { ...db, surveys: db.surveys.map((s) => (s.id === sid ? { ...s, ...data } : s)) };
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
        ? { ...s, modules: { ...s.modules, [modId]: { ...s.modules[modId], ...patch } } }
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