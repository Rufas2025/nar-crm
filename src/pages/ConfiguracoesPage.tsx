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
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestError, setLastTestError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadEvolutionSettings();
    if (saved) {
      setBaseUrl(saved.baseUrl);
      setApiKey(saved.apiKey);
      setInstanceName(saved.instanceName);
      setLastTestStatus(saved.lastTestStatus);
      setLastTestAt(saved.lastTestAt);
      setLastTestError(saved.lastTestError);
    }
    setLoading(false);
  }, []);

  async function runConnectionTest(url: string, key: string, instance: string) {
    setTesting(true);

    try {
      const result = await testEvolutionConnection(url, key, instance);
      const status = result.ok && result.state === "open" ? "open" : "error";
      const errorMessage = result.ok
        ? null
        : result.error ??
          (result.state
            ? `Instância não conectada. Estado retornado: "${result.state}".`
            : "Erro desconhecido no teste de conexão.");

      if (status === "open") {
        toast.success('Conexão testada: estado "open" (Conectado).');
      } else {
        toast.error(errorMessage ?? `Instância não conectada. Estado retornado: "${status}".`);
      }

      setLastTestStatus(status);
      setLastTestAt(result.testedAt);
      setLastTestError(errorMessage);

      saveEvolutionSettings({
        baseUrl: url,
        apiKey: key,
        instanceName: instance,
        lastTestStatus: status,
        lastTestAt: result.testedAt,
        lastTestError: errorMessage,
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
      saveEvolutionSettings({
        baseUrl: cleanUrl,
        apiKey: cleanKey,
        instanceName: cleanInstance,
        lastTestStatus,
        lastTestAt,
        lastTestError,
      });
      setBaseUrl(cleanUrl);

      toast.success("Configuração da Evolution API salva com sucesso.");

      // Após salvar com sucesso, roda automaticamente o teste de conexão
      await runConnectionTest(cleanUrl, cleanKey, cleanInstance);
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

    setBaseUrl(cleanUrl);
    await runConnectionTest(cleanUrl, cleanKey, cleanInstance);
  }

  function statusBadge() {
    if (!lastTestStatus) {
      return <Badge variant="secondary">Não testado</Badge>;
    }
    if (lastTestStatus === "open") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">Conectado</Badge>;
    }
    if (lastTestStatus === "error") {
      return <Badge variant="destructive">Erro</Badge>;
    }
    return <Badge variant="secondary">Desconectado ({lastTestStatus})</Badge>;
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
          {lastTestAt && (
            <span className="text-xs text-muted-foreground/60">
              Testado em {new Date(lastTestAt).toLocaleString("pt-BR")}
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
