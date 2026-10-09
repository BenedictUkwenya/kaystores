import { NextResponse } from "next/server";
import { replyToKay } from "@/lib/ai/suggest";
import type { ChatTurn } from "@/lib/ai/concierge-reply";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      afterDark?: boolean;
      messages?: { role?: string; text?: string }[];
    };

    const turns: ChatTurn[] = Array.isArray(body.messages)
      ? body.messages
          .map((turn) => ({
            role: turn.role === "kay" ? ("kay" as const) : ("user" as const),
            text: String(turn.text ?? "").trim().slice(0, 1000),
          }))
          .filter((turn) => turn.text)
          .slice(-12)
      : [];

    if (turns.length === 0 && body.query?.trim()) {
      turns.push({ role: "user", text: body.query.trim().slice(0, 1000) });
    }
    if (turns.length === 0) {
      return NextResponse.json(
        { error: "Say something to Kay first." },
        { status: 400 },
      );
    }

    const result = await replyToKay(turns, Boolean(body.afterDark));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not reach Kay." },
      { status: 500 },
    );
  }
}
