import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SURVEY_TYPES, MODULE_PURPOSE_LABELS, type SurveyType } from "@/lib/types";
import { getModulesForType, MODULE_PRESETS, MODULES } from "@/lib/modules";
import {
  useCustomSurveyTypes,
  createCustomSurveyType,
  deleteCustomSurveyType,
  duplicateCustomSurveyType,
} from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { autoColor } from "@/lib/colors";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight, Layers, ListTree, FileText, Plus, Pencil, Copy, Trash2, Sparkles, ShieldCheck, Archive,
} from "lucide-react";
import { toast } from "sonner";

type Selection =
  | { kind: "builtin"; id: SurveyType }
  | { kind: "custom"; id: string };

export function TiposLevantamentoTab({ onOpenStructure }: { onOpenStructure: (moduleId: string) => void }) {
  const customs = useCustomSurveyTypes();
  const activeList = customs.filter((c) => !c.archivedAt);
  const [sel, setSel] = useState<Selection>({ kind: "builtin", id: "geral" });

  function handleCreate() {
    const ct = createCustomSurveyType({ label: "Novo tipo de levantamento" });
    toast.success("Tipo criado. Configure os módulos no construtor.");
    setSel({ kind: "custom", id: ct.id });
  }

  return (
    <div className="space-y-4">
      {/* Header / CTA */}
      <Card className="border-dashed">
        <CardContent className="py-3 flex flex-wrap items-center gap-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Tipos de levantamento</div>
            <p className="text-xs text-muted-foreground">
              Tipos padrão são compartilhados e seguem a estrutura global. Crie tipos personalizados
              para definir um conjunto próprio de módulos, subgrupos e campos sem afetar os demais.
            </p>
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Criar novo tipo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Coluna 1 — Lista de tipos */}
        <Card className="h-fit">
          <CardContent className="p-2 space-y-3">
            <div>
              <div className="px-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Padrão
              </div>
              <ul className="space-y-0.5">
                {SURVEY_TYPES.map((t) => {
                  const count = getModulesForType(t.id).length;
                  const isActive = sel.kind === "builtin" && t.id === sel.id;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setSel({ kind: "builtin", id: t.id })}
                        className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium leading-tight truncate">{t.label}</span>
                          <Badge variant={isActive ? "secondary" : "outline"} className="text-[10px] shrink-0">
                            {count}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <div className="px-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Personalizados</span>
                <Badge variant="outline" className="text-[10px]">{activeList.length}</Badge>
              </div>
              <ul className="space-y-0.5">
                {activeList.length === 0 && (
                  <li className="px-2.5 py-2 text-[11px] text-muted-foreground">
                    Nenhum tipo personalizado ainda.
                  </li>
                )}
                {activeList.map((c) => {
                  const isActive = sel.kind === "custom" && c.id === sel.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSel({ kind: "custom", id: c.id })}
                        className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ background: c.color || "var(--primary)" }}
                          />
                          <span className="text-sm font-medium leading-tight truncate flex-1">{c.label}</span>
                          <Badge variant={isActive ? "secondary" : "outline"} className="text-[10px] shrink-0">
                            {c.moduleBindings.length}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Coluna 2 — Detalhes */}
        <div className="space-y-3">
          {sel.kind === "builtin"
            ? <BuiltinDetail typeId={sel.id} onOpenStructure={onOpenStructure} />
            : <CustomDetail typeId={sel.id} onOpenStructure={onOpenStructure} />}
        </div>
      </div>
    </div>
  );
}

