import { memo, useEffect, useState } from "react";
import type { FieldDef, FieldStatus, Person, HoursValue, HoursTurno, HoursPreset } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Ban, Pencil, Plus, Trash2, User, Phone, Mail, Briefcase, IdCard, Clock, Copy, Check, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { GeometryManager } from "./geom/GeometryManager";
import type { SurveyGeometry } from "@/lib/geometryTypes";

interface Props {
  field: FieldDef;
  value: any;
  status: FieldStatus;
  note?: string;
  na?: boolean;
  onChange: (value: any) => void;
  onStatus: (s: FieldStatus) => void;
  onNote?: (note: string) => void;
  onNA?: (na: boolean) => void;
  moduleValues?: Record<string, any>;
}

const STATUS_OPTIONS: FieldStatus[] = [
  "nao_iniciado", "em_andamento", "concluido", "pendente",
  "nao_se_aplica", "aguardando_documento", "aguardando_empresa", "requer_retorno",
];

function hasValue(v: unknown) {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.preset === "string" && o.preset) return true;
    if (Array.isArray(o.turnos) && (o.turnos as unknown[]).length > 0) return true;
    return Object.values(o).some((x) => x !== "" && x != null);
  }
  return true;
}

function summarize(field: FieldDef, value: any): string {
  if (!hasValue(value)) return "—";
  if (field.type === "boolean") return value ? "Sim" : "Não";
  if (field.type === "coords" && typeof value === "object") return `${value.lat ?? "?"}, ${value.lng ?? "?"}`;
  if (field.type === "geometries" && Array.isArray(value)) {
    const arr = value as SurveyGeometry[];
    const p = arr.filter((g) => g.kind === "point").length;
    const l = arr.filter((g) => g.kind === "line").length;
    const pl = arr.filter((g) => g.kind === "polygon").length;
    const parts: string[] = [];
    if (p) parts.push(`${p} ponto(s)`);
    if (l) parts.push(`${l} linha(s)`);
    if (pl) parts.push(`${pl} polígono(s)`);
    return parts.join(" · ") || "—";
  }
  if (field.type === "people" && Array.isArray(value)) {
    const names = (value as Person[]).map((p) => p.nome).filter(Boolean);
    return `${value.length} pessoa(s)${names.length ? `: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}` : ""}`;
  }
  if (field.type === "hours-presets" && typeof value === "object") {
    const v = value as HoursValue;
    const presetLabel = HOURS_PRESET_LABEL[v.preset ?? "outro"];
    const turnos = v.turnos?.length ? ` · ${v.turnos.length} turno(s)` : "";
    return `${presetLabel}${turnos}`;
  }
  if (field.type === "repeater" && Array.isArray(value)) {
    return `${value.length} item(ns)`;
  }
  if (field.type === "apply-to-sides" && typeof value === "object") {
    const sides = field.sides ?? ["Frente", "Fundos", "Lado direito", "Lado esquerdo"];
    const filled = sides.filter((s) => (value as Record<string, string>)[s]).length;
    return `${filled}/${sides.length} lados`;
  }
  if (field.type === "number" && field.unitOptions && typeof value === "object" && value !== null) {
    return `${(value as any).value ?? ""} ${(value as any).unit ?? ""}`.trim();
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

const HOURS_PRESET_LABEL: Record<HoursPreset, string> = {
  comercial: "Padrão (08–12 / 14–18, Seg–Sáb)",
  "2turnos": "2 turnos (06–14 / 14–22)",
  "3turnos": "3 turnos",
  "24h": "24 horas",
  outro: "Outro / personalizado",
};

const HOURS_PRESET_DEFAULTS: Record<HoursPreset, HoursTurno[]> = {
  comercial: [
    { id: "t1", inicio: "08:00", fim: "12:00", label: "1º turno" },
    { id: "t2", inicio: "14:00", fim: "18:00", label: "2º turno" },
  ],
  "2turnos": [
    { id: "t1", inicio: "06:00", fim: "14:00", label: "1º turno" },
    { id: "t2", inicio: "14:00", fim: "22:00", label: "2º turno" },
  ],
  "3turnos": [
    { id: "t1", inicio: "06:00", fim: "14:00", label: "1º turno" },
    { id: "t2", inicio: "14:00", fim: "22:00", label: "2º turno" },
    { id: "t3", inicio: "22:00", fim: "06:00", label: "3º turno" },
  ],
  "24h": [{ id: "t1", inicio: "00:00", fim: "23:59", label: "Operação contínua" }],
  outro: [],
};

const HOURS_PRESET_DIAS: Record<HoursPreset, string[]> = {
  comercial: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  "2turnos": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  "3turnos": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  "24h": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  outro: ["Seg", "Ter", "Qua", "Qui", "Sex"],
};

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function onlyDigits(s: string): string {
  return (s ?? "").replace(/\D+/g, "");
}
function formatPhoneBR(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ============================ NumberField (estrito) ===========================
function NumberField({ field, value, onChange, onBlur, moduleValues }: { field: FieldDef; value: any; onChange: (v: any) => void; onBlur: () => void; moduleValues?: Record<string, any> }) {
  const allowDecimal = field.decimal !== false;
  const useUnit = !!field.unitOptions?.length;
  const v = useUnit && typeof value === "object" && value !== null ? value : { value: value ?? "", unit: useUnit ? field.unitOptions![0] : undefined };
  const cur: string = String(useUnit ? (v.value ?? "") : (value ?? ""));
  const unit: string | undefined = useUnit ? v.unit : undefined;

  function setVal(next: string) {
    // Filtra: aceita apenas dígitos e (opcionalmente) um separador decimal
    const re = allowDecimal ? /[^0-9.,]/g : /[^0-9]/g;
    let cleaned = next.replace(re, "");
    if (allowDecimal) {
      // normaliza vírgula para ponto e mantém apenas o primeiro
      cleaned = cleaned.replace(",", ".");
      const parts = cleaned.split(".");
      if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    if (useUnit) onChange({ value: cleaned, unit });
    else onChange(cleaned);
  }
  function setUnit(u: string) {
    onChange({ value: cur, unit: u });
  }
  // Sugestão de área a partir das dimensões do terreno
  let suggestion: number | null = null;
  if (field.suggestFrom?.kind === "areaFromDims" && moduleValues) {
    const num = (k: string) => {
      const r = moduleValues[k];
      const x = typeof r === "object" && r ? r.value : r;
      const n = parseFloat(String(x ?? "").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };
    const f = num("dim_frente"), fu = num("dim_fundos"), ld = num("dim_lado_dir"), le = num("dim_lado_esq");
    const larg = (f && fu) ? (f + fu) / 2 : (f || fu);
    const comp = (ld && le) ? (ld + le) / 2 : (ld || le);
    if (larg > 0 && comp > 0) suggestion = Math.round(larg * comp);
  }
  return (
    <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      <Input
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={cur}
        placeholder={field.placeholder}
        onChange={(e) => setVal(e.target.value)}
        onBlur={onBlur}
      />
      {field.presets && field.presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {field.presets.map((p) => (
            <button key={String(p)} type="button" onClick={() => setVal(String(p))}
              className="text-[11px] rounded-full px-2 py-0.5 border border-border hover:bg-secondary">
              {p}
            </button>
          ))}
        </div>
      )}
      {useUnit && (
        <Select value={unit ?? ""} onValueChange={setUnit}>
          <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
          <SelectContent>{field.unitOptions!.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
      {suggestion !== null && Number(cur) !== suggestion && (
        <button type="button" onClick={() => setVal(String(suggestion))}
          className="self-start text-[11px] rounded-full px-2 py-0.5 border border-dashed border-primary/60 text-primary hover:bg-primary/10">
          Calcular ≈ {suggestion} m² (frente × lateral)
        </button>
      )}
    </div>
  );
}

// ============================ QuantityField (stepper) ========================
function QuantityField({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const n = (() => {
    const x = typeof value === "object" && value ? value.value : value;
    const p = parseInt(String(x ?? "0"), 10);
    return Number.isFinite(p) ? p : 0;
  })();
  function set(next: number) { onChange(Math.max(0, next)); }
  return (
    <div className="inline-flex items-center gap-1">
      <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => set(n - 1)}>−</Button>
      <Input className="h-8 w-16 text-center" inputMode="numeric" value={String(n)}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} />
      <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => set(n + 1)}>+</Button>
    </div>
  );
}

// ============================ ButtonSelectField ===============================
function ButtonSelectField({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const multi = !!field.multi;
  const baseOptions = field.options ?? [];
  const learnKey = field.learn ? `learned:${field.id}` : null;
  const [learned, setLearned] = useState<string[]>(() => {
    if (!learnKey || typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(learnKey) ?? "[]") as string[]; } catch { return []; }
  });
  const options = [...baseOptions, ...learned.filter((l) => !baseOptions.includes(l))];
  const selected: string[] = multi
    ? (Array.isArray(value) ? value : [])
    : (value ? [String(value)] : []);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  function toggle(opt: string) {
    if (multi) {
      const has = selected.includes(opt);
      onChange(has ? selected.filter((x) => x !== opt) : [...selected, opt]);
    } else {
      onChange(selected[0] === opt ? "" : opt);
    }
  }
  function addOther() {
    const v = otherValue.trim();
    if (!v) return;
    if (multi) onChange([...selected, v]);
    else onChange(v);
    if (learnKey && !options.includes(v)) {
      const next = [...learned, v];
      setLearned(next);
      try { localStorage.setItem(learnKey, JSON.stringify(next)); } catch {}
    }
    setOtherValue("");
    setOtherOpen(false);
  }
  function forgetLearned(opt: string) {
    if (!learnKey) return;
    const next = learned.filter((x) => x !== opt);
    setLearned(next);
    try { localStorage.setItem(learnKey, JSON.stringify(next)); } catch {}
  }

  // Itens "outros" (selecionados que não estão em options)
  const otherItems = selected.filter((s) => !options.includes(s));

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const checked = selected.includes(o);
        const isLearned = learnKey && learned.includes(o) && !baseOptions.includes(o);
        return (
          <span key={o} className="inline-flex items-center">
            <button type="button" onClick={() => toggle(o)}
              className={`text-xs rounded-full px-3 py-1 border transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"} ${isLearned ? "border-dashed" : ""}`}
              title={isLearned ? "Opção aprendida" : undefined}>
              {o}
            </button>
            {isLearned && !checked && (
              <button type="button" onClick={() => forgetLearned(o)} title="Esquecer"
                className="ml-0.5 text-[10px] text-muted-foreground hover:text-destructive">×</button>
            )}
          </span>
        );
      })}
      {otherItems.map((o) => (
        <span key={o} className="text-xs rounded-full px-2.5 py-1 border bg-primary text-primary-foreground border-primary inline-flex items-center gap-1">
          {o}
          <button type="button" onClick={() => toggle(o)} className="opacity-80 hover:opacity-100">×</button>
        </span>
      ))}
      {field.allowOther && !otherOpen && (
        <button type="button" onClick={() => setOtherOpen(true)}
          className="text-xs rounded-full px-2.5 py-1 border border-dashed border-border hover:bg-secondary inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> Outra
        </button>
      )}
      {field.allowOther && otherOpen && (
        <div className="inline-flex items-center gap-1">
          <Input className="h-7 w-40 text-xs" autoFocus value={otherValue} onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOther(); } if (e.key === "Escape") { setOtherOpen(false); setOtherValue(""); } }} placeholder="Descreva…" />
          <Button type="button" size="sm" variant="outline" className="h-7" onClick={addOther}>Adicionar</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => { setOtherOpen(false); setOtherValue(""); }}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}

