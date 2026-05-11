import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  useDBSelector, updateModule, setFieldValue, setFieldStatus, addAttachment,
  removeAttachment, addPendencia, removePendencia, setFieldNote, setFieldNA,
  setEnabledModules, useDBStatus, setModuleNA, setSubgroupNA, enableModule,
} from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft, FileText, Paperclip, Plus, Trash2, AlertTriangle, CheckCircle2,
  FileDown, Settings2, Files, ClipboardList, Signature, ChevronRight, Ban, Check, EyeOff,
} from "lucide-react";
import {
  getModulesForType, shouldShowField, CENTRAL_TAB_MODULES,
  computeModuleStatus, computeSubgroupStatus, subgroupProgress,
} from "@/lib/modules";
import { FieldRenderer } from "@/components/FieldRenderer";
import { StatusBadge } from "@/components/StatusBadge";
import { ModuleConfigStep } from "@/components/ModuleConfigStep";
import { SURVEY_TYPES, type FieldStatus, type FieldDef, type SubgroupDef, type ModuleState } from "@/lib/types";

export const Route = createFileRoute("/levantamentos/$id/")({
  component: SurveyEditor,
});

type VirtualTab = "__documentos" | "__pendencias" | "__encerramento";

function SurveyEditor() {
  const { id } = Route.useParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { hydrated, persistPending, persistenceError } = useDBStatus();
  const data = useDBSelector(
    (state) => {
      const survey = state.surveys.find((s) => s.id === id);
      const project = survey ? state.projects.find((p) => p.id === survey.projectId) ?? null : null;
      const client = project ? state.clients.find((c) => c.id === project.clientId) ?? null : null;
      return { survey, project, client };
    },
    (a, b) => a.survey === b.survey && a.project === b.project && a.client === b.client,
  );
  const { survey, project, client } = data;

  const [activeTab, setActiveTab] = useState<string>("identificacao");

  if (!mounted || !hydrated) return <AppShell><p>Carregando levantamento...</p></AppShell>;
  if (!survey) return <AppShell><p>Levantamento não encontrado.</p></AppShell>;

  // ---- Etapa de configuração inicial ----
  if (!survey.enabledModules || survey.enabledModules.length === 0) {
    return (
      <AppShell>
        <Link to="/levantamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Levantamentos
        </Link>
        <div className="mb-4">
          <div className="text-xs text-muted-foreground">{client?.name} / {project?.name}</div>
          <h1 className="text-2xl font-semibold">{survey.title}</h1>
          {(persistPending || persistenceError) && <p className="text-xs text-muted-foreground mt-1">{persistenceError ?? "Salvando alterações..."}</p>}
        </div>
        <ModuleConfigStep
          surveyType={survey.type}
          onConfirm={(ids) => setEnabledModules(survey.id, ids.length ? ids : ["identificacao", "validacao"])}
        />
      </AppShell>
    );
  }

  return (
    <SurveyEditorReady
      survey={survey}
      projectName={project?.name ?? ""}
      clientName={client?.name ?? ""}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      persistPending={persistPending}
      persistenceError={persistenceError}
    />
  );
}

