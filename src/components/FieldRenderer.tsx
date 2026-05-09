import { memo } from "react";
import type { FieldDef, FieldStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface Props {
  field: FieldDef;
  value: any;
  status: FieldStatus;
  onChange: (value: any) => void;
  onStatus: (s: FieldStatus) => void;
}

const STATUS_OPTIONS: FieldStatus[] = [
  "nao_iniciado", "em_andamento", "concluido", "pendente",
  "nao_se_aplica", "aguardando_documento", "aguardando_empresa", "requer_retorno",
];

function FieldRendererComponent({ field, value, status, onChange, onStatus }: Props) {
  function captureCoords() {
    if (!navigator.geolocation) return alert("Geolocalização não disponível");
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => alert("Erro ao capturar: " + err.message),
    );
  }

  return (
    <div className="rounded-md border border-border p-3 bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="text-sm font-medium">
          {field.label}{field.unit && <span className="text-muted-foreground font-normal"> ({field.unit})</span>}
        </label>
        <Select value={status} onValueChange={(v) => onStatus(v as FieldStatus)}>
          <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 hover:bg-secondary px-2"><StatusBadge status={status} /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {field.type === "text" && <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "number" && <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "date" && <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "time" && <Input type="time" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "textarea" && <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {field.type === "boolean" && (
        <div className="flex items-center gap-2"><Switch checked={!!value} onCheckedChange={onChange} /><span className="text-sm text-muted-foreground">{value ? "Sim" : "Não"}</span></div>
      )}
      {field.type === "select" && (
        <Select value={value ?? ""} onValueChange={onChange}>
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
    </div>
  );
}

export const FieldRenderer = memo(FieldRendererComponent, (prev, next) => {
  return prev.field === next.field && prev.status === next.status && Object.is(prev.value, next.value);
});