import { NextResponse } from "next/server";
import { registerWithResendOtp } from "@/lib/auth/resend-otp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    const result = await registerWithResendOtp({
      email: body.email ?? "",
      password: body.password ?? "",
      fullName: body.fullName,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 500 },
    );
  }
}
