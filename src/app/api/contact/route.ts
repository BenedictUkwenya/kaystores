import { NextResponse } from "next/server";
import { sendKayEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const email = body.email?.trim();
    const message = body.message?.trim();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 },
      );
    }

    void sendKayEmail({
      type: "contact",
      appUrl: getSiteUrl(),
      contact: {
        firstName: body.firstName,
        lastName: body.lastName,
        email,
        subject: body.subject,
        message,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }
}
