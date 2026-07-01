import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Loader2, Mail, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GMAIL_EXPECTED_ACCOUNT, disconnectGmail, getGmailStatus, startGmailConnect, type GmailStatus,
} from "@/lib/gmail";

const OAUTH_NOT_CONFIGURED_MSG =
  "Gmail OAuth ainda não configurado. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI nos Supabase Edge Function Secrets.";

function isMissingSecretsError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("missing google oauth") ||
    m.includes("missing google_client") ||
    m.includes("google_client_id") ||
    m.includes("google_client_secret") ||
    m.includes("google_redirect_uri") ||
    (m.includes("non-2xx") && m.includes("edge function"))
  );
}

export default function GmailConnectionCard() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();

  async function refresh() {
    setLoading(true);
    try {
      setStatus(await getGmailStatus());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    const gmail = params.get("gmail");
    if (!gmail) return;
    if (gmail === "connected") {
      toast.success(`Gmail conectado (${params.get("email") ?? "ok"})`);
      void refresh();
    } else if (gmail === "wrong_account") {
      toast.error(`Conta errada: ${params.get("email") ?? "desconhecida"}. Use ${GMAIL_EXPECTED_ACCOUNT}.`);
    } else if (gmail === "error") {
      toast.error(`Falha na conexão Gmail: ${params.get("reason") ?? "erro"}`);
    }
    params.delete("gmail"); params.delete("email"); params.delete("reason");
    setParams(params, { replace: true });
  }, [params, setParams]);

  async function handleConnect() {
    setBusy(true);
    try {
      const url = await startGmailConnect();
      window.location.href = url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isMissingSecretsError(msg)) {
        setNotConfigured(true);
        toast.error(OAUTH_NOT_CONFIGURED_MSG);
      } else {
        toast.error("Erro ao iniciar conexão: " + msg);
      }
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Desconectar a conta Gmail?")) return;
    setBusy(true);
    try {
      await disconnectGmail();
      toast.success("Gmail desconectado.");
      await refresh();
    } catch (e: unknown) {
      toast.error("Erro ao desconectar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 border-t pt-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Gmail da Eduinfo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte a conta <strong>{GMAIL_EXPECTED_ACCOUNT}</strong> para criar rascunhos no Gmail diretamente do Email Studio.
          </p>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : status?.connected ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">Conectado</Badge>
        ) : (
          <Badge variant="secondary">Desconectado</Badge>
        )}
      </div>

      {status?.connected && (
        <div className="mt-3 text-sm text-muted-foreground">
          Conta conectada: <strong className="text-foreground">{status.email}</strong>
          {status.connectedAt && (
            <span className="ml-2 text-xs">
              · desde {new Date(status.connectedAt).toLocaleString("pt-BR")}
            </span>
          )}
          {status.email && status.email.toLowerCase() !== GMAIL_EXPECTED_ACCOUNT && (
            <p className="text-destructive text-xs mt-1">
              Atenção: a conta conectada não é a esperada ({GMAIL_EXPECTED_ACCOUNT}).
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        {status?.connected ? (
          <Button variant="outline" onClick={handleDisconnect} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
            Desconectar Gmail
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Conectar Gmail
          </Button>
        )}
      </div>
    </div>
  );
}
