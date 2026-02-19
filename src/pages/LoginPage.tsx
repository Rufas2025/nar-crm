import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-[0_8px_32px_hsl(var(--primary)/0.35)]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14h14M14 7v14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">NAR ECO Soluções</h1>
          <p className="text-sm text-muted-foreground mt-1">CRM · Entrar na sua conta</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_4px_40px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">E-mail</label>
              <Input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border rounded-xl h-11 text-sm focus-visible:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border rounded-xl h-11 text-sm focus-visible:ring-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm mt-1 transition-all duration-200 shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Acesso restrito aos colaboradores autorizados.
        </p>
      </div>
    </div>
  );
}
