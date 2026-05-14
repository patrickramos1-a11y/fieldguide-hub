import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, FolderKanban, ClipboardList, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OfflineIndicator } from "./OfflineIndicator";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/levantamentos", label: "Levantamentos", icon: ClipboardList },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              R
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Ramos Engenharia</div>
              <div className="text-xs text-muted-foreground">Levantamento de Campo</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <OfflineIndicator />
            {nav.map((n) => {
              const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={onLogout}
              title="Sair"
              className="ml-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
        <nav className="flex md:hidden border-t border-border">
          {nav.map((n) => {
            const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}