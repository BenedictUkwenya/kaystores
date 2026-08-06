import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public: resolve an open invite token to the invited email (for locked signup UI). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing invite token." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("role_invites")
    .select("email, invite_role, metadata, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.accepted_at) {
    return NextResponse.json(
      { error: "This invitation is invalid or has already been used." },
      { status: 404 },
    );
  }

  const metadata = (data.metadata ?? {}) as {
    inviteMode?: string;
    business_name?: string;
  };

  return NextResponse.json({
    email: String(data.email).toLowerCase(),
    role: data.invite_role === "admin" ? "admin" : "vendor",
    inviteMode: metadata.inviteMode === "instant" ? "instant" : "profile",
    businessName: metadata.business_name
      ? String(metadata.business_name)
      : undefined,
  });
}
