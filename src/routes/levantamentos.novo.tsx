import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  useDB, addSurveyExt, addClient, addProject, useCustomSurveyTypes,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type SurveyType } from "@/lib/types";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { autoColor } from "@/lib/colors";
import { getTypeIcon } from "@/lib/typeIcons";

export const Route = createFileRoute("/levantamentos/novo")({
  component: NovoPage,
});

function NovoPage() {
  const db = useDB();
  const allTypes = useCustomSurveyTypes().filter((c) => !c.archivedAt);
  const nav = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [customTypeId, setCustomTypeId] = useState<string | undefined>(allTypes[0]?.id);
  const [title, setTitle] = useState("");
  const [quickClientName, setQuickClientName] = useState("");
  const [quickProjectName, setQuickProjectName] = useState("");

  const selected = allTypes.find((c) => c.id === customTypeId) ?? allTypes[0];
  const effectiveType: SurveyType = (selected?.sourceTypeId as SurveyType | undefined) ?? selected?.id ?? "geral";

  function selectType(id: string, label: string) {
    setCustomTypeId(id);
    if (!title) setTitle(label);
  }
  function defaultTitle() {
    return selected?.label ?? "Levantamento";
  }

  function submit() {
    if (!projectId || !selected) return;
    const s = addSurveyExt({
      projectId,
      type: effectiveType,
      title: title || defaultTitle(),
      customTypeId: selected.id,
    });
    nav({ to: "/levantamentos/$id", params: { id: s.id } });
  }

  function quickCreateAndStart() {
    const cn = quickClientName.trim();
    const pn = quickProjectName.trim() || "Projeto inicial";
    if (!cn || !selected) return;
    const c = addClient({ name: cn, personType: "PJ" });
    const p = addProject({ clientId: c.id, name: pn });
    const s = addSurveyExt({
      projectId: p.id,
      type: effectiveType,
      title: title || defaultTitle(),
      customTypeId: selected.id,
    });
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
              {allTypes.map((c) => {
                const Icon = getTypeIcon(c.icon);
                const isActive = customTypeId === c.id;
                const color = c.color ?? autoColor(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={isActive}
                      onChange={() => selectType(c.id, c.label)}
                    />
                    <span
                      className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md shrink-0"
                      style={{ backgroundColor: color, color: "white" }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.label}</div>
                      {c.description && (
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {c.moduleBindings.length} módulo(s) vinculado(s)
                      </div>
                    </div>
                  </label>
                );
              })}
              {allTypes.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Nenhum tipo cadastrado. Crie um em Configurações → Tipos de levantamento.
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