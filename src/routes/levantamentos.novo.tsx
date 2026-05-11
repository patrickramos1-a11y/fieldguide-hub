import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB, addSurvey, addClient, addProject } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SURVEY_TYPES, type SurveyType } from "@/lib/types";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/levantamentos/novo")({
  component: NovoPage,
});

function NovoPage() {
  const db = useDB();
  const nav = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<SurveyType>("geral");
  const [title, setTitle] = useState("");
  const [quickClientName, setQuickClientName] = useState("");
  const [quickProjectName, setQuickProjectName] = useState("");

  function submit() {
    if (!projectId) return;
    const s = addSurvey({ projectId, type, title: title || SURVEY_TYPES.find((t) => t.id === type)!.label });
    nav({ to: "/levantamentos/$id", params: { id: s.id } });
  }

  function quickCreateAndStart() {
    const cn = quickClientName.trim();
    const pn = quickProjectName.trim() || "Projeto inicial";
    if (!cn) return;
    const c = addClient({ name: cn, personType: "PJ" });
    const p = addProject({ clientId: c.id, name: pn });
    const s = addSurvey({ projectId: p.id, type, title: title || SURVEY_TYPES.find((t) => t.id === type)!.label });
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
                <label key={t.id} className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer ${type === t.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" className="mt-1" checked={type === t.id} onChange={() => setType(t.id)} />
                  <div>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </label>
              ))}
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