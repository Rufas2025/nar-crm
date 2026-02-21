import type { Lead } from "@/lib/supabase";

const JUNK_VALUES = new Set(["", "-", "—", "null", "undefined"]);
const ONLY_NUMBERS = /^\d{1,4}$/;

function isUseful(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (JUNK_VALUES.has(trimmed.toLowerCase())) return false;
  return trimmed.length > 0;
}

function isUsefulName(value: string | null | undefined): boolean {
  if (!isUseful(value)) return false;
  return !ONLY_NUMBERS.test(value!.trim());
}

/**
 * A lead is valid when:
 * 1. `empresa` has a useful (non-junk, non-numeric-only) value
 * 2. At least one of `nome`, `email`, `telefone` is useful
 */
export function isValidLead(lead: Lead): boolean {
  if (!isUsefulName(lead.empresa)) return false;
  return isUsefulName(lead.nome) || isUseful(lead.email) || isUseful(lead.telefone);
}
