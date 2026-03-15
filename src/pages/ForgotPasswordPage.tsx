import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-[0_8px_32px_hsl(var(--primary)/0.35)]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14h14M14 7v14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">NAR ECO Soluções</h1>
          <p className="text-sm text-muted-foreground mt-1">Recuperar senha</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_4px_40px_rgba(0,0,0,0.4)]">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  <path d="m16 19 2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm text-foreground font-medium text-center">E-mail enviado!</p>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Verifique sua caixa de entrada em <span className="font-medium text-foreground">{email}</span>. Clique no link para redefinir sua senha.
              </p>
              <Link
                to="/login"
                className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
              </p>

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

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm mt-1 transition-all duration-200 shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>

              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground text-center mt-1 inline-flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
