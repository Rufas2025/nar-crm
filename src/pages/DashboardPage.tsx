import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Lead } from "@/lib/supabase";
import { isValidLead } from "@/lib/leadValidation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  fechado: "Fechado",
  perdido: "Perdido",
};

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10",
  em_contato: "text-yellow-400 bg-yellow-400/10",
  qualificado: "text-blue-400 bg-blue-400/10",
  fechado: "text-green-400 bg-green-400/10",
  perdido: "text-destructive bg-destructive/10",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setLeads(data);
        setLoading(false);
      });
  }, []);

  const validLeads = leads.filter(isValidLead);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const total = validLeads.length;
  const novo = validLeads.filter((l) => l.lead_status === "novo").length;
  const emContato = validLeads.filter((l) => l.lead_status === "em_contato").length;
  const qualificado = validLeads.filter((l) => l.lead_status === "qualificado").length;

  const atencaoHoje = validLeads.filter((l) => {
    if (!l.proximo_passo_at) return false;
    return new Date(l.proximo_passo_at) <= today;
  }).length;

  const semProximoPasso = validLeads.filter((l) => !l.proximo_passo_at).length;

  const semContato7dias = validLeads.filter((l) => {
    if (!l.ultimo_contato_at) return true;
    const diff = Math.floor((Date.now() - new Date(l.ultimo_contato_at).getTime()) / 86400000);
    return diff >= 7;
  }).length;

  const navigate = useNavigate();

  const cards = [
    { label: "Total de Leads", value: total, icon: Users, color: "text-primary", filter: "" },
    { label: "Novos", value: novo, icon: TrendingUp, color: "text-blue-400", filter: "novo" },
    { label: "Em Contato", value: emContato, icon: Clock, color: "text-yellow-400", filter: "em_contato" },
    { label: "Qualificados", value: qualificado, icon: CheckCircle2, color: "text-green-400", filter: "qualificado" },
  ];

  const chips = [
    { label: "🔴 Atenção Hoje", value: atencaoHoje, view: "atencao" },
    { label: "🟡 Sem Próximo Passo", value: semProximoPasso, view: "sem_passo" },
    { label: "🔵 Sem Contato 7+ dias", value: semContato7dias, view: "sem_contato" },
  ];

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Bem-vindo, {user?.email}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, filter }) => (
          <div
            key={label}
            onClick={() => navigate(filter ? `/leads?status=${filter}` : "/leads")}
            className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)] cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-semibold text-foreground">
              {loading ? "–" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick-view chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {chips.map(({ label, value, view }) => (
          <button
            key={view}
            onClick={() => navigate(`/leads?view=${view}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            {label}
            {!loading && value > 0 && (
              <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {value}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-card border border-border rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Leads Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">Carregando…</p>
          ) : validLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">Nenhum lead cadastrado ainda.</p>
          ) : (
            validLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center px-6 py-4 hover:bg-accent/40 transition-colors duration-150">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{lead.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.empresa || lead.email || "—"}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.lead_status] || "text-muted-foreground bg-muted"}`}>
                  {statusLabel[lead.lead_status] || lead.lead_status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