// ============================ ApplyToSidesField ===============================
function ApplyToSidesField({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const sides = field.sides ?? ["Frente", "Fundos", "Lado direito", "Lado esquerdo"];
  const options = field.options ?? [];
  const v: Record<string, string> = (value && typeof value === "object") ? value : {};
  const [activeSide, setActiveSide] = useState<string | null>(null);

  function setSide(side: string, opt: string) {
    onChange({ ...v, [side]: v[side] === opt ? "" : opt });
  }
  function applyToOthers(side: string) {
    const opt = v[side];
    if (!opt) return;
    const next: Record<string, string> = { ...v };
    sides.forEach((s) => { if (!next[s]) next[s] = opt; });
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      {sides.map((side) => {
        const cur = v[side] ?? "";
        const isActive = activeSide === side || !cur;
        return (
          <div key={side} className="rounded-md border border-border p-2 bg-card/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-medium">{side}{cur && <span className="ml-2 text-muted-foreground font-normal">{cur}</span>}</div>
              <div className="flex items-center gap-1">
                {cur && (
                  <button type="button" onClick={() => applyToOthers(side)} title="Aplicar aos demais lados vazios"
                    className="text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border hover:bg-secondary">
                    <Copy className="h-3 w-3" /> Aplicar aos demais
                  </button>
                )}
                <button type="button" onClick={() => setActiveSide(isActive ? null : side)}
                  className="text-[11px] px-1.5 py-0.5 rounded hover:bg-secondary text-muted-foreground">
                  {isActive ? "—" : "Editar"}
                </button>
              </div>
            </div>
            {isActive && (
              <div className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <button type="button" key={o} onClick={() => setSide(side, o)}
                    className={`text-xs rounded-full px-2.5 py-1 border ${cur === o ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================ RepeaterField ===================================
function RepeaterField({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const items: Array<Record<string, any>> = Array.isArray(value) ? value : [];
  const itemFields = field.itemFields ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const labelField0 = itemFields[0];
  const hasPresets0 = !!(labelField0?.options && labelField0.options.length > 0);
  const startsCollapsed = !hasPresets0 || !!field.noPresetMemory;
  const [picker, setPicker] = useState(items.length === 0 && hasPresets0 && !field.noPresetMemory);
  const [pickerSel, setPickerSel] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const [autoFocusIdx, setAutoFocusIdx] = useState<number | null>(null);

  function addItem(initial: Record<string, any> = {}) {
    const id = Math.random().toString(36).slice(2, 9);
    const next = [...items, { __id: id, ...initial }];
    onChange(next);
    setOpenIdx(next.length - 1);
    setAutoFocusIdx(next.length - 1);
    setPicker(false);
  }
  function addManyByLabel(labels: string[]) {
    if (!labels.length || !labelField) return;
    const novos = labels.map((l) => ({ __id: Math.random().toString(36).slice(2, 9), [labelField.id]: l }));
    onChange([...items, ...novos]);
    setPickerSel([]);
    setPicker(false);
    setOpenIdx(null);
  }
  function togglePickerSel(opt: string) {
    setPickerSel((cur) => cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  }
  function updateItem(idx: number, patch: Record<string, any>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
    if (openIdx === idx) setOpenIdx(null);
  }

  // Primeiro field é tratado como "rótulo" do item
  const labelField = itemFields[0];

  // Picker de presets (se primeiro field for button-select com options)
  const presets: string[] = labelField?.options ?? [];
  const usedLabels = new Set(items.map((it) => labelField ? String(it[labelField.id] ?? "") : "").filter(Boolean));

  return (
    <div className="grid gap-2">
      {items.map((it, idx) => {
        const open = openIdx === idx;
        const labelVal = labelField ? it[labelField.id] : "";
        const summaryParts = itemFields.slice(1).map((f) => {
          const val = it[f.id];
          if (val == null || val === "") return null;
          return `${f.label}: ${Array.isArray(val) ? val.join(", ") : val}${f.unit ? ` ${f.unit}` : ""}`;
        }).filter(Boolean);
        return (
          <div key={it.__id ?? idx} className="rounded-md border border-border bg-card">
            <div className="flex items-center justify-between gap-2 p-2">
              <button type="button" onClick={() => setOpenIdx(open ? null : idx)}
                className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">{labelVal || `Item ${idx + 1}`}</div>
                {summaryParts.length > 0 && (
                  <div className="text-[11px] text-muted-foreground truncate">{summaryParts.join(" · ")}</div>
                )}
              </button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeItem(idx)} title="Remover">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {open && (
              <div className="border-t border-border p-2 grid gap-2">
                {itemFields.map((f, fi) => (
                  <RepeaterItemField
                    key={f.id}
                    field={f}
                    value={it[f.id]}
                    onChange={(v) => updateItem(idx, { [f.id]: v })}
                    autoFocus={fi === 0 && autoFocusIdx === idx}
                    onEnterAdd={fi === 0 && f.enterToAdd ? () => { setAutoFocusIdx(null); addItem(); } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {picker && presets.length > 0 && !field.noPresetMemory ? (
        <div className="rounded-md border border-dashed border-border p-2 bg-card/50">
          <div className="text-[11px] text-muted-foreground mb-1.5">Selecione um ou mais para adicionar:</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const checked = pickerSel.includes(p);
              const used = usedLabels.has(p);
              return (
                <button key={p} type="button" onClick={() => !used && togglePickerSel(p)} disabled={used}
                  className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${used ? "opacity-40 cursor-not-allowed border-border" : checked ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
                  title={used ? "Já adicionado" : undefined}>
                  {p}
                </button>
              );
            })}
            {labelField?.allowOther && !otherOpen && (
              <button type="button" onClick={() => setOtherOpen(true)}
                className="text-xs rounded-full px-2.5 py-1 border border-dashed border-border hover:bg-secondary inline-flex items-center gap-1">
                <Plus className="h-3 w-3" /> Outro
              </button>
            )}
            {labelField?.allowOther && otherOpen && (
              <div className="inline-flex items-center gap-1">
                <Input className="h-7 w-40 text-xs" autoFocus value={otherValue}
                  onChange={(e) => setOtherValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); const v = otherValue.trim(); if (v) { setPickerSel((c) => c.includes(v) ? c : [...c, v]); setOtherValue(""); setOtherOpen(false); } }
                    if (e.key === "Escape") { setOtherOpen(false); setOtherValue(""); }
                  }}
                  placeholder="Descreva…" />
                <Button type="button" size="sm" variant="outline" className="h-7" onClick={() => { const v = otherValue.trim(); if (v) { setPickerSel((c) => c.includes(v) ? c : [...c, v]); setOtherValue(""); setOtherOpen(false); } }}>Adicionar</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => { setOtherOpen(false); setOtherValue(""); }}>Cancelar</Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button type="button" size="sm" variant="default" className="h-7" disabled={pickerSel.length === 0}
              onClick={() => addManyByLabel(pickerSel)}>
              <Check className="h-3.5 w-3.5 mr-1" /> Concluir seleção {pickerSel.length > 0 ? `(${pickerSel.length})` : ""}
            </Button>
            {pickerSel.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => setPickerSel([])}>Limpar</Button>
            )}
            {items.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => { setPicker(false); setPickerSel([]); }}>Cancelar</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => presets.length > 0 ? setPicker(true) : addItem()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {field.addItemLabel ?? "Adicionar"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Renderer leve para campos dentro de um item de repeater
function RepeaterItemField({ field, value, onChange, autoFocus, onEnterAdd }: { field: FieldDef; value: any; onChange: (v: any) => void; autoFocus?: boolean; onEnterAdd?: () => void }) {
  const [showComment, setShowComment] = useState<boolean>(!!value);
  const isCommentable = !!field.commentable;
  if (isCommentable && !showComment) {
    return (
      <button type="button" onClick={() => setShowComment(true)}
        className="self-start text-[11px] text-primary hover:underline inline-flex items-center gap-1">
        <Plus className="h-3 w-3" /> {field.label}
      </button>
    );
  }
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-muted-foreground">{field.label}{field.unit ? ` (${field.unit})` : ""}</label>
      {field.type === "text" && (
        <Input className="h-8" autoFocus={autoFocus} value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && onEnterAdd && (e.target as HTMLInputElement).value.trim()) { e.preventDefault(); onEnterAdd(); } }}
          placeholder={field.placeholder} />
      )}
      {field.type === "textarea" && <Textarea rows={2} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "number" && <NumberField field={field} value={value} onChange={onChange} onBlur={() => {}} />}
      {field.type === "quantity" && <QuantityField value={value} onChange={onChange} />}
      {field.type === "select" && (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {field.type === "button-select" && <ButtonSelectField field={field} value={value} onChange={onChange} />}
      {field.type === "boolean" && (
        <div className="flex items-center gap-2"><Switch checked={!!value} onCheckedChange={onChange} /><span className="text-xs text-muted-foreground">{value ? "Sim" : "Não"}</span></div>
      )}
      {field.type === "coords" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input className="h-8" placeholder="Latitude" value={value?.lat ?? ""} onChange={(e) => onChange({ ...(value || {}), lat: e.target.value })} />
          <Input className="h-8" placeholder="Longitude" value={value?.lng ?? ""} onChange={(e) => onChange({ ...(value || {}), lng: e.target.value })} />
        </div>
      )}
      {field.type === "geometries" && (
        <GeometryManager
          value={Array.isArray(value) ? (value as SurveyGeometry[]) : []}
          onChange={onChange}
          exportName={field.label || field.id}
        />
      )}
      {isCommentable && (
        <button type="button" onClick={() => { onChange(""); setShowComment(false); }} className="self-end text-[10px] text-muted-foreground hover:text-destructive">Remover</button>
      )}
    </div>
  );
}

function PeopleEditor({ value, onChange }: { value: Person[] | undefined; onChange: (v: Person[]) => void }) {
  const list = Array.isArray(value) ? value : [];
  function update(idx: number, patch: Partial<Person>) {
    onChange(list.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function remove(idx: number) {
    onChange(list.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...list, { id: Math.random().toString(36).slice(2, 9), nome: "" }]);
  }
  return (
    <div className="grid gap-2">
      {list.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma pessoa adicionada.</p>}
      {list.map((p, idx) => (
        <div key={p.id} className="rounded-md border border-border p-2 grid gap-1.5 bg-card/50">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input className="h-8" placeholder="Nome" value={p.nome} onChange={(e) => update(idx, { nome: e.target.value })} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(idx)} title="Remover">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><Input className="h-8" placeholder="Cargo / função" value={p.cargo ?? ""} onChange={(e) => update(idx, { cargo: e.target.value })} /></div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input className="h-8" placeholder="Telefone (DDD) 9 9999-9999" value={p.telefone ?? ""} onChange={(e) => update(idx, { telefone: formatPhoneBR(e.target.value) })} />
              {p.telefone && onlyDigits(p.telefone).length >= 10 && (
                <a href={`https://wa.me/55${onlyDigits(p.telefone)}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline shrink-0" title="Abrir no WhatsApp">WhatsApp</a>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input className="h-8" placeholder="E-mail" value={p.email ?? ""} onChange={(e) => update(idx, { email: e.target.value })} />
              {p.email && p.email.includes("@") && (
                <a href={`mailto:${p.email}`} className="text-[11px] text-primary hover:underline shrink-0" title="Enviar e-mail">E-mail</a>
              )}
            </div>
            <div className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><Input className="h-8" placeholder="Documento / registro" value={p.registro ?? p.documento ?? ""} onChange={(e) => update(idx, { registro: e.target.value })} /></div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar pessoa
      </Button>
    </div>
  );
}

function HoursPresetEditor({ value, onChange }: { value: HoursValue | undefined; onChange: (v: HoursValue) => void }) {
  const v: HoursValue = value && typeof value === "object" ? value : {};
  const preset: HoursPreset = (v.preset as HoursPreset) ?? "comercial";
  const turnos = v.turnos ?? [];
  const dias = v.dias ?? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function applyPreset(next: HoursPreset) {
    onChange({ ...v, preset: next, turnos: HOURS_PRESET_DEFAULTS[next], dias: HOURS_PRESET_DIAS[next] });
  }
  function updateTurno(idx: number, patch: Partial<HoursTurno>) {
    onChange({ ...v, turnos: turnos.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });
  }
  function addTurno() {
    onChange({ ...v, turnos: [...turnos, { id: Math.random().toString(36).slice(2, 9), inicio: "", fim: "" }] });
  }
  function removeTurno(idx: number) {
    onChange({ ...v, turnos: turnos.filter((_, i) => i !== idx) });
  }
  function toggleDia(d: string) {
    const has = dias.includes(d);
    onChange({ ...v, dias: has ? dias.filter((x) => x !== d) : [...dias, d] });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(HOURS_PRESET_LABEL) as HoursPreset[]).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => applyPreset(k)}
            className={`text-xs rounded-full px-3 py-1 border ${preset === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
          >
            {HOURS_PRESET_LABEL[k]}
          </button>
        ))}
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1">Dias de funcionamento</div>
        <div className="flex flex-wrap gap-1">
          {DIAS.map((d) => (
            <button type="button" key={d} onClick={() => toggleDia(d)}
              className={`text-xs rounded-full px-2.5 py-1 border ${dias.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Turnos</div>
          <Button type="button" variant="outline" size="sm" className="h-7" onClick={addTurno}><Plus className="h-3 w-3 mr-1" /> Turno</Button>
        </div>
        {turnos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum turno definido.</p>}
        {turnos.map((t, idx) => (
          <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1.5 rounded-md border border-border p-2">
            <Input className="h-8" placeholder="Identificação (opcional)" value={t.label ?? ""} onChange={(e) => updateTurno(idx, { label: e.target.value })} />
            <Input className="h-8 w-28" type="time" value={t.inicio} onChange={(e) => updateTurno(idx, { inicio: e.target.value })} />
            <Input className="h-8 w-28" type="time" value={t.fim} onChange={(e) => updateTurno(idx, { fim: e.target.value })} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeTurno(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>

      <Textarea rows={2} className="text-sm" placeholder="Observações sobre o regime (escalas, banco de horas, etc.)"
        value={v.observacao ?? ""} onChange={(e) => onChange({ ...v, observacao: e.target.value })} />
    </div>
  );
}

function FieldRendererComponent({ field, value, status, note, na, onChange, onStatus, onNote, onNA, moduleValues }: Props) {
  const [collapsed, setCollapsed] = useState(status === "concluido" && hasValue(value));

  // Recolhe somente quando o usuário marca explicitamente concluído.
  useEffect(() => {
    if (status === "concluido" && hasValue(value)) setCollapsed(true);
    if (status !== "concluido") setCollapsed(false);
  }, [status, value]);

  function captureCoords() {
    if (!navigator.geolocation) return alert("Geolocalização não disponível");
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => alert("Erro ao capturar: " + err.message),
    );
  }

  // NA mode → renderiza versão compacta
  if (na) {
    return (
      <div className="rounded-md border border-dashed border-border/70 p-2 px-3 bg-muted/30 flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{field.label}</span>
          <span className="ml-2 text-xs text-muted-foreground">Não se aplica</span>
        </div>
        {onNA && (
          <Button variant="ghost" size="sm" onClick={() => onNA(false)} className="h-7">
            <Pencil className="h-3 w-3 mr-1" /> Reabrir
          </Button>
        )}
      </div>
    );
  }

  // Resumido (concluído + colapsado)
  if (collapsed && hasValue(value) && status === "concluido") {
    return (
      <div className="rounded-md border border-border p-2 px-3 bg-card flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{field.label}</div>
          <div className="text-xs text-muted-foreground truncate">{summarize(field, value)}{field.unit && hasValue(value) ? ` ${field.unit}` : ""}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Check className="h-4 w-4" style={{ color: "var(--status-done)" }} />
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(false)} className="h-7">
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border p-3 bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="text-sm font-medium">
          {field.label}{field.unit && <span className="text-muted-foreground font-normal"> ({field.unit})</span>}
        </label>
        <div className="flex items-center gap-1">
          {status === "concluido" && hasValue(value) ? (
            <Check className="h-4 w-4" style={{ color: "var(--status-done)" }} />
          ) : (
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: hasValue(value) ? "var(--status-progress)" : "var(--status-todo)" }}
              title={STATUS_LABELS[status]}
            />
          )}
          <Select value={status} onValueChange={(v) => onStatus(v as FieldStatus)}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 hover:bg-secondary px-1.5" title="Mais opções de status">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          {onNA && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" title="Marcar como não se aplica" onClick={() => onNA(true)}>
              <Ban className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {field.type === "text" && <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "number" && <NumberField field={field} value={value} onChange={onChange} onBlur={() => {}} moduleValues={moduleValues} />}
      {field.type === "quantity" && <QuantityField value={value} onChange={onChange} />}
      {field.type === "date" && <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "time" && <Input type="time" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "textarea" && <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "boolean" && (
        <div className="flex items-center gap-2"><Switch checked={!!value} onCheckedChange={onChange} /><span className="text-sm text-muted-foreground">{value ? "Sim" : "Não"}</span></div>
      )}
      {field.type === "select" && (
        <Select value={value ?? ""} onValueChange={(v) => { onChange(v); }}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{field.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {field.type === "multiselect" && (
        <div className="flex flex-wrap gap-2">
          {field.options!.map((o) => {
            const arr: string[] = Array.isArray(value) ? value : [];
            const checked = arr.includes(o);
            return (
              <button type="button" key={o} onClick={() => onChange(checked ? arr.filter((x) => x !== o) : [...arr, o])}
                className={`text-xs rounded-full px-3 py-1 border ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                {o}
              </button>
            );
          })}
        </div>
      )}
      {field.type === "button-select" && (
        <ButtonSelectField field={field} value={value} onChange={onChange} />
      )}
      {field.type === "apply-to-sides" && (
        <ApplyToSidesField field={field} value={value} onChange={onChange} />
      )}
      {field.type === "repeater" && (
        <RepeaterField field={field} value={value} onChange={onChange} />
      )}
      {field.type === "coords" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Latitude" value={value?.lat ?? ""} onChange={(e) => onChange({ ...(value || {}), lat: e.target.value })} />
            <Input placeholder="Longitude" value={value?.lng ?? ""} onChange={(e) => onChange({ ...(value || {}), lng: e.target.value })} />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={captureCoords}><MapPin className="h-4 w-4 mr-1" /> Capturar agora</Button>
          {value?.accuracy && <div className="text-xs text-muted-foreground">Precisão ~{Math.round(value.accuracy)}m</div>}
        </div>
      )}
      {field.type === "people" && (
        <PeopleEditor value={value as Person[] | undefined} onChange={onChange} />
      )}
      {field.type === "hours-presets" && (
        <HoursPresetEditor value={value as HoursValue | undefined} onChange={onChange} />
      )}

      {hasValue(value) && status !== "concluido" && (
        <div className="mt-2 flex justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs"
            style={{ color: "var(--status-done)" }}
            onClick={() => onStatus("concluido")}
            title="Marcar este campo como concluído">
            <Check className="h-3 w-3 mr-1" /> Concluir
          </Button>
        </div>
      )}
    </div>
  );
}

export const FieldRenderer = memo(FieldRendererComponent, (prev, next) => {
  return prev.field === next.field
    && prev.status === next.status
    && prev.note === next.note
    && prev.na === next.na
    && prev.moduleValues === next.moduleValues
    && Object.is(prev.value, next.value);
});