function SurveyEditorReady({ survey, projectName, clientName, activeTab, setActiveTab, persistPending, persistenceError }: {
  survey: any; projectName: string; clientName: string; activeTab: string; setActiveTab: (t: string) => void; persistPending?: boolean; persistenceError?: string;
}) {
  const allModules = getModulesForType(survey.type);
  const enabled: string[] = survey.enabledModules ?? allModules.map((m: any) => m.id);
  const enabledSet = useMemo(() => new Set(enabled), [enabled]);
  // Tabs comuns (módulos habilitados que não são centralizados)
  const regularTabs = allModules.filter((m) => enabledSet.has(m.id) && !CENTRAL_TAB_MODULES.has(m.id));
  const hasDocs = enabledSet.has("documentos");
  const hasValidacao = enabledSet.has("validacao");

  // Módulos disponíveis mas não selecionados (excluindo centrais e obrigatórios)
  const hiddenModules = allModules.filter(
    (m) => !enabledSet.has(m.id) && !CENTRAL_TAB_MODULES.has(m.id),
  );

  // Contadores agregados
  const counters = useMemo(() => {
    const c = { concluido: 0, em_andamento: 0, nao_iniciado: 0, nao_se_aplica: 0, pendente: 0 };
    for (const m of regularTabs) {
      const st = computeModuleStatus(m, survey.modules[m.id] as ModuleState);
      if (st === "concluido") c.concluido++;
      else if (st === "em_andamento") c.em_andamento++;
      else if (st === "nao_se_aplica") c.nao_se_aplica++;
      else if (st === "pendente") c.pendente++;
      else c.nao_iniciado++;
    }
    return c;
  }, [regularTabs, survey.modules]);

  const typeLabel = SURVEY_TYPES.find((t) => t.id === survey.type)!.label;

  // Resolve aba ativa
  const isVirtual = (activeTab as VirtualTab) === "__documentos" || (activeTab as VirtualTab) === "__pendencias" || (activeTab as VirtualTab) === "__encerramento";
  const activeModule = !isVirtual ? regularTabs.find((m) => m.id === activeTab) ?? regularTabs[0] : null;

  return (
    <AppShell>
      <Link to="/levantamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4" /> Levantamentos
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{clientName} / {projectName}</div>
          <h1 className="text-2xl font-semibold">{survey.title}</h1>
          <div className="text-sm text-muted-foreground">{typeLabel}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <CounterChip tone="done" icon={<Check className="h-3 w-3" />} value={counters.concluido} label="concluídos" />
            <CounterChip tone="progress" value={counters.em_andamento} label="em andamento" />
            <CounterChip tone="todo" value={counters.nao_iniciado} label="não iniciados" />
            {counters.nao_se_aplica > 0 && <CounterChip tone="na" value={counters.nao_se_aplica} label="N/A" />}
            {counters.pendente > 0 && <CounterChip tone="pending" value={counters.pendente} label="pendência" />}
          </div>
          {(persistPending || persistenceError) && <div className="text-xs text-muted-foreground mt-1">{persistenceError ?? "Salvando alterações..."}</div>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEnabledModules(survey.id, [])}>
            <Settings2 className="h-4 w-4 mr-1" /> Reconfigurar módulos
          </Button>
          <Link to="/levantamentos/$id/resumo" params={{ id: survey.id }}>
            <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-1" /> Ver resumo</Button>
          </Link>
        </div>
      </div>

      {/* Tabs no topo, scrollable */}
      <div className="mb-4 overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max pb-2">
          {regularTabs.map((m) => {
            const st = survey.modules[m.id] as ModuleState;
            const eff = computeModuleStatus(m, st);
            const active = activeTab === m.id;
            const done = eff === "concluido";
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors whitespace-nowrap flex items-center gap-2 border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}
                style={!active && done ? { borderColor: `var(--status-done)` } : undefined}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" style={{ color: active ? undefined : "var(--status-done)" }} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--status-${statusVarSuffix(eff)})` }} />
                )}
                <span>{m.title}</span>
              </button>
            );
          })}
          {hiddenModules.length > 0 && (
            <HiddenModulesPill survey={survey} hidden={hiddenModules} />
          )}
          <span className="self-center text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
          {hasDocs && (
            <TabPill icon={<Files className="h-3.5 w-3.5" />} active={activeTab === "__documentos"} onClick={() => setActiveTab("__documentos")}>Documentos</TabPill>
          )}
          <TabPill icon={<ClipboardList className="h-3.5 w-3.5" />} active={activeTab === "__pendencias"} onClick={() => setActiveTab("__pendencias")}>
            Pendências{survey.pendencias.length > 0 && <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[var(--status-pending)] text-white text-[10px] h-4 min-w-4 px-1">{survey.pendencias.length}</span>}
          </TabPill>
          {hasValidacao && (
            <TabPill icon={<Signature className="h-3.5 w-3.5" />} active={activeTab === "__encerramento"} onClick={() => setActiveTab("__encerramento")}>Encerramento</TabPill>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {activeModule && <ModulePanel survey={survey} module={activeModule} />}
      {activeTab === "__documentos" && <DocumentsPanel survey={survey} />}
      {activeTab === "__pendencias" && <PendenciasPanel survey={survey} />}
      {activeTab === "__encerramento" && <EncerramentoPanel survey={survey} />}
    </AppShell>
  );
}

function statusVarSuffix(s: FieldStatus): string {
  switch (s) {
    case "nao_iniciado": return "todo";
    case "em_andamento": return "progress";
    case "concluido": return "done";
    case "pendente": return "pending";
    case "nao_se_aplica": return "na";
    case "aguardando_documento": return "doc";
    case "aguardando_empresa": return "company";
    case "requer_retorno": return "return";
  }
}

function TabPill({ children, active, onClick, icon }: { children: React.ReactNode; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${active ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}
    >
      {icon} {children}
    </button>
  );
}

// =========================== ModulePanel ============================

function ModulePanel({ survey, module: m }: { survey: any; module: any }) {
  const state = survey.modules[m.id];
  const values = state.values;
  const fieldStatusMap = state.fieldStatus;
  const fieldNotes = state.fieldNotes ?? {};
  const naMap = state.nonApplicable ?? {};

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFieldValue(survey.id, m.id, fieldId, value);
  }, [survey.id, m.id]);
  const handleFieldStatus = useCallback((fieldId: string, s: FieldStatus) => setFieldStatus(survey.id, m.id, fieldId, s), [survey.id, m.id]);
  const handleNote = useCallback((fieldId: string, note: string) => setFieldNote(survey.id, m.id, fieldId, note), [survey.id, m.id]);
  const handleNA = useCallback((fieldId: string, na: boolean) => setFieldNA(survey.id, m.id, fieldId, na), [survey.id, m.id]);

  function renderField(f: FieldDef) {
    if (!shouldShowField(f, values)) return null;
    return (
      <FieldRenderer
        key={f.id}
        field={f}
        value={values[f.id]}
        status={fieldStatusMap[f.id] || "nao_iniciado"}
        note={fieldNotes[f.id]}
        na={!!naMap[f.id]}
        onChange={(v) => handleFieldChange(f.id, v)}
        onStatus={(s) => handleFieldStatus(f.id, s)}
        onNote={(n) => handleNote(f.id, n)}
        onNA={(na) => handleNA(f.id, na)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">{m.title}</h2>
            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
          </div>
          <Select value={state.status} onValueChange={(v) => updateModule(survey.id, m.id, { status: v as FieldStatus })}>
            <SelectTrigger className="w-auto h-8"><StatusBadge status={state.status} /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {m.fields.length > 0 && <div className="grid gap-2.5">{m.fields.map(renderField)}</div>}

        {m.subgroups && m.subgroups.length > 0 && (
          <div className="mt-2 grid gap-3">
            {m.subgroups.map((sg: SubgroupDef) => (
              <SubgroupBlock key={sg.id} subgroup={sg} renderField={renderField} values={values} naMap={naMap} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubgroupBlock({ subgroup, renderField, values, naMap }: { subgroup: SubgroupDef; renderField: (f: FieldDef) => React.ReactNode; values: Record<string, any>; naMap: Record<string, boolean> }) {
  const visibleFields = subgroup.fields.filter((f) => shouldShowField(f, values));
  const filled = visibleFields.filter((f) => {
    const v = values[f.id];
    return v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;
  const naCount = visibleFields.filter((f) => naMap[f.id]).length;
  const [open, setOpen] = useState(() => filled === 0);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 p-3 hover:bg-secondary/40 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold">{subgroup.title}</div>
          {subgroup.description && <div className="text-xs text-muted-foreground line-clamp-1">{subgroup.description}</div>}
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {filled}/{visibleFields.length} preenchidos{naCount ? ` • ${naCount} N/A` : ""}
        </div>
      </button>
      {open && (
        <div className="border-t border-border p-3 grid gap-2.5">
          {visibleFields.map(renderField)}
        </div>
      )}
    </div>
  );
}

// =========================== Documentos ============================

function DocumentsPanel({ survey }: { survey: any }) {
  const docState = survey.modules.documentos;
  const allAttachments: Array<{ moduleId: string; moduleTitle: string; att: any }> = [];
  const allModules = getModulesForType(survey.type);
  for (const m of allModules) {
    const st = survey.modules[m.id];
    if (!st) continue;
    for (const att of st.attachments) {
      allAttachments.push({ moduleId: m.id, moduleTitle: m.title, att });
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        addAttachment(survey.id, "documentos", {
          id: Math.random().toString(36).slice(2, 11),
          name: f.name, type: f.type, dataUrl: reader.result as string,
          createdAt: new Date().toISOString(), moduleTag: "documentos",
        });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Files className="h-5 w-5" /> Documentos e Anexos</h2>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleFile} accept="image/*,application/pdf,audio/*" />
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"><Plus className="h-4 w-4" /> Adicionar arquivo</span>
            </label>
          </div>
          {allAttachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento anexado neste levantamento.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allAttachments.map(({ moduleId, moduleTitle, att }) => (
                <div key={att.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                  {att.type.startsWith("image/") ? (
                    <img src={att.dataUrl} alt={att.name} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded bg-secondary"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{att.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{moduleTitle}</div>
                    <a href={att.dataUrl} download={att.name} className="text-xs text-primary">Baixar</a>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAttachment(survey.id, moduleId, att.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subgrupos e campos próprios do módulo documentos */}
      <ModulePanel survey={survey} module={getModulesForType(survey.type).find((m) => m.id === "documentos")!} />
    </div>
  );
}

// =========================== Pendências ============================

function PendenciasPanel({ survey }: { survey: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ module: "", description: "", responsible: "" });
  const allModules = getModulesForType(survey.type);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--status-pending)]" /> Pendências do levantamento
          </h2>
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}><Plus className="h-4 w-4 mr-1" /> Nova pendência</Button>
        </div>
        {open && (
          <div className="grid gap-2 mb-3 rounded-md border border-border p-3">
            <Select value={form.module} onValueChange={(v) => setForm({ ...form, module: v })}>
              <SelectTrigger><SelectValue placeholder="Módulo de origem" /></SelectTrigger>
              <SelectContent>
                {allModules.map((m) => <SelectItem key={m.id} value={m.title}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea rows={2} placeholder="Descrição da pendência" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Responsável" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setForm({ module: "", description: "", responsible: "" }); }}>Cancelar</Button>
              <Button size="sm" onClick={() => {
                if (!form.description.trim()) return;
                addPendencia(survey.id, { module: form.module || "Geral", description: form.description, responsible: form.responsible, status: "pendente" });
                setForm({ module: "", description: "", responsible: "" }); setOpen(false);
              }}>Adicionar</Button>
            </div>
          </div>
        )}
        {survey.pendencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem pendências.</p>
        ) : (
          <div className="grid gap-2">
            {survey.pendencias.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{p.description}</div>
                  <div className="text-xs text-muted-foreground">{p.module}{p.responsible && ` • ${p.responsible}`}</div>
                </div>
                <StatusBadge status={p.status} />
                <Button variant="ghost" size="sm" onClick={() => removePendencia(survey.id, p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =========================== Encerramento ============================

function EncerramentoPanel({ survey }: { survey: any }) {
  const validacao = survey.modules.validacao;
  const allModules = getModulesForType(survey.type);
  const enabledIds: string[] = survey.enabledModules ?? allModules.map((m) => m.id);
  const enabledModules = allModules.filter((m) => enabledIds.includes(m.id));

  const concluidos = enabledModules.filter((m) => survey.modules[m.id]?.status === "concluido");
  const naMods = enabledModules.filter((m) => survey.modules[m.id]?.status === "nao_se_aplica");
  const emAndamento = enabledModules.filter((m) => !["concluido", "nao_se_aplica"].includes(survey.modules[m.id]?.status));
  const pendAbertas = survey.pendencias.filter((p: any) => p.status !== "concluido");
  const pendResolvidas = survey.pendencias.filter((p: any) => p.status === "concluido");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Signature className="h-5 w-5" /> Validação e Encerramento</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div><Label>Assinatura cliente</Label><Input value={validacao?.values.assinatura_cliente ?? ""} onChange={(e) => setFieldValue(survey.id, "validacao", "assinatura_cliente", e.target.value)} placeholder="Nome de quem assinou" /></div>
            <div><Label>Assinatura técnico</Label><Input value={validacao?.values.assinatura_tecnico ?? ""} onChange={(e) => setFieldValue(survey.id, "validacao", "assinatura_tecnico", e.target.value)} /></div>
            <div><Label>Data</Label><Input type="date" value={validacao?.values.data_validacao ?? ""} onChange={(e) => setFieldValue(survey.id, "validacao", "data_validacao", e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => updateModule(survey.id, "validacao", { status: "concluido" })}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como concluído
            </Button>
            <Link to="/levantamentos/$id/resumo" params={{ id: survey.id }}>
              <Button><FileDown className="h-4 w-4 mr-1" /> Ver resumo final</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Resumo dos módulos</h3>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <SummaryRow label="Concluídos" items={concluidos.map((m) => m.title)} tone="done" />
            <SummaryRow label="Em andamento" items={emAndamento.map((m) => m.title)} tone="progress" />
            <SummaryRow label="Não se aplica" items={naMods.map((m) => m.title)} tone="na" />
            <SummaryRow label="Pendências abertas" items={pendAbertas.map((p: any) => `${p.module}: ${p.description}`)} tone="pending" />
          </div>
          {pendResolvidas.length > 0 && (
            <div className="mt-3 text-sm">
              <SummaryRow label="Pendências resolvidas" items={pendResolvidas.map((p: any) => `${p.module}: ${p.description}`)} tone="done" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label} ({items.length})</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <ul className="text-xs space-y-0.5 list-disc list-inside">
          {items.slice(0, 8).map((s, i) => <li key={i} className="truncate">{s}</li>)}
          {items.length > 8 && <li className="text-muted-foreground">+ {items.length - 8} mais…</li>}
        </ul>
      )}
    </div>
  );
}
