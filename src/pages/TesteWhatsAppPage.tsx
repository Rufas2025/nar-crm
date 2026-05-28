import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TesteWhatsAppPage() {
  const [nome, setNome] = useState("Rufino");
  const [escola, setEscola] = useState("Instituto Educacional Crescer");
  const [segmento, setSegmento] = useState("Atendimento / Matrículas");
  const [telefone, setTelefone] = useState("5511930346324");
  const [observacao, setObservacao] = useState(
    "Lead de teste para validar abertura de WhatsApp pelo Lovable."
  );

  const handleEnviarWhatsApp = () => {
    const mensagem = `Olá, ${nome}! Tudo bem?\n\nAqui é o Rufino, da NAR Eco Soluções.\n\nEstou fazendo um teste rápido do nosso fluxo de atendimento para escolas. A ideia é validar se conseguimos transformar um lead em uma conversa de WhatsApp com poucos cliques.\n\nEscola: ${escola}\n\nInteresse: ${segmento}\n\nSe essa mensagem chegou corretamente, o primeiro teste do MVP funcionou.`;

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Teste de Lead WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre um lead de teste e abra uma conversa no WhatsApp com mensagem
          personalizada.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do responsável</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do responsável"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="escola">Nome da escola</Label>
          <Input
            id="escola"
            value={escola}
            onChange={(e) => setEscola(e.target.value)}
            placeholder="Nome da escola"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="segmento">Segmento de interesse</Label>
          <Select value={segmento} onValueChange={setSegmento}>
            <SelectTrigger id="segmento">
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Atendimento / Matrículas">
                Atendimento / Matrículas
              </SelectItem>
              <SelectItem value="Gestão Escolar">
                Gestão Escolar
              </SelectItem>
              <SelectItem value="Comunicação com Pais">
                Comunicação com Pais
              </SelectItem>
              <SelectItem value="Marketing Educacional">
                Marketing Educacional
              </SelectItem>
              <SelectItem value="Financeiro">
                Financeiro
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone WhatsApp</Label>
          <Input
            id="telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Ex: 5511930346324"
          />
          <p className="text-xs text-muted-foreground">
            Formato: código do país + DDD + número (ex: 5511930346324)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacao">Observação</Label>
          <Textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação sobre o lead"
            rows={3}
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={handleEnviarWhatsApp}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium text-base gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar WhatsApp
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
