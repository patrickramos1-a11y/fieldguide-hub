import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { SURVEY_TYPES } from "@/lib/types";

export const Route = createFileRoute("/levantamentos/")({
  head: () => ({ meta: [{ title: "Levantamentos — Ramos Engenharia" }] }),
  component: ListPage,
});

function ListPage() {
  const db = useDB();
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Levantamentos</h1>
          <p className="text-sm text-muted-foreground">{db.surveys.length} no total</p>
        </div>
        <Link to="/levantamentos/novo"><Button><Plus className="h-4 w-4 mr-1" /> Novo</Button></Link>
      </div>
      {db.surveys.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          Nenhum levantamento cadastrado.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {db.surveys.map((s) => {
            const t = SURVEY_TYPES.find((t) => t.id === s.type)!;
            const proj = db.projects.find((p) => p.id === s.projectId);
            const client = proj ? db.clients.find((c) => c.id === proj.clientId) : null;
            const total = Object.keys(s.modules).length;
            const done = Object.values(s.modules).filter((m) => m.status === "concluido").length;
            return (
              <Link key={s.id} to="/levantamentos/$id" params={{ id: s.id }}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><ClipboardList className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.label} • {client?.name} / {proj?.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{done}/{total} módulos</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}