import { useMemo, useState } from "react";
import { MODULES, MODULES_BY_TYPE, getModulesForType } from "@/lib/modules";
import { SURVEY_TYPES, type SurveyType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, Layers } from "lucide-react";

type Hit = {
  type: SurveyType[];
  moduleId: string;
  moduleTitle: string;
  subgroupId?: string;
  subgroupTitle?: string;
  fieldId?: string;
  fieldLabel?: string;
  match: "module" | "subgroup" | "field" | "option";
  matched: string;
};

export function BuscaGlobalTab({ onOpen }: { onOpen: (moduleId: string) => void }) {
  const [q, setQ] = useState("");

  const hits: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];

    const usage: Record<string, SurveyType[]> = {};
    for (const m of MODULES) usage[m.id] = [];
    for (const [type, ids] of Object.entries(MODULES_BY_TYPE) as [SurveyType, string[]][]) {
      for (const id of ids) usage[id]?.push(type);
    }

    const seenModules = new Map<string, ReturnType<typeof getModulesForType>[number]>();
    for (const t of SURVEY_TYPES) for (const m of getModulesForType(t.id)) if (!seenModules.has(m.id)) seenModules.set(m.id, m);

    const out: Hit[] = [];
    for (const m of seenModules.values()) {
      const types = usage[m.id] ?? [];
      if (m.title.toLowerCase().includes(term) || (m.description ?? "").toLowerCase().includes(term)) {
        out.push({ type: types, moduleId: m.id, moduleTitle: m.title, match: "module", matched: m.title });
      }
      for (const sg of m.subgroups ?? []) {
        if (sg.title.toLowerCase().includes(term)) {
          out.push({ type: types, moduleId: m.id, moduleTitle: m.title, subgroupId: sg.id, subgroupTitle: sg.title, match: "subgroup", matched: sg.title });
        }
        for (const f of sg.fields) {
          if (f.label.toLowerCase().includes(term) || f.id.toLowerCase().includes(term)) {
            out.push({ type: types, moduleId: m.id, moduleTitle: m.title, subgroupId: sg.id, subgroupTitle: sg.title, fieldId: f.id, fieldLabel: f.label, match: "field", matched: f.label });
          }
          for (const opt of f.options ?? []) {
            if (opt.toLowerCase().includes(term)) {
              out.push({ type: types, moduleId: m.id, moduleTitle: m.title, subgroupId: sg.id, subgroupTitle: sg.title, fieldId: f.id, fieldLabel: f.label, match: "option", matched: opt });
            }
          }
        }
      }
    }
    return out.slice(0, 200);
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-2xl">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tipo, módulo, subgrupo, campo ou opção (mín. 2 caracteres)…"
          className="pl-10 h-11"
        />
      </div>

      {q.trim().length < 2 && (
        <p className="text-xs text-muted-foreground">
          Exemplos: "profundidade", "poço", "ETE", "outorga", "vazão"
        </p>
      )}

      {q.trim().length >= 2 && hits.length === 0 && (
        <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado.</CardContent></Card>
      )}

      <div className="space-y-1.5">
        {hits.map((h, i) => (
          <button
            key={i}
            onClick={() => onOpen(h.moduleId)}
            className="w-full text-left rounded-md border bg-card hover:border-primary/40 hover:bg-secondary/40 transition-colors px-3 py-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] capitalize">{h.match === "option" ? "opção" : h.match === "field" ? "campo" : h.match === "subgroup" ? "subgrupo" : "módulo"}</Badge>
              <span className="text-sm font-medium">{h.matched}</span>
              <span className="ml-auto text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Layers className="h-3 w-3" /> Abrir estrutura <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {h.type.map((t) => SURVEY_TYPES.find((s) => s.id === t)?.label.split(" ")[0]).filter(Boolean).join(" · ") || "Sem tipo"}
              {" › "}{h.moduleTitle}
              {h.subgroupTitle && <> {" › "}{h.subgroupTitle}</>}
              {h.fieldLabel && h.match !== "field" && <> {" › "}{h.fieldLabel}</>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
