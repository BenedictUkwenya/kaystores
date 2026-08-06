import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";
import { fetchConciergeRequestsForAccount } from "@/lib/concierge/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await fetchConciergeRequestsForAccount({
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: "Could not load concierge requests." },
      { status: 500 },
    );
  }
}
