/**
 * Normaliza um telefone brasileiro para o formato exigido pela Evolution GO
 * (DDI 55 + DDD + número, somente dígitos). Ex: "11944739073" → "5511944739073".
 * Retorna null se não for possível normalizar.
 */
export function normalizePhoneForWhatsapp(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // Remove "0" de discagem antes do DDD (ex: 0 11 94473-9073)
  if (digits.length === 12 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Já tem DDI 55 (DDD + celular = 13, ou DDD + fixo = 12)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // DDD + número, sem DDI
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}
