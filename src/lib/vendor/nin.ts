/** Nigerian National Identification Number — 11 digits. */
export function normalizeNin(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidNin(value: string): boolean {
  return /^\d{11}$/.test(normalizeNin(value));
}
