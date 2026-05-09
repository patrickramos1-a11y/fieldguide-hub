import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileJson, FileText } from "lucide-react";
import { getModulesForType } from "@/lib/modules";
import { SURVEY_TYPES, STATUS_LABELS } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/levantamentos/$id/resumo")({
  component: ResumoPage,
});

function fmtVal(v: any): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ") || "—";
  if (typeof v === "object") {
    if ("lat" in v) return `lat ${v.lat}, lng ${v.lng}${v.accuracy ? ` (~${Math.round(v.accuracy)}m)` : ""}`;
    return JSON.stringify(v);
  }
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

function ResumoPage() {
  const { id } = Route.useParams();
  const db = useDB();
  const survey = db.surveys.find((s) => s.id === id);
  if (!survey) return <AppShell><p>Não encontrado.</p></AppShell>;
  const project = db.projects.find((p) => p.id === survey.projectId);
  const client = project ? db.clients.find((c) => c.id === project.clientId) : null;
  const modules = getModulesForType(survey.type);
  const typeLabel = SURVEY_TYPES.find((t) => t.id === survey.type)!.label;

  function buildMarkdown() {
    const lines: string[] = [];
    lines.push(`# Levantamento: ${survey!.title}`);
    lines.push(``);
    lines.push(`- **Tipo:** ${typeLabel}`);
    lines.push(`- **Cliente:** ${client?.name ?? "—"}`);
    lines.push(`- **Projeto:** ${project?.name ?? "—"}`);
    lines.push(`- **Data:** ${survey!.date}`);
    lines.push(``);
    modules.forEach((m) => {
      const st = survey!.modules[m.id];
      lines.push(`## ${m.title}`);
      lines.push(`Status: ${STATUS_LABELS[st.status]}`);
      lines.push(``);
      m.fields.forEach((f) => {
        lines.push(`- **${f.label}:** ${fmtVal(st.values[f.id])}`);
      });
      m.subgroups?.forEach((sg) => {
        lines.push(`### ${sg.title}`);
        sg.fields.forEach((f) => {
          lines.push(`- **${f.label}:** ${fmtVal(st.values[f.id])}`);
        });
        lines.push(``);
      });
      if (st.notes) lines.push(`\nObservações: ${st.notes}`);
      if (st.attachments.length) lines.push(`\nAnexos: ${st.attachments.map((a) => a.name).join(", ")}`);
      lines.push(``);
    });
    if (survey!.pendencias.length) {
      lines.push(`## Pendências`);
      survey!.pendencias.forEach((p) => lines.push(`- [${STATUS_LABELS[p.status]}] (${p.module}) ${p.description}${p.responsible ? ` — ${p.responsible}` : ""}`));
      lines.push(``);
    }
    lines.push(`## Validação`);
    lines.push(`- Cliente: ${survey!.signatures.client ?? "—"}`);
    lines.push(`- Técnico: ${survey!.signatures.technician ?? "—"}`);
    lines.push(`- Data: ${survey!.signatures.date ?? "—"}`);
    return lines.join("\n");
  }

  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const md = buildMarkdown();

  return (
    <AppShell>
      <Link to="/levantamentos/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar ao preenchimento
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{client?.name} / {project?.name}</div>
          <h1 className="text-2xl font-semibold">{survey.title}</h1>
          <div className="text-sm text-muted-foreground">{typeLabel}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download(`${survey.title}.md`, md, "text/markdown")}>
            <FileText className="h-4 w-4 mr-1" /> Markdown
          </Button>
          <Button variant="outline" onClick={() => download(`${survey.title}.json`, JSON.stringify({ survey, client, project }, null, 2), "application/json")}>
            <FileJson className="h-4 w-4 mr-1" /> JSON
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-1" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <div className="space-y-4 print:space-y-2">
        {modules.map((m) => {
          const st = survey.modules[m.id];
          return (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">{m.title}</h2>
                  <StatusBadge status={st.status} />
                </div>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {m.fields.map((f) => (
                    <div key={f.id} className="flex justify-between gap-3 border-b border-border/50 py-1">
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="text-right font-medium">{fmtVal(st.values[f.id])}</dd>
                    </div>
                  ))}
                </dl>
                {m.subgroups?.length ? (
                  <div className="mt-4 space-y-4">
                    {m.subgroups.map((sg) => (
                      <div key={sg.id} className="rounded-md border border-border/60 p-4">
                        <div className="mb-2">
                          <h3 className="text-sm font-semibold">{sg.title}</h3>
                          {sg.description ? <p className="text-xs text-muted-foreground">{sg.description}</p> : null}
                        </div>
                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {sg.fields.map((f) => (
                            <div key={f.id} className="flex justify-between gap-3 border-b border-border/50 py-1">
                              <dt className="text-muted-foreground">{f.label}</dt>
                              <dd className="text-right font-medium">{fmtVal(st.values[f.id])}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : null}
                {st.notes && <p className="text-sm mt-3 text-muted-foreground italic">{st.notes}</p>}
                {st.attachments.length > 0 && (
                  <div className="mt-3 grid sm:grid-cols-3 gap-2">
                    {st.attachments.filter((a) => a.type.startsWith("image/")).map((a) => (
                      <img key={a.id} src={a.dataUrl} alt={a.name} className="rounded-md border border-border h-32 w-full object-cover" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card><CardContent className="p-5">
          <h2 className="font-semibold mb-3">Pendências consolidadas</h2>
          {survey.pendencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pendência registrada neste levantamento.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {survey.pendencias.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                  <span><strong>{p.module}:</strong> {p.description} {p.responsible && <em>— {p.responsible}</em>}</span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>

        {survey.pendencias.length > 0 && (
          <Card><CardContent className="p-5">
            <h2 className="font-semibold mb-3">Resumo de pendências por módulo</h2>
            <ul className="space-y-2 text-sm">
              {Array.from(new Set(survey.pendencias.map((p) => p.module))).map((moduleName) => {
                const count = survey.pendencias.filter((p) => p.module === moduleName).length;
                return <li key={moduleName} className="flex items-center justify-between border-b border-border/50 py-1"><span>{moduleName}</span><span className="font-medium">{count}</span></li>;
              })}
            </ul>
          </CardContent></Card>
        )}

        <Card><CardContent className="p-5">
          <h2 className="font-semibold mb-3">Validação e Encerramento</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted-foreground">Cliente</div><div className="border-t border-border pt-2 mt-8 font-medium">{survey.signatures.client ?? "—"}</div></div>
            <div><div className="text-muted-foreground">Técnico</div><div className="border-t border-border pt-2 mt-8 font-medium">{survey.signatures.technician ?? "—"}</div></div>
            <div><div className="text-muted-foreground">Data</div><div className="border-t border-border pt-2 mt-8 font-medium">{survey.signatures.date ?? "—"}</div></div>
          </div>
        </CardContent></Card>
      </div>
    </AppShell>
  );
}