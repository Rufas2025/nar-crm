import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileEdit, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  approveTestCampaign, createGmailDraft, createGmailDraftBatch, getGmailStatus,
  isTestApproved, type BatchLead,
} from "@/lib/gmail";

const TEST_LEADS: BatchLead[] = [
  { to: "rufino@eduinfo.com.br", nome: "Colégio Rufas", empresa: "Colégio Rufas" },
  { to: "rufino@eduinfo.com.br", nome: "Colégio Serrano", empresa: "Colégio Serrano" },
];

interface LeadRow {
  id: string;
  nome_contato: string | null;
  instituicao: string | null;
  email: string | null;
}

interface Props {
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  templateType: string;
  prepareHtml?: () => Promise<{ html: string; text: string } | null>;
}

export default function GmailDraftActions({ subject, htmlBody, plainTextBody, templateType, prepareHtml }: Props) {
  const campaignId = useMemo(() => `studio-${crypto.randomUUID()}`, []);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [testCreated, setTestCreated] = useState(false);
  const [approved, setApproved] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedTestLead, setSelectedTestLead] = useState(0);
  const [progress, setProgress] = useState<{ total: number; done: number } | null>(null);

  useEffect(() => {
    void getGmailStatus().then((s) => setConnected(s.connected));
  }, []);

  async function withPreparedHtml(): Promise<{ html: string; text: string } | null> {
    if (prepareHtml) return await prepareHtml();
    return { html: htmlBody, text: plainTextBody };
  }

  async function handleCreateTest() {
    setBusy("test");
    try {
      const prepared = await withPreparedHtml();
      if (!prepared) return;
      const lead = TEST_LEADS[selectedTestLead];
      const subj = subject.replace(/\{\{empresa\}\}/g, lead.empresa ?? "");
      const res = await createGmailDraft({
        to: lead.to,
        subject: subj,
        htmlBody: prepared.html,
        plainTextBody: prepared.text,
        templateType,
        campaignId,
        isTest: true,
      });
      setTestCreated(true);
      toast.success("Rascunho de teste criado no Gmail.", {
        action: { label: "Abrir Gmail", onClick: () => window.open(res.draftUrl, "_blank") },
      });
      setTestOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setBusy("approve");
    try {
      await approveTestCampaign(campaignId);
      setApproved(true);
      toast.success("Teste aprovado. Você já pode criar os rascunhos do lote.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function openBatch() {
    setBatchOpen(true);
    if (leads.length === 0) {
      const { data } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { not: (c: string, op: string, v: unknown) => { order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: LeadRow[] | null }> } } } } })
        .from("leads")
        .select("id, nome_contato, instituicao, email")
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);
      setLeads((data ?? []).filter((l) => l.email && l.email.includes("@")));
    }
  }

  function toggleLead(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < 20) next.add(id);
    else toast.warning("Máximo de 20 leads por lote.");
    setSelected(next);
  }

  async function handleBatch() {
    if (selected.size === 0) { toast.error("Selecione ao menos 1 lead."); return; }
    setBusy("batch");
    setProgress({ total: selected.size, done: 0 });
    try {
      const prepared = await withPreparedHtml();
      if (!prepared) return;
      const chosen = leads.filter((l) => selected.has(l.id)).map<BatchLead>((l) => ({
        leadId: l.id,
        to: l.email!,
        nome: l.nome_contato ?? "",
        empresa: l.instituicao ?? "",
      }));
      const res = await createGmailDraftBatch({
        leads: chosen, subject, htmlBody: prepared.html, plainTextBody: prepared.text,
        templateType, campaignId,
      });
      setProgress({ total: res.summary.total, done: res.summary.created });
      toast.success(`Lote concluído: ${res.summary.created} criados, ${res.summary.failed} falhas.`);
      if (res.failed.length > 0) {
        console.warn("Falhas no lote:", res.failed);
      }
      setBatchOpen(false);
      setSelected(new Set());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  if (connected === false) {
    return (
      <div className="rounded-md border border-dashed bg-white px-4 py-3 text-sm text-muted-foreground">
        Gmail não conectado. Vá em <strong>Configurações → Gmail da Eduinfo</strong> para conectar antes de criar rascunhos.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Rascunhos no Gmail</p>
          <p className="text-xs text-muted-foreground">
            Crie um teste, aprove e depois libere até 20 rascunhos. Nada é enviado automaticamente.
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{campaignId.slice(0, 12)}…</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setTestOpen(true)} disabled={!!busy}>
          <FileEdit className="w-4 h-4" /> Criar rascunho de teste
        </Button>
        <Button size="sm" variant="outline" onClick={handleApprove} disabled={!testCreated || approved || busy === "approve"}>
          {busy === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {approved ? "Teste aprovado" : "Aprovar teste"}
        </Button>
        <Button size="sm" onClick={openBatch} disabled={!approved || busy === "batch"}>
          <Send className="w-4 h-4" /> Criar rascunhos do lote
        </Button>
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar rascunho de teste</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Lead de teste</Label>
            {TEST_LEADS.map((l, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="testlead" checked={selectedTestLead === i} onChange={() => setSelectedTestLead(i)} />
                <span>{l.empresa} — {l.to}</span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              O rascunho será criado no Gmail conectado, sem envio.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTest} disabled={busy === "test"}>
              {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Criar rascunho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar leads (até 20)</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">
            Selecionados: {selected.size}/20
            {progress && ` · progresso: ${progress.done}/${progress.total}`}
          </div>
          <div className="max-h-[400px] overflow-auto border rounded-md divide-y">
            {leads.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando leads…</div>
            ) : leads.map((l) => (
              <label key={l.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer text-sm">
                <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggleLead(l.id)} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{l.instituicao || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.nome_contato || "—"} · {l.email}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancelar</Button>
            <Button onClick={handleBatch} disabled={busy === "batch" || selected.size === 0}>
              {busy === "batch" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Criar {selected.size} rascunho(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
