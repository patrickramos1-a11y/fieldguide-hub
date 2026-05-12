import { useState } from "react";
import { SURVEY_TYPES, MODULE_PURPOSE_LABELS, type SurveyType } from "@/lib/types";
import { getModulesForType, MODULE_PRESETS } from "@/lib/modules";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Layers, ListTree, FileText } from "lucide-react";

export function TiposLevantamentoTab({ onOpenStructure }: { onOpenStructure: (moduleId: string) => void }) {
  const [active, setActive] = useState<SurveyType>("geral");
  const modules = getModulesForType(active);
  const minimal = new Set(MODULE_PRESETS[active].minimal);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <CardContent className="p-2">
          <ul className="space-y-0.5">
            {SURVEY_TYPES.map((t) => {
              const count = getModulesForType(t.id).length;
              const isActive = t.id === active;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setActive(t.id)}
                    className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">{t.label}</span>
                      <Badge variant={isActive ? "secondary" : "outline"} className="text-[10px]">
                        {count}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <header>
          <h3 className="text-base font-semibold">{SURVEY_TYPES.find((t) => t.id === active)?.label}</h3>
          <p className="text-xs text-muted-foreground">{SURVEY_TYPES.find((t) => t.id === active)?.description}</p>
        </header>

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
      </div>
    </div>
  );
}
