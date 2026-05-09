import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB, addClient, deleteClient } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Ramos Engenharia" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cnpjCpf: "", address: "", contact: "", phone: "", email: "" });

  function submit() {
    if (!form.name.trim()) return;
    addClient(form);
    setForm({ name: "", cnpjCpf: "", address: "", contact: "", phone: "", email: "" });
    setOpen(false);
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{db.clients.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar cliente</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nome / Razão social *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>CNPJ / CPF</Label><Input value={form.cnpjCpf} onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })} /></div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contato</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {db.clients.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          Nenhum cliente. Cadastre o primeiro para começar.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {db.clients.map((c) => {
            const projs = db.projects.filter((p) => p.clientId === c.id).length;
            return (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <Link to="/clientes/$id" params={{ id: c.id }} className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.cnpjCpf || "—"} • {projs} projeto(s)
                    </div>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Excluir cliente e todos os projetos/levantamentos?")) deleteClient(c.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link to="/clientes/$id" params={{ id: c.id }}>
                    <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}