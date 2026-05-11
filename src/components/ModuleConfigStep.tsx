import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getModulesForType, MODULE_PRESETS } from "@/lib/modules";
import type { SurveyType } from "@/lib/types";

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
      </CardContent>
    </Card>
  );
}
