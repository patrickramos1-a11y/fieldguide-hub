import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDBSelector, addTemplate, updateTemplate, removeTemplate, setTemplateDefault } from "@/lib/store";
import { SURVEY_TYPES, type SurveyType, type SurveyTemplate } from "@/lib/types";
import { MODULES, MODULES_BY_TYPE, FACTORY_TEMPLATES, getModulesForType } from "@/lib/modules";
import { Star, Pencil, Trash2, Copy, Plus, ChevronDown, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Templates de Levantamento" },
      { name: "description", content: "Gestão de módulos, subgrupos e templates por tipo de levantamento." },
    ],
  }),
  component: ConfiguracoesPage,
});

type EditorState = {
  open: boolean;
  template?: SurveyTemplate;
  type: SurveyType;
};

function ConfiguracoesPage() {
  const templates = useDBSelector(
    (s) => s.templates ?? [],
    (a, b) => a === b,
  );
  const [activeType, setActiveType] = useState<SurveyType>("geral");
  const [editor, setEditor] = useState<EditorState>({ open: false, type: "geral" });

  const userTemplates = templates.filter((t) => t.type === activeType);
  const factoryTemplates = FACTORY_TEMPLATES.filter((t) => t.type === activeType);
  const modulesOfType = getModulesForType(activeType);

  function openNew() {
    setEditor({ open: true, type: activeType, template: undefined });
  }
  function openEdit(tpl: SurveyTemplate) {
    setEditor({ open: true, type: tpl.type, template: tpl });
  }
  function cloneFactory(f: typeof FACTORY_TEMPLATES[number]) {
    const tpl: SurveyTemplate = {
      id: "draft",
      name: `${f.name} (cópia)`,
      type: f.type,
      moduleIds: [...f.moduleIds],
      createdAt: new Date().toISOString(),
    };
    setEditor({ open: true, type: f.type, template: tpl });
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie módulos, subgrupos e templates por tipo de levantamento. O template
            marcado como padrão é aplicado automaticamente em novos levantamentos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo template
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-5 mb-6">
        {SURVEY_TYPES.map((t) => {
          const active = t.id === activeType;
          const total = (templates.filter((x) => x.type === t.id).length) + FACTORY_TEMPLATES.filter((x) => x.type === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`text-left rounded-md border p-3 transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
              <div className="text-xs text-muted-foreground mt-1">{total} template(s)</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Templates de {SURVEY_TYPES.find((t) => t.id === activeType)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userTemplates.length === 0 && factoryTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum template ainda. Crie o primeiro.</p>
            )}
            {userTemplates.map((tpl) => (
              <TemplateRow
                key={tpl.id}
                template={tpl}
                onEdit={() => openEdit(tpl)}
                onSetDefault={(v) => setTemplateDefault(tpl.id, v)}
                onRemove={() => removeTemplate(tpl.id)}
              />
            ))}
            {factoryTemplates.length > 0 && (
              <>
                <div className="pt-2 text-xs uppercase tracking-wide text-muted-foreground">Templates de fábrica</div>
                {factoryTemplates.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-md border border-dashed border-border p-3">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {f.name}
                        <Badge variant="secondary" className="text-[10px]">Fábrica</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{f.moduleIds.length} módulos</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => cloneFactory(f)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Clonar e editar
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Módulos disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Módulos suportados para este tipo. Use os templates ao lado para escolher quais participam.
            </p>
            <ul className="space-y-1.5">
              {modulesOfType.map((m) => (
                <li key={m.id} className="text-sm flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 mt-0.5 text-primary" />
                  <div>
                    <div className="font-medium">{m.title}</div>
                    {m.subgroups && m.subgroups.length > 0 && (
                      <div className="text-xs text-muted-foreground">{m.subgroups.length} subgrupo(s)</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <TemplateEditor
        key={editor.template?.id ?? "new"}
        state={editor}
        onClose={() => setEditor((s) => ({ ...s, open: false }))}
      />
    </AppShell>
  );
}

function TemplateRow({
  template,
  onEdit,
  onSetDefault,
  onRemove,
}: {
  template: SurveyTemplate;
  onEdit: () => void;
  onSetDefault: (v: boolean) => void;
  onRemove: () => void;
}) {
  const overrides = template.subgroupOverrides ?? {};
  const overrideCount = Object.values(overrides).reduce((acc, arr) => acc + arr.length, 0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-secondary/50">
      <div className="min-w-0">
        <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
          {template.name}
          {template.isDefault && (
            <Badge className="text-[10px] gap-1"><Star className="h-3 w-3" /> Padrão</Badge>
          )}
        </div>
        {template.description && (
          <div className="text-xs text-muted-foreground">{template.description}</div>
        )}
        <div className="text-xs text-muted-foreground">
          {template.moduleIds.length} módulos
          {overrideCount > 0 && ` • ${overrideCount} subgrupo(s) ocultos`}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <Switch
            id={`def-${template.id}`}
            checked={!!template.isDefault}
            onCheckedChange={(v) => onSetDefault(!!v)}
          />
          <Label htmlFor={`def-${template.id}`} className="text-xs cursor-pointer">Padrão</Label>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover template</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Levantamentos já criados não serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onRemove}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function TemplateEditor({ state, onClose }: { state: EditorState; onClose: () => void }) {
  const isEditingExisting = !!state.template && state.template.id !== "draft";
  const initial = state.template;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isDefault, setIsDefault] = useState(!!initial?.isDefault);
  const initialModuleIds = useMemo(
    () => new Set(initial?.moduleIds ?? MODULES_BY_TYPE[state.type]),
    [initial, state.type],
  );
  const [moduleIds, setModuleIds] = useState<Set<string>>(initialModuleIds);
  const [overrides, setOverrides] = useState<Record<string, Set<string>>>(() => {
    const out: Record<string, Set<string>> = {};
    const o = initial?.subgroupOverrides ?? {};
    for (const k of Object.keys(o)) out[k] = new Set(o[k]);
    return out;
  });
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const allModules = getModulesForType(state.type);

  function toggleModule(id: string) {
    setModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSubgroup(modId: string, sgId: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      const cur = new Set(next[modId] ?? []);
      if (cur.has(sgId)) cur.delete(sgId);
      else cur.add(sgId);
      if (cur.size === 0) delete next[modId];
      else next[modId] = cur;
      return next;
    });
  }
  function toggleOpen(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do template.");
      return;
    }
    if (moduleIds.size === 0) {
      toast.error("Selecione ao menos um módulo.");
      return;
    }
    const subOv: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(overrides)) {
      if (v.size > 0) subOv[k] = Array.from(v);
    }
    const orderedIds = MODULES_BY_TYPE[state.type].filter((id) => moduleIds.has(id));
    if (isEditingExisting && initial) {
      updateTemplate(initial.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        type: state.type,
        moduleIds: orderedIds,
        subgroupOverrides: Object.keys(subOv).length ? subOv : undefined,
      });
      if (isDefault !== !!initial.isDefault) setTemplateDefault(initial.id, isDefault);
      toast.success("Template atualizado.");
    } else {
      const created = addTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        type: state.type,
        moduleIds: orderedIds,
        subgroupOverrides: Object.keys(subOv).length ? subOv : undefined,
        isDefault: false,
      });
      if (isDefault) setTemplateDefault(created.id, true);
      toast.success("Template criado.");
    }
    onClose();
  }

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditingExisting ? "Editar template" : "Novo template"}</DialogTitle>
          <DialogDescription>
            Selecione os módulos e subgrupos. Subgrupos desmarcados serão pré-marcados como “Não se aplica” em novos levantamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mb-4">
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-name">Nome</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Visita inicial completa" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
            <Textarea id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Quando usar este template…" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="tpl-def" checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
            <Label htmlFor="tpl-def" className="cursor-pointer">Marcar como padrão para este tipo</Label>
          </div>
        </div>

        <div className="rounded-md border border-border">
          <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold flex items-center justify-between">
            <span>Módulos e subgrupos</span>
            <span className="text-muted-foreground">
              {moduleIds.size} de {allModules.length} módulos
            </span>
          </div>
          <ul className="divide-y divide-border">
            {allModules.map((m) => {
              const checked = moduleIds.has(m.id);
              const subgroups = m.subgroups ?? [];
              const open = openModules.has(m.id);
              const disabledSubs = overrides[m.id] ?? new Set<string>();
              return (
                <li key={m.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`mod-${m.id}`}
                      checked={checked}
                      onCheckedChange={() => toggleModule(m.id)}
                    />
                    <Label htmlFor={`mod-${m.id}`} className="flex-1 cursor-pointer">
                      <span className="text-sm font-medium">{m.title}</span>
                      {m.description && (
                        <span className="block text-xs text-muted-foreground">{m.description}</span>
                      )}
                    </Label>
                    {subgroups.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOpen(m.id)}
                        className="h-7"
                      >
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="ml-1 text-xs">{subgroups.length - disabledSubs.size}/{subgroups.length} subgrupos</span>
                      </Button>
                    )}
                  </div>
                  {open && subgroups.length > 0 && checked && (
                    <ul className="mt-2 ml-7 grid gap-1.5">
                      {subgroups.map((sg) => {
                        const sgChecked = !disabledSubs.has(sg.id);
                        return (
                          <li key={sg.id} className="flex items-start gap-2">
                            <Checkbox
                              id={`sg-${m.id}-${sg.id}`}
                              checked={sgChecked}
                              onCheckedChange={() => toggleSubgroup(m.id, sg.id)}
                            />
                            <Label htmlFor={`sg-${m.id}-${sg.id}`} className="cursor-pointer text-xs">
                              <span className="font-medium">{sg.title}</span>
                              {sg.description && (
                                <span className="block text-muted-foreground">{sg.description}</span>
                              )}
                            </Label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
