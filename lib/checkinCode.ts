const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Extrae el código de check-in del texto leído por el lector de QR. El QR de la reserva contiene el UUID,
 * pero también se acepta dentro de una URL, un JSON o con prefijos ("123:uuid"). Devuelve null si no hay un código usable.
 */
export function extractCheckInCode(scanned: string): string | null {
  const text = scanned.trim();
  if (!text) return null;
  const uuid = text.match(UUID_PATTERN);
  if (uuid) return uuid[0].toLowerCase();
  return text.length <= 64 && !/\s/.test(text) ? text : null;
}
