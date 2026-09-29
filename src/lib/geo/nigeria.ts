/** Values match what Terminal Africa and hub matching expect (FCT → "Abuja"). */
export const NIGERIAN_STATES: { value: string; label: string }[] = [
  { value: "Abuja", label: "Abuja (FCT)" },
  ...[
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ].map((s) => ({ value: s, label: s })),
];

/** Map free text (e.g. from geocoding) onto a known state value, if possible. */
export function matchNigerianState(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input
    .trim()
    .toLowerCase()
    .replace(/\s+state$/, "")
    .replace(/\s+/g, " ");
  if (!s) return null;
  if (["fct", "abuja fct", "federal capital territory", "abuja federal capital territory"].includes(s)) {
    return "Abuja";
  }
  if (s === "port harcourt" || s === "portharcourt") return "Rivers";
  const hit = NIGERIAN_STATES.find((st) => st.value.toLowerCase() === s);
  return hit?.value ?? null;
}

/** Returns +234XXXXXXXXXX for valid Nigerian mobiles/landlines, else null. */
export function normalizeNigerianPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, "");
  let local: string | null = null;
  if (/^\+234\d{10}$/.test(digits)) local = digits.slice(4);
  else if (/^234\d{10}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{10}$/.test(digits)) local = digits.slice(1);
  else if (/^[789]\d{9}$/.test(digits)) local = digits;
  if (!local || !/^[789]/.test(local)) return null;
  return `+234${local}`;
}

export function isValidEmail(input: string | null | undefined): boolean {
  if (!input) return false;
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(input.trim());
}
