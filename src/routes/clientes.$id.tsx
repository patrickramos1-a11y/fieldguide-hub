import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB, addProject, deleteProject } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, FolderKanban } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/clientes/$id")({
  component: ClienteDetail,
});

function ClienteDetail() {
  const { id } = Route.useParams();
  const db = useDB();
  const nav = useNavigate();
  const client = db.clients.find((c) => c.id === id);
  const projects = db.projects.filter((p) => p.clientId === id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  if (!client) return <AppShell><p>Cliente não encontrado.</p></AppShell>;

  function submit() {
    if (!form.name.trim()) return;
    const p = addProject({ clientId: id, ...form });
    setForm({ name: "", description: "" });
    setOpen(false);
    nav({ to: "/projetos/$id", params: { id: p.id } });
  }

  return (
    <AppShell>
      <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>
      <Card className="mb-6">
        <CardHeader><CardTitle>{client.name}</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">CNPJ/CPF: </span>{client.cnpjCpf || "—"}</div>
          <div><span className="text-muted-foreground">Endereço: </span>{client.address || "—"}</div>
          <div><span className="text-muted-foreground">Contato: </span>{client.contact || "—"}</div>
          <div><span className="text-muted-foreground">Telefone: </span>{client.phone || "—"}</div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">E-mail: </span>{client.email || "—"}</div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Projetos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo projeto</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nome do projeto *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit}>Criar projeto</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Sem projetos cadastrados.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <Link to="/projetos/$id" params={{ id: p.id }} className="flex-1 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><FolderKanban className="h-4 w-4" /></div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.description || "—"}</div>
                  </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Excluir projeto?")) deleteProject(p.id); }}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}