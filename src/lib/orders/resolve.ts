const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ORDER_NUMBER_RE = /^KAY-[A-Z0-9]+$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function normalizeOrderNumber(value: string): string {
  return value.trim().toUpperCase();
}

export function isOrderNumber(value: string): boolean {
  return ORDER_NUMBER_RE.test(normalizeOrderNumber(value));
}

export function normalizeOrderReference(value: string): string {
  const trimmed = value.trim();
  return isOrderNumber(trimmed) ? normalizeOrderNumber(trimmed) : trimmed;
}
