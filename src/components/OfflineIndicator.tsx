import { useEffect, useState } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useDBStatus } from "@/lib/store";

export function OfflineIndicator() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const status = useDBStatus();
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online && !status.persistPending && !status.persistenceError) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border" title={status.persistenceError || ""}>
      {!online ? <><WifiOff className="h-3.5 w-3.5 text-amber-600" /><span className="text-amber-700">Offline</span></>
        : status.persistPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Salvando…</span></>
        : <><Wifi className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Erro de sincronia</span></>}
    </div>
  );
}