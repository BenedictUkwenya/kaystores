import "server-only";

type TerminalState = { name: string; isoCode: string };
type TerminalCity = { name: string; stateCode?: string };

function getTerminalSecret(): string {
  const secret = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();
  if (!secret) throw new Error("Shipping is not configured.");
  return secret;
}

const STATE_CAPITALS: Record<string, string> = {
  abia: "Umuahia",
  abuja: "Abuja",
  adamawa: "Yola",
  "akwa ibom": "Uyo",
  anambra: "Awka",
  bauchi: "Bauchi",
  bayelsa: "Yenagoa",
  benue: "Makurdi",
  borno: "Maiduguri",
  "cross river": "Calabar",
  delta: "Asaba",
  ebonyi: "Abakaliki",
  edo: "Benin City",
  ekiti: "Ado Ekiti",
  enugu: "Enugu",
  gombe: "Gombe",
  imo: "Owerri",
  jigawa: "Dutse",
  kaduna: "Kaduna",
  kano: "Kano",
  katsina: "Katsina",
  kebbi: "Birnin Kebbi",
  kogi: "Lokoja",
  kwara: "Ilorin",
  lagos: "Lagos",
  nasarawa: "Lafia",
  niger: "Minna",
  ogun: "Abeokuta",
  ondo: "Akure",
  osun: "Osogbo",
  oyo: "Ibadan",
  plateau: "Jos",
  rivers: "Port Harcourt",
  sokoto: "Sokoto",
  taraba: "Jalingo",
  yobe: "Damaturu",
  zamfara: "Gusau",
};

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function scoreCityMatch(query: string, candidate: string): number {
  const q = norm(query);
  const c = norm(candidate);
  if (q === c) return 100;
  if (c.includes(q) || q.includes(c)) return 80;
  // token overlap (Owerri West → Owerri)
  const qTokens = q.split(" ");
  const cTokens = c.split(" ");
  const hits = qTokens.filter((t) => cTokens.some((ct) => ct.includes(t) || t.includes(ct)));
  if (hits.length) return 40 + hits.length * 10;
  return 0;
}

async function fetchNgStates(): Promise<TerminalState[]> {
  const res = await fetch("https://api.terminal.africa/v1/states?country_code=NG", {
    headers: {
      Authorization: `Bearer ${getTerminalSecret()}`,
      "Content-Type": "application/json",
    },
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  const body = (await res.json()) as { data?: TerminalState[]; message?: string };
  if (!res.ok || !body.data) return [];
  return body.data;
}

async function fetchNgCities(stateCode: string): Promise<TerminalCity[]> {
  const res = await fetch(
    `https://api.terminal.africa/v1/cities?country_code=NG&state_code=${encodeURIComponent(stateCode)}`,
    {
      headers: {
        Authorization: `Bearer ${getTerminalSecret()}`,
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: { revalidate: 86400 },
    },
  );
  const body = (await res.json()) as { data?: TerminalCity[]; message?: string };
  if (!res.ok || !body.data) return [];
  return body.data;
}

/**
 * Terminal only accepts cities from its list. Map free-text (e.g. Ihiagwa)
 * to the closest valid city (e.g. Owerri) for the given state.
 */
export async function resolveTerminalCity(input: {
  state: string;
  city: string;
  countryCode: string;
}): Promise<{ city: string; matched: boolean; originalCity: string }> {
  const originalCity = input.city.trim();
  if (input.countryCode !== "NG") {
    return { city: originalCity, matched: true, originalCity };
  }

  const stateKey = norm(input.state).replace(/ state$/, "");
  try {
    const states = await fetchNgStates();
    const state =
      states.find((s) => norm(s.name) === stateKey) ??
      states.find((s) => norm(s.name).includes(stateKey) || stateKey.includes(norm(s.name)));

    if (state?.isoCode) {
      const cities = await fetchNgCities(state.isoCode);
      if (cities.length) {
        let best: TerminalCity | null = null;
        let bestScore = 0;
        for (const city of cities) {
          const score = scoreCityMatch(originalCity, city.name);
          if (score > bestScore) {
            bestScore = score;
            best = city;
          }
        }
        if (best && bestScore >= 40) {
          return {
            city: best.name,
            matched: bestScore >= 80,
            originalCity,
          };
        }
        // No decent match — use capital / first known city for the state
        const capital = STATE_CAPITALS[stateKey];
        const capitalCity = capital
          ? cities.find((c) => norm(c.name) === norm(capital))
          : null;
        if (capitalCity) {
          return { city: capitalCity.name, matched: false, originalCity };
        }
        return { city: cities[0].name, matched: false, originalCity };
      }
    }
  } catch {
    // fall through to static capital
  }

  const capital = STATE_CAPITALS[stateKey];
  if (capital) {
    return { city: capital, matched: false, originalCity };
  }
  return { city: originalCity, matched: false, originalCity };
}
