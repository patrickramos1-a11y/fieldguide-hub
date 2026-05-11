import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDB, addClient, deleteClient } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Ramos Engenharia" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addClient({ name: trimmed, personType: "PJ" });
    setName("");
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
          <Button type="button" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo cliente</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
            <div className="grid gap-2">
              <Label>Nome do cliente *</Label>
              <Input
                autoFocus
                value={name}
                placeholder="Ex.: Empresa XYZ Ltda"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              />
              <p className="text-xs text-muted-foreground">
                Você pode complementar CNPJ, endereço, contatos e representante depois, abrindo o cliente.
              </p>
            </div>
            <DialogFooter><Button onClick={submit} disabled={!name.trim()}>Criar cliente</Button></DialogFooter>
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