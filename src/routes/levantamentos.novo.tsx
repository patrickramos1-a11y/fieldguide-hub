import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  useDB, addSurveyExt, addClient, addProject, useCustomSurveyTypes,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SURVEY_TYPES, type SurveyType } from "@/lib/types";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { autoColor } from "@/lib/colors";

export const Route = createFileRoute("/levantamentos/novo")({
  component: NovoPage,
});

function NovoPage() {
  const db = useDB();
  const customTypes = useCustomSurveyTypes().filter((c) => !c.archivedAt);
  const nav = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<SurveyType>("geral");
  const [customTypeId, setCustomTypeId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [quickClientName, setQuickClientName] = useState("");
  const [quickProjectName, setQuickProjectName] = useState("");

  function selectBuiltin(id: SurveyType) {
    setType(id);
    setCustomTypeId(undefined);
  }
  function selectCustom(id: string, label: string) {
    setCustomTypeId(id);
    setType(id);
    if (!title) setTitle(label);
  }
  function defaultTitle() {
    if (customTypeId) {
      return customTypes.find((c) => c.id === customTypeId)?.label ?? "Levantamento";
    }
    return SURVEY_TYPES.find((t) => t.id === type)?.label ?? "Levantamento";
  }

  function submit() {
    if (!projectId) return;
    const s = addSurveyExt({ projectId, type, title: title || defaultTitle(), customTypeId });
    nav({ to: "/levantamentos/$id", params: { id: s.id } });
  }

  function quickCreateAndStart() {
    const cn = quickClientName.trim();
    const pn = quickProjectName.trim() || "Projeto inicial";
    if (!cn) return;
    const c = addClient({ name: cn, personType: "PJ" });
    const p = addProject({ clientId: c.id, name: pn });
    const s = addSurveyExt({ projectId: p.id, type, title: title || defaultTitle(), customTypeId });
    nav({ to: "/levantamentos/$id", params: { id: s.id } });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-6">Novo levantamento</h1>
      <Card className="max-w-2xl">
        <CardContent className="p-6 grid gap-5">
          <div>
            <Label>Projeto *</Label>
            {db.projects.length === 0 ? (
              <div className="mt-2 grid gap-2 rounded-md border border-dashed border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem projetos. Crie cliente e projeto rapidamente abaixo:
                </p>
                <Input placeholder="Nome do cliente *" value={quickClientName} onChange={(e) => setQuickClientName(e.target.value)} />
                <Input placeholder="Nome do projeto (opcional)" value={quickProjectName} onChange={(e) => setQuickProjectName(e.target.value)} />
              </div>
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {db.projects.map((p) => {
                    const c = db.clients.find((c) => c.id === p.clientId);
                    const e = p.empreendimentoId ? db.empreendimentos.find((e) => e.id === p.empreendimentoId) : null;
                    return <SelectItem key={p.id} value={p.id}>{c?.name} — {p.name}{e ? ` (${e.name})` : ""}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label className="mb-2 block">Tipo de levantamento</Label>
            <div className="grid gap-2">
              {SURVEY_TYPES.map((t) => (
                <label key={t.id} className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer ${!customTypeId && type === t.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" className="mt-1" checked={!customTypeId && type === t.id} onChange={() => selectBuiltin(t.id)} />
                  <div>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </label>
              ))}
              {customTypes.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Tipos personalizados
                  </div>
                  <div className="grid gap-2">
                    {customTypes.map((c) => (
                      <label key={c.id} className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer ${customTypeId === c.id ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="radio" className="mt-1" checked={customTypeId === c.id} onChange={() => selectCustom(c.id, c.label)} />
                        <span className="mt-1 inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: c.color ?? autoColor(c.id) }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium flex items-center gap-2">
                            {c.label}
                            <Badge variant="outline" className="text-[10px]">Personalizado</Badge>
                          </div>
                          {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {c.moduleBindings.length} módulo(s) vinculado(s)
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div><Label>Título (opcional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          {db.projects.length === 0 ? (
            <Button onClick={quickCreateAndStart} disabled={!quickClientName.trim()}>Criar cliente e iniciar levantamento</Button>
          ) : (
            <Button onClick={submit} disabled={!projectId}>Criar levantamento</Button>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}