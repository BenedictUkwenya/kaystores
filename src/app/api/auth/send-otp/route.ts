import { NextResponse } from "next/server";
import { sendResendAuthOtp } from "@/lib/auth/resend-otp";
import type { AuthOtpAction } from "@/lib/email/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      action?: string;
    };

    const action =
      body.action === "recovery" ? "recovery" : ("signup" as AuthOtpAction);

    const result = await sendResendAuthOtp({
      email: body.email ?? "",
      action,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({ ok: true, verifyType: result.verifyType });
  } catch {
    return NextResponse.json(
      { error: "Could not send verification email." },
      { status: 500 },
    );
  }
}
