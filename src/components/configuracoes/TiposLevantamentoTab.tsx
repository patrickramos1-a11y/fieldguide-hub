import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  useCustomSurveyTypes,
  createCustomSurveyType,
  deleteCustomSurveyType,
  duplicateCustomSurveyType,
} from "@/lib/store";
import { MODULES } from "@/lib/modules";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { autoColor } from "@/lib/colors";
import { getTypeIcon } from "@/lib/typeIcons";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight, Layers, ListTree, FileText, Plus, Pencil, Copy, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export function TiposLevantamentoTab() {
  const types = useCustomSurveyTypes().filter((c) => !c.archivedAt);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mantém uma seleção válida quando a lista muda.
  useEffect(() => {
    if (!types.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !types.find((t) => t.id === selectedId)) {
      setSelectedId(types[0].id);
    }
  }, [types, selectedId]);

  function handleCreate() {
    const ct = createCustomSurveyType({ label: "Novo tipo de levantamento" });
    toast.success("Tipo criado. Configure os módulos no construtor.");
    setSelectedId(ct.id);
    navigate({ to: "/configuracoes/tipos/$typeId", params: { typeId: ct.id } });
  }

  return (
    <div className="space-y-4">
      {/* Header / CTA */}
      <Card className="border-dashed">
        <CardContent className="py-3 flex flex-wrap items-center gap-3">
          <Layers className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Tipos de levantamento</div>
            <p className="text-xs text-muted-foreground">
              Cada tipo define um conjunto próprio de módulos, subgrupos e campos.
              Edite, duplique ou remova livremente — todos seguem a mesma estrutura.
            </p>
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Criar novo tipo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Coluna 1 — Lista única de tipos */}
        <Card className="h-fit">
          <CardContent className="p-2">
            <ul className="space-y-0.5">
              {types.length === 0 && (
                <li className="px-2.5 py-2 text-[11px] text-muted-foreground">
                  Nenhum tipo cadastrado.
                </li>
              )}
              {types.map((c) => {
                const Icon = getTypeIcon(c.icon);
                const color = c.color ?? autoColor(c.id);
                const isActive = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                          style={{ backgroundColor: color, color: "white" }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium leading-tight truncate flex-1">
                          {c.label}
                        </span>
                        <Badge
                          variant={isActive ? "secondary" : "outline"}
                          className="text-[10px] shrink-0"
                        >
                          {c.moduleBindings.length}
                        </Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Coluna 2 — Detalhes */}
        <div className="space-y-3">
          {selectedId
            ? <TypeDetail typeId={selectedId} />
            : <div className="text-sm text-muted-foreground">Selecione um tipo na lista.</div>}
        </div>
      </div>
    </div>
  );
}

function TypeDetail({ typeId }: { typeId: string }) {
  const types = useCustomSurveyTypes();
  const ct = types.find((c) => c.id === typeId);
  const navigate = useNavigate();
  if (!ct) {
    return <div className="text-sm text-muted-foreground">Tipo não encontrado.</div>;
  }
  const Icon = getTypeIcon(ct.icon);
  const color = ct.color ?? autoColor(ct.id);
  const linkedModules = ct.moduleBindings
    .map((b) => MODULES.find((m) => m.id === b.moduleId))
    .filter(Boolean) as typeof MODULES;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-md shrink-0"
            style={{ backgroundColor: color, color: "white" }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{ct.label}</h3>
            {ct.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{ct.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/configuracoes/tipos/$typeId" params={{ typeId: ct.id }}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar tipo
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const c = duplicateCustomSurveyType(ct.id);
              if (c) toast.success("Tipo duplicado.");
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir tipo de levantamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se houver levantamentos vinculados a este tipo, ele será arquivado em vez de
                  excluído permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteCustomSurveyType(ct.id);
                    toast.success("Tipo removido.");
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {linkedModules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Este tipo ainda não tem módulos vinculados.
            </p>
            <Button asChild size="sm">
              <Link to="/configuracoes/tipos/$typeId" params={{ typeId: ct.id }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Abrir construtor
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ModuleListReadonly
          modules={linkedModules}
          onOpen={() => navigate({ to: "/configuracoes/tipos/$typeId", params: { typeId: ct.id } })}
        />
      )}
    </>
  );
}

function ModuleListReadonly({
  modules, onOpen,
}: {
  modules: typeof MODULES;
  onOpen: () => void;
}) {
  return (
    <div className="grid gap-2">
      {modules.map((m, idx) => {
        const subs = m.subgroups?.length ?? 0;
        const fields = (m.fields?.length ?? 0)
          + (m.subgroups ?? []).reduce((acc, s) => acc + s.fields.length, 0);
        return (
          <Card key={m.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground w-6">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.title}</div>
                {m.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                )}
                <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1">
                    <ListTree className="h-3 w-3" /> {subs} subgrupo(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {fields} campo(s)
                  </span>
                </div>
              </div>
              <button
                onClick={onOpen}
                className="text-xs inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Layers className="h-3.5 w-3.5" /> Ver estrutura
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
