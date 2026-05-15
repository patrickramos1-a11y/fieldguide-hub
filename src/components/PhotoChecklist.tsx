import { useMemo, useState } from "react";
import {
  PHOTO_CHECKLISTS,
  ALL_TEMPLATE_KEYS,
  defaultTemplateKeysFor,
  composeItemId,
  type PhotoChecklistKey,
} from "@/lib/photoChecklists";
import {
  setPhotoChecklistKeys,
  setPhotoAnswer,
  setPhotoNote,
  setPhotoLiberadoDivulgacao,
  bulkSetPhotoAnswers,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Plus, X, MessageSquare } from "lucide-react";
import type { ModuleState, Survey } from "@/lib/types";

interface Props {
  survey: Survey;
  moduleState: ModuleState;
}

export function PhotoChecklist({ survey, moduleState }: Props) {
  const activeKeys: PhotoChecklistKey[] = useMemo(() => {
    const stored = (moduleState.photoChecklistKeys ?? []) as PhotoChecklistKey[];
    return stored.length ? stored : defaultTemplateKeysFor(survey.type);
  }, [moduleState.photoChecklistKeys, survey.type]);

  const answers = moduleState.photoChecklist ?? [];
  const answerMap = useMemo(
    () => new Map(answers.map((a) => [a.itemId, a] as const)),
    [answers],
  );

  const remainingKeys = ALL_TEMPLATE_KEYS.filter((k) => !activeKeys.includes(k));

  function addTemplate(key: PhotoChecklistKey) {
    setPhotoChecklistKeys(survey.id, [...activeKeys, key]);
  }
  function removeTemplate(key: PhotoChecklistKey) {
    setPhotoChecklistKeys(survey.id, activeKeys.filter((k) => k !== key));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Modelos ativos:</span>
        {activeKeys.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs"
          >
            {PHOTO_CHECKLISTS[k].title}
            {activeKeys.length > 1 && (
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeTemplate(k)}
                aria-label="Remover modelo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {remainingKeys.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Adicionar checklist
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1">
              <div className="grid">
                {remainingKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="text-left text-sm px-2 py-1.5 rounded hover:bg-accent"
                    onClick={() => addTemplate(k)}
                  >
                    {PHOTO_CHECKLISTS[k].title}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {activeKeys.map((key) => {
        const tpl = PHOTO_CHECKLISTS[key];
        return (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold">{tpl.title}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => bulkSetPhotoAnswers(survey.id, key, tpl.items, true)}
                  >
                    Todos Sim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => bulkSetPhotoAnswers(survey.id, key, tpl.items, false)}
                  >
                    Todos Não
                  </Button>
                </div>
              </div>
              <ul className="grid gap-1.5">
                {tpl.items.map((it) => {
                  const composed = composeItemId(key, it.id);
                  const ans = answerMap.get(composed);
                  const reg = ans?.registrado;
                  return (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5"
                    >
                      <span className="text-sm flex-1 min-w-0 break-words">{it.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <SimNaoToggle
                          value={reg}
                          onChange={(v) =>
                            setPhotoAnswer(survey.id, key, it.id, it.label, v)
                          }
                        />
                        <NotePopover
                          value={ans?.observacao ?? ""}
                          onChange={(v) => {
                            // garante que o item exista antes de salvar a nota
                            if (!ans) {
                              setPhotoAnswer(survey.id, key, it.id, it.label, true);
                            }
                            setPhotoNote(survey.id, composed, v);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {key === "post" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-2.5">
                  <span className="text-sm font-medium">Liberado para divulgação?</span>
                  <SimNaoToggle
                    value={moduleState.photoLiberadoDivulgacao}
                    onChange={(v) => setPhotoLiberadoDivulgacao(survey.id, v)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SimNaoToggle({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  const base = "h-7 px-3 text-xs font-medium rounded-md border transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={base}
        style={
          value === true
            ? { background: "var(--status-done)", color: "white", borderColor: "var(--status-done)" }
            : { background: "transparent", color: "inherit", borderColor: "var(--border)" }
        }
        aria-pressed={value === true}
      >
        <Check className="h-3 w-3 inline -mt-0.5 mr-0.5" />Sim
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={base}
        style={
          value === false
            ? { background: "var(--muted)", color: "var(--muted-foreground)", borderColor: "var(--border)" }
            : { background: "transparent", color: "inherit", borderColor: "var(--border)" }
        }
        aria-pressed={value === false}
      >
        Não
      </button>
    </div>
  );
}

function NotePopover({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Popover
      onOpenChange={(open) => {
        if (open) setDraft(value);
        else if (draft !== value) onChange(draft);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={value ? "Observação registrada" : "Adicionar observação"}
        >
          <MessageSquare
            className="h-3.5 w-3.5"
            style={value ? { color: "var(--status-done)" } : undefined}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Observação opcional"
          className="h-8 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}