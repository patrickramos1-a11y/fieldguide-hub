import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getModulesForType, MODULE_PRESETS } from "@/lib/modules";
import type { SurveyType } from "@/lib/types";
import { useDB, addTemplate, removeTemplate } from "@/lib/store";
import { Trash2, Save } from "lucide-react";

const REQUIRED = new Set(["identificacao", "validacao"]);

interface Props {
  surveyType: SurveyType;
  initial?: string[];
  onConfirm: (ids: string[]) => void;
}

export function ModuleConfigStep({ surveyType, initial, onConfirm }: Props) {
  const all = getModulesForType(surveyType);
  const presets = MODULE_PRESETS[surveyType];
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial && initial.length ? initial : presets.all),
  );
  const db = useDB();
  const templates = useMemo(() => (db.templates ?? []).filter((t) => t.type === surveyType), [db.templates, surveyType]);
  const [tplName, setTplName] = useState("");

  function toggle(id: string) {
    if (REQUIRED.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function applyPreset(ids: string[]) {
    const next = new Set(ids);
    REQUIRED.forEach((r) => next.add(r));
    setSelected(next);
  }

  function saveAsTemplate() {
    const name = tplName.trim();
    if (!name) return;
    addTemplate({ name, type: surveyType, moduleIds: Array.from(selected) });
    setTplName("");
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-1">Configurar módulos do levantamento</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha quais módulos serão usados neste levantamento. Você pode alterar essa seleção depois.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => applyPreset(presets.all)}>Usar todos</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset(presets.minimal)}>Preset essencial</Button>
          <Button variant="ghost" size="sm" onClick={() => applyPreset([])}>Limpar</Button>
        </div>

        {templates.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Templates salvos</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {templates.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 pl-3 pr-1 py-0.5 text-xs">
                  <button type="button" className="hover:underline" onClick={() => applyPreset(t.moduleIds)}>{t.name}</button>
                  <button type="button" className="rounded-full p-1 hover:bg-secondary" onClick={() => removeTemplate(t.id)} aria-label="Remover template">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          {all.map((m) => {
            const required = REQUIRED.has(m.id);
            const checked = selected.has(m.id) || required;
            return (
              <label
                key={m.id}
                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(m.id)} disabled={required} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {m.title}
                    {required && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">obrigatório</span>}
                  </div>
                  {m.description && <div className="text-xs text-muted-foreground line-clamp-2">{m.description}</div>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{selected.size} módulos selecionados</Label>
          <Button onClick={() => onConfirm(Array.from(selected))}>Iniciar preenchimento</Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Input
            placeholder="Nome para salvar como template"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            className="max-w-xs h-8"
          />
          <Button variant="outline" size="sm" onClick={saveAsTemplate} disabled={!tplName.trim()}>
            <Save className="h-3.5 w-3.5 mr-1" /> Salvar como template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
