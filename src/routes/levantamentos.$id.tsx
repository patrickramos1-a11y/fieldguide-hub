import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB, updateModule, setFieldValue, setFieldStatus, addAttachment, removeAttachment, addPendencia, removePendencia, updateSurvey } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Paperclip, Plus, Trash2, AlertTriangle, CheckCircle2, FileDown } from "lucide-react";
import { useState } from "react";
import { getModulesForType } from "@/lib/modules";
import { FieldRenderer } from "@/components/FieldRenderer";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_LABELS, SURVEY_TYPES, type FieldStatus } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/levantamentos/$id")({
  component: SurveyEditor,
});

const STATUSES: FieldStatus[] = ["nao_iniciado", "em_andamento", "concluido", "pendente", "nao_se_aplica", "aguardando_documento", "aguardando_empresa", "requer_retorno"];

function SurveyEditor() {
  const { id } = Route.useParams();
  const db = useDB();
  const survey = db.surveys.find((s) => s.id === id);
  const [activeMod, setActiveMod] = useState<string>("identificacao");
  const [pendOpen, setPendOpen] = useState(false);
  const [pendForm, setPendForm] = useState({ description: "", responsible: "" });

  if (!survey) return <AppShell><p>Levantamento não encontrado.</p></AppShell>;

  const project = db.projects.find((p) => p.id === survey.projectId);
  const client = project ? db.clients.find((c) => c.id === project.clientId) : null;
  const modules = getModulesForType(survey.type);
  const current = modules.find((m) => m.id === activeMod) || modules[0];
  const state = survey.modules[current.id];
  const typeLabel = SURVEY_TYPES.find((t) => t.id === survey.type)!.label;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        addAttachment(survey!.id, current.id, {
          id: Math.random().toString(36).slice(2, 11),
          name: f.name,
          type: f.type,
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  return (
    <AppShell>
      <Link to="/levantamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4" /> Levantamentos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{client?.name} / {project?.name}</div>
          <h1 className="text-2xl font-semibold">{survey.title}</h1>
          <div className="text-sm text-muted-foreground">{typeLabel}</div>
        </div>
        <div className="flex gap-2">
          <Link to="/levantamentos/$id/resumo" params={{ id: survey.id }}>
            <Button variant="outline"><FileDown className="h-4 w-4 mr-1" /> Resumo / Exportar</Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card>
          <CardContent className="p-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">Módulos</div>
            <div className="grid">
              {modules.map((m) => {
                const st = survey.modules[m.id];
                const active = m.id === current.id;
                return (
                  <button key={m.id} onClick={() => setActiveMod(m.id)}
                    className={`text-left rounded-md px-2 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                    <div className="font-medium truncate">{m.title}</div>
                    <div className={`text-xs mt-0.5 ${active ? "opacity-90" : "text-muted-foreground"}`}>{STATUS_LABELS[st.status]}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{current.title}</h2>
                  {current.description && <p className="text-sm text-muted-foreground">{current.description}</p>}
                </div>
                <Select value={state.status} onValueChange={(v) => updateModule(survey.id, current.id, { status: v as FieldStatus })}>
                  <SelectTrigger className="w-auto h-8"><StatusBadge status={state.status} /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {current.fields.length > 0 && (
                <div className="grid gap-3">
                  {current.fields.map((f) => (
                    <FieldRenderer
                      key={f.id}
                      field={f}
                      value={state.values[f.id]}
                      status={state.fieldStatus[f.id] || "nao_iniciado"}
                      onChange={(v) => setFieldValue(survey.id, current.id, f.id, v)}
                      onStatus={(s) => setFieldStatus(survey.id, current.id, f.id, s)}
                    />
                  ))}
                </div>
              )}

              {current.subgroups && current.subgroups.length > 0 && (
                <Accordion type="multiple" defaultValue={current.subgroups.map((s) => s.id)} className="mt-2">
                  {current.subgroups.map((sg) => (
                    <AccordionItem key={sg.id} value={sg.id}>
                      <AccordionTrigger className="text-sm font-medium">{sg.title}</AccordionTrigger>
                      <AccordionContent>
                        {sg.description && <p className="text-xs text-muted-foreground mb-2">{sg.description}</p>}
                        <div className="grid gap-3">
                          {sg.fields.map((f) => (
                            <FieldRenderer
                              key={f.id}
                              field={f}
                              value={state.values[f.id]}
                              status={state.fieldStatus[f.id] || "nao_iniciado"}
                              onChange={(v) => setFieldValue(survey.id, current.id, f.id, v)}
                              onStatus={(s) => setFieldStatus(survey.id, current.id, f.id, s)}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              <div className="mt-5 grid gap-3">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Observações do módulo</Label>
                  <Textarea rows={2} value={state.notes ?? ""} onChange={(e) => updateModule(survey.id, current.id, { notes: e.target.value })} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> Anexos do módulo</Label>
                    <label className="cursor-pointer">
                      <input type="file" multiple className="hidden" onChange={handleFile} accept="image/*,application/pdf,audio/*" />
                      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"><Plus className="h-3 w-3" /> Adicionar</span>
                    </label>
                  </div>
                  {state.attachments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem anexos.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {state.attachments.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                          {a.type.startsWith("image/") ? (
                            <img src={a.dataUrl} alt={a.name} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded bg-secondary"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                          )}
                          <div className="min-w-0 flex-1"><div className="text-xs truncate">{a.name}</div><a href={a.dataUrl} download={a.name} className="text-xs text-primary">Baixar</a></div>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(survey.id, current.id, a.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--status-pending)]" /> Pendências do levantamento</h3>
                <Button size="sm" variant="outline" onClick={() => setPendOpen((v) => !v)}><Plus className="h-4 w-4 mr-1" /> Pendência</Button>
              </div>
              {pendOpen && (
                <div className="grid gap-2 mb-3 rounded-md border border-border p-3">
                  <Input placeholder="Descrição" value={pendForm.description} onChange={(e) => setPendForm({ ...pendForm, description: e.target.value })} />
                  <Input placeholder="Responsável" value={pendForm.responsible} onChange={(e) => setPendForm({ ...pendForm, responsible: e.target.value })} />
                  <Button size="sm" onClick={() => {
                    if (!pendForm.description.trim()) return;
                    addPendencia(survey.id, { module: current.title, description: pendForm.description, responsible: pendForm.responsible, status: "pendente" });
                    setPendForm({ description: "", responsible: "" }); setPendOpen(false);
                  }}>Adicionar</Button>
                </div>
              )}
              {survey.pendencias.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem pendências.</p>
              ) : (
                <div className="grid gap-2">
                  {survey.pendencias.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                      <div className="min-w-0">
                        <div className="text-sm truncate">{p.description}</div>
                        <div className="text-xs text-muted-foreground">{p.module} {p.responsible && `• ${p.responsible}`}</div>
                      </div>
                      <StatusBadge status={p.status} />
                      <Button variant="ghost" size="sm" onClick={() => removePendencia(survey.id, p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 grid sm:grid-cols-3 gap-3">
              <div><Label>Assinatura cliente</Label><Input value={survey.signatures.client ?? ""} onChange={(e) => updateSurvey(survey.id, { signatures: { ...survey.signatures, client: e.target.value } })} placeholder="Nome de quem assinou" /></div>
              <div><Label>Assinatura técnico</Label><Input value={survey.signatures.technician ?? ""} onChange={(e) => updateSurvey(survey.id, { signatures: { ...survey.signatures, technician: e.target.value } })} /></div>
              <div><Label>Data</Label><Input type="date" value={survey.signatures.date ?? ""} onChange={(e) => updateSurvey(survey.id, { signatures: { ...survey.signatures, date: e.target.value } })} /></div>
              <div className="sm:col-span-3 flex justify-end">
                <Link to="/levantamentos/$id/resumo" params={{ id: survey.id }}>
                  <Button><CheckCircle2 className="h-4 w-4 mr-1" /> Ver resumo final</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}