function BuiltinDetail({ typeId, onOpenStructure }: { typeId: SurveyType; onOpenStructure: (moduleId: string) => void }) {
  const t = SURVEY_TYPES.find((x) => x.id === typeId)!;
  const modules = getModulesForType(typeId);
  const minimal = new Set(MODULE_PRESETS[typeId].minimal);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{t.label}</h3>
            <Badge variant="outline" className="text-[10px]"><ShieldCheck className="h-3 w-3 mr-1" /> Padrão</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t.description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const ct = createCustomSurveyType({
              label: `${t.label} (personalizado)`,
              description: t.description,
            });
            // Adiciona todos os módulos do tipo padrão
            // (CRUD direto via store happens after create)
            // Importa lazy:
            import("@/lib/store").then(({ addTypeModule }) => {
              for (const m of modules) addTypeModule(ct.id, m.id, minimal.has(m.id) ? "recomendado" : "opcional");
              toast.success("Tipo personalizado criado a partir do padrão.");
            });
          }}
        >
          <Copy className="h-3.5 w-3.5 mr-1" /> Duplicar como personalizado
        </Button>
      </header>

      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground bg-muted/30">
        Tipos padrão usam a <span className="font-medium text-foreground">estrutura global</span>.
        Para alterar campos, vá em <span className="font-medium text-foreground">Estrutura dos formulários</span>.
        As mudanças refletirão em todos os tipos que usam o módulo.
      </div>

      <ModuleListReadonly modules={modules} minimal={minimal} onOpenStructure={onOpenStructure} />
    </>
  );
}

function CustomDetail({ typeId, onOpenStructure }: { typeId: string; onOpenStructure: (moduleId: string) => void }) {
  const customs = useCustomSurveyTypes();
  const ct = customs.find((c) => c.id === typeId);
  if (!ct) {
    return <div className="text-sm text-muted-foreground">Tipo não encontrado.</div>;
  }
  const linkedModules = ct.moduleBindings
    .map((b) => MODULES.find((m) => m.id === b.moduleId))
    .filter(Boolean) as typeof MODULES;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: ct.color || "var(--primary)" }}
            />
            <h3 className="text-base font-semibold truncate">{ct.label}</h3>
            <Badge className="text-[10px]"><Sparkles className="h-3 w-3 mr-1" /> Personalizado</Badge>
          </div>
          {ct.description && <p className="text-xs text-muted-foreground mt-0.5">{ct.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/configuracoes/tipos/$typeId" params={{ typeId: ct.id }}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar tipo
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const c = duplicateCustomSurveyType(ct.id);
            if (c) toast.success("Tipo duplicado.");
          }}>
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
                <AlertDialogTitle>Excluir tipo personalizado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se houver levantamentos vinculados, o tipo será arquivado em vez de excluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { deleteCustomSurveyType(ct.id); toast.success("Tipo removido."); }}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="rounded-md border p-3 text-xs bg-amber-500/10 border-amber-500/30">
        Edições neste tipo são <span className="font-medium">escopadas</span>: ocultar/renomear/criar
        campos aqui não muda os módulos originais nem outros tipos.
      </div>

      {linkedModules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Este tipo ainda não tem módulos vinculados.</p>
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
          minimal={new Set(ct.moduleBindings.filter((b) => b.requirement !== "opcional").map((b) => b.moduleId))}
          onOpenStructure={onOpenStructure}
        />
      )}
    </>
  );
}

function ModuleListReadonly({
  modules, minimal, onOpenStructure,
}: {
  modules: typeof MODULES;
  minimal: Set<string>;
  onOpenStructure: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {modules.map((m, idx) => {
        const isMin = minimal.has(m.id);
        const subs = m.subgroups?.length ?? 0;
        const fields = (m.fields?.length ?? 0) + (m.subgroups ?? []).reduce((acc, s) => acc + s.fields.length, 0);
        return (
          <Card key={m.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground w-6">{String(idx + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{m.title}</span>
                  {isMin && <Badge className="text-[10px]">Recomendado</Badge>}
                  {(m.purposes ?? []).map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {MODULE_PURPOSE_LABELS[p]}
                    </Badge>
                  ))}
                </div>
                {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1"><ListTree className="h-3 w-3" /> {subs} subgrupo(s)</span>
                  <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> {fields} campo(s)</span>
                </div>
              </div>
              <button
                onClick={() => onOpenStructure(m.id)}
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
