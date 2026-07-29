import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Building2, Mail, Phone, User, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Lead } from "@/lib/supabase";
import { isValidPhone, formatPhone } from "@/components/WhatsappBulkModal";

export default function SelectedLeadsPanel({
  leads,
  open,
  onOpenChange,
  onRemove,
  onClearAll,
}: {
  leads: Lead[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  const validCount = leads.filter((l) => isValidPhone(l.telefone)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Leads selecionados ({leads.length})</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          <span className="text-emerald-400 font-medium">{validCount}</span> com telefone válido ·{" "}
          <span className="text-yellow-400 font-medium">{leads.length - validCount}</span> sem telefone válido.
          A lista inclui leads fora do filtro/busca atual.
        </p>

        <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 max-h-[50vh] overflow-y-auto">
          {leads.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum lead selecionado.</p>
          )}
          {leads.map((l) => {
            const valid = isValidPhone(l.telefone);
            return (
              <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm text-foreground font-medium truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {l.empresa || "(sem instituição)"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                    <User className="w-3 h-3 shrink-0" /> {l.nome || "(sem contato)"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0" /> {formatPhone(l.telefone)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0" /> {l.email || "—"}
                  </p>
                  {valid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Telefone válido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400">
                      <AlertTriangle className="w-3 h-3" /> Telefone ausente/inválido
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(l.id)}
                  className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={`Remover ${l.nome || "lead"} da seleção`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClearAll}
            className="h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar seleção
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} className="h-10 px-5 rounded-xl text-sm">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
