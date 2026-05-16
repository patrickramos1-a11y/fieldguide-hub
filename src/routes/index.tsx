import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getSurveyTypeMeta, useCustomSurveyTypes, useDBSelector } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FolderKanban, Users, Plus, ArrowRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ramos Engenharia" },
      { name: "description", content: "Plataforma de levantamento técnico e ambiental." },
    ],
  }),
  component: Index,
});

function Index() {
  const customTypes = useCustomSurveyTypes().filter((type) => !type.archivedAt);
  const { clientCount, empreendimentoCount, projectCount, surveys, recent } = useDBSelector(
    (state) => ({
      clientCount: state.clients.length,
      empreendimentoCount: state.empreendimentos.length,
      projectCount: state.projects.length,
      surveys: state.surveys,
      recent: state.surveys.slice(0, 5),
    }),
    (prev, next) =>
      prev.clientCount === next.clientCount &&
      prev.empreendimentoCount === next.empreendimentoCount &&
      prev.projectCount === next.projectCount &&
      prev.surveys === next.surveys &&
      prev.recent === next.recent,
  );
  const stats = [
    { label: "Clientes", value: clientCount, icon: Users, to: "/clientes" as const },
    { label: "Empreendimentos", value: empreendimentoCount, icon: Building2, to: "/clientes" as const },
    { label: "Projetos", value: projectCount, icon: FolderKanban, to: "/projetos" as const },
    { label: "Levantamentos", value: surveys.length, icon: ClipboardList, to: "/levantamentos" as const },
  ];
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Painel de levantamentos</h1>
          <p className="text-sm text-muted-foreground">Livro digital guiado de campo — Ramos Engenharia</p>
        </div>
        <Link to="/levantamentos/novo">
          <Button><Plus className="h-4 w-4 mr-1" /> Novo levantamento</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-semibold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Levantamentos recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum levantamento ainda. Comece criando um cliente.</p>
            )}
            {recent.map((s) => {
              const t = getSurveyTypeMeta(s.type, s.customTypeId);
              return (
                <Link key={s.id} to="/levantamentos/$id" params={{ id: s.id }}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-secondary">
                  <div>
                    <div className="font-medium text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{t.label} • {new Date(s.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tipos de levantamento</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {customTypes.map((t) => (
              <div key={t.id} className="rounded-md border border-border p-3">
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
