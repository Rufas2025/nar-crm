import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Plug, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  loadEvolutionSettings,
  saveEvolutionSettings,
  testEvolutionConnection,
} from "@/lib/evolution";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [lastTestError, setLastTestError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadEvolutionSettings();
        if (saved) {
          setBaseUrl(saved.apiUrl);
          setApiKey(saved.apiKey);
          setInstanceName(saved.instanceName);
          setConnectionStatus(saved.connectionStatus);
          setLastTestedAt(saved.lastTestedAt);
          setLastTestError(saved.lastTestError);
        }
      } catch (err: any) {
        toast.error("Erro ao carregar configuração: " + String(err?.message ?? err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function runConnectionTest(creds: { apiUrl: string; apiKey: string; instanceName: string }) {
    setTesting(true);

    try {
      const result = await testEvolutionConnection(creds);
      const status = result.state ?? (result.ok ? "open" : "error");

      if (result.ok) {
        toast.success('Conexão testada: estado "open" (Conectado).');
      } else {
        toast.error(result.error ?? `Instância não conectada. Estado retornado: "${status}".`);
      }

      setConnectionStatus(status);
      setLastTestedAt(result.testedAt);
      setLastTestError(result.error ?? null);

      // Persiste o resultado do teste junto com as credenciais
      await saveEvolutionSettings({
        ...creds,
        connectionStatus: status,
        lastTestedAt: result.testedAt,
        lastTestError: result.error ?? null,
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e?: FormEvent) {
    e?.preventDefault();

    const cleanUrl = baseUrl.trim().replace(/\/+$/, "");
    const cleanKey = apiKey.trim();
    const cleanInstance = instanceName.trim();

    if (!cleanUrl || !cleanKey || !cleanInstance) {
      toast.error("Preencha URL, API Key e nome da instância.");
      return;
    }

    setSaving(true);

    try {
      await saveEvolutionSettings({
        apiUrl: cleanUrl,
        apiKey: cleanKey,
        instanceName: cleanInstance,
        connectionStatus,
        lastTestedAt,
        lastTestError,
      });
      setBaseUrl(cleanUrl);
      setApiKey(cleanKey);
      setInstanceName(cleanInstance);

      toast.success("Configuração da Evolution API salva com sucesso.");

      // Após salvar com sucesso, roda automaticamente o teste de conexão
      await runConnectionTest();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    const cleanUrl = baseUrl.trim().replace(/\/+$/, "");
    const cleanKey = apiKey.trim();
    const cleanInstance = instanceName.trim();

    if (!cleanUrl || !cleanKey || !cleanInstance) {
      toast.error("Preencha URL, API Key e nome da instância antes de testar.");
      return;
    }

    setTesting(true);

    try {
      // Garante que o backend testa exatamente o que está na tela
      await saveEvolutionSettings({
        apiUrl: cleanUrl,
        apiKey: cleanKey,
        instanceName: cleanInstance,
        connectionStatus,
        lastTestedAt,
        lastTestError,
      });
      setBaseUrl(cleanUrl);
      setApiKey(cleanKey);
      setInstanceName(cleanInstance);

      await runConnectionTest();
    } catch (err: any) {
      toast.error("Erro ao salvar configuração antes do teste: " + String(err?.message ?? err));
      setTesting(false);
    }
  }

  function statusBadge() {
    if (!connectionStatus) {
      return <Badge variant="secondary">Não testado</Badge>;
    }
    if (connectionStatus === "open") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">Conectado</Badge>;
    }
    if (connectionStatus === "error") {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (["close", "closed", "connecting"].includes(connectionStatus)) {
      return <Badge variant="secondary">Não conectado ({connectionStatus})</Badge>;
    }
    return <Badge variant="secondary">Desconectado ({connectionStatus})</Badge>;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a conexão com a Evolution API para envio de mensagens via WhatsApp.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSave}>
        <div className="space-y-2">
          <Label htmlFor="baseUrl">URL da Evolution API</Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://sua-instancia.evolution-api.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instanceName">Nome da instância</Label>
          <Input
            id="instanceName"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="Ex: nar-crm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Chave de acesso da Evolution API"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground">Status da conexão:</span>
          {statusBadge()}
          {lastTestedAt && (
            <span className="text-xs text-muted-foreground/60">
              Testado em {new Date(lastTestedAt).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
        {lastTestError && (
          <p className="text-sm text-destructive -mt-3">{lastTestError}</p>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button type="submit" disabled={saving || testing} className="h-11 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            variant="outline"
            className="h-11 gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Testar conexão
          </Button>
        </div>
      </form>
    </div>
  );
}
