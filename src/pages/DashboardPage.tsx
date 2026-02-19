import { useEffect, useState } from "react";
import { supabase, Lead } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  convertido: "Convertido",
  perdido: "Perdido",
};

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10",
  em_andamento: "text-yellow-400 bg-yellow-400/10",
  convertido: "text-green-400 bg-green-400/10",
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

  const total = leads.length;
  const novo = leads.filter((l) => l.status === "novo").length;
  const emAndamento = leads.filter((l) => l.status === "em_andamento").length;
  const convertido = leads.filter((l) => l.status === "convertido").length;

  const cards = [
    { label: "Total de Leads", value: total, icon: Users, color: "text-primary" },
    { label: "Novos", value: novo, icon: TrendingUp, color: "text-blue-400" },
    { label: "Em Andamento", value: emAndamento, icon: Clock, color: "text-yellow-400" },
    { label: "Convertidos", value: convertido, icon: CheckCircle2, color: "text-green-400" },
  ];

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Bem-vindo, {user?.email}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
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

      {/* Recent leads */}
      <div className="bg-card border border-border rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Leads Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">Carregando…</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">Nenhum lead cadastrado ainda.</p>
          ) : (
            leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center px-6 py-4 hover:bg-accent/40 transition-colors duration-150">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.company || lead.email || "—"}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.status] || "text-muted-foreground bg-muted"}`}>
                  {statusLabel[lead.status] || lead.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
