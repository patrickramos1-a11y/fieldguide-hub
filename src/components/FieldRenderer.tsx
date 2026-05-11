import { memo, useState } from "react";
import type { FieldDef, FieldStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquarePlus, Ban, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

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
}

const STATUS_OPTIONS: FieldStatus[] = [
  "nao_iniciado", "em_andamento", "concluido", "pendente",
  "nao_se_aplica", "aguardando_documento", "aguardando_empresa", "requer_retorno",
];

function hasValue(v: unknown) {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v as object).some((x) => x !== "" && x != null);
  return true;
}

function summarize(field: FieldDef, value: any): string {
  if (!hasValue(value)) return "—";
  if (field.type === "boolean") return value ? "Sim" : "Não";
  if (field.type === "coords" && typeof value === "object") return `${value.lat ?? "?"}, ${value.lng ?? "?"}`;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function FieldRendererComponent({ field, value, status, note, na, onChange, onStatus, onNote, onNA }: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(hasValue(value));

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

  // Resumido (preenchido + colapsado)
  if (collapsed && hasValue(value)) {
    return (
      <div className="rounded-md border border-border p-2 px-3 bg-card flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{field.label}</div>
          <div className="text-xs text-muted-foreground truncate">{summarize(field, value)}{field.unit && hasValue(value) ? ` ${field.unit}` : ""}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={status} />
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
          {onNote && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" title="Adicionar observação" onClick={() => setNoteOpen((v) => !v)}>
              <MessageSquarePlus className={`h-3.5 w-3.5 ${note ? "text-primary" : ""}`} />
            </Button>
          )}
          {onNA && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" title="Marcar como não se aplica" onClick={() => onNA(true)}>
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
          <Select value={status} onValueChange={(v) => onStatus(v as FieldStatus)}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 hover:bg-secondary px-2"><StatusBadge status={status} /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {field.type === "text" && <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => hasValue(value) && setCollapsed(true)} />}
      {field.type === "number" && <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => hasValue(value) && setCollapsed(true)} />}
      {field.type === "date" && <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => hasValue(value) && setCollapsed(true)} />}
      {field.type === "time" && <Input type="time" value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => hasValue(value) && setCollapsed(true)} />}
      {field.type === "textarea" && <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => hasValue(value) && setCollapsed(true)} />}
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

      {(noteOpen || note) && onNote && (
        <div className="mt-2">
          <Textarea
            rows={2}
            placeholder="Observação sobre este item…"
            value={note ?? ""}
            onChange={(e) => onNote(e.target.value)}
            className="text-xs"
          />
        </div>
      )}

      {hasValue(value) && (
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setCollapsed(true)}>
            Recolher
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
    && Object.is(prev.value, next.value);
});
