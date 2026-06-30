import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Mail,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/email-studio", label: "Email Studio", icon: Mail },
  { to: "/teste-whatsapp", label: "Teste WhatsApp", icon: MessageCircle },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_hsl(var(--primary)/0.4)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">NAR ECO</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? "bg-sidebar-accent text-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} strokeWidth={1.5} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" strokeWidth={1.5} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors duration-200">
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
