import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Plug, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type EvolutionConfig = {
  id: string;
  user_id: string;
  base_url: string;
  api_key: string;
  instance_name: string;
  last_test_status: string | null;
  last_test_at: string | null;
};

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [configId, setConfigId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const { data, error } = await supabase
        .from("evolution_config")
        .select("*")
        .maybeSingle<EvolutionConfig>();

      if (error) {
        toast.error("Erro ao carregar configuração: " + error.message);
      } else if (data) {
        setConfigId(data.id);
        setBaseUrl(data.base_url);
        setApiKey(data.api_key);
        setInstanceName(data.instance_name);
        setLastTestStatus(data.last_test_status);
        setLastTestAt(data.last_test_at);
      }
      setLoading(false);
    }

    loadConfig();
  }, []);

  async function handleSave() {
    if (!user) return;
    if (!baseUrl.trim() || !apiKey.trim() || !instanceName.trim()) {
      toast.error("Preencha URL, API Key e nome da instância.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("evolution_config")
      .upsert(
        {
          user_id: user.id,
          base_url: baseUrl.trim(),
          api_key: apiKey.trim(),
          instance_name: instanceName.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single<EvolutionConfig>();

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }

    setConfigId(data.id);
    toast.success("Configuração da Evolution API salva com sucesso.");
  }

  async function handleTestConnection() {
    if (!baseUrl.trim() || !apiKey.trim() || !instanceName.trim()) {
      toast.error("Preencha URL, API Key e nome da instância antes de testar.");
      return;
    }

    setTesting(true);

    const { data, error } = await supabase.functions.invoke("evolution-test-connection", {
      body: {
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        instanceName: instanceName.trim(),
      },
    });

    setTesting(false);

    const ok = !error && data?.ok;
    const status = ok ? data.state : "error";
    const testedAt = new Date().toISOString();

    setLastTestStatus(status);
    setLastTestAt(testedAt);

    if (configId) {
      await supabase
        .from("evolution_config")
        .update({ last_test_status: status, last_test_at: testedAt })
        .eq("id", configId);
    }

    if (ok) {
      toast.success(`Conexão testada: estado "${status}".`);
    } else {
      toast.error("Falha ao testar conexão: " + (error?.message || data?.error || "erro desconhecido"));
    }
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

      <div className="space-y-5">
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

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} disabled={saving} className="h-11 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
          <Button
            onClick={handleTestConnection}
            disabled={testing}
            variant="outline"
            className="h-11 gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Testar conexão
          </Button>
        </div>
      </div>
    </div>
  );
}
