import { NextResponse } from "next/server";
import { suggestProducts } from "@/lib/ai/suggest";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      afterDark?: boolean;
    };

    const query = body.query?.trim() ?? "";
    if (!query) {
      return NextResponse.json(
        { error: "Please describe who the gift is for." },
        { status: 400 },
      );
    }

    const result = await suggestProducts(query, Boolean(body.afterDark));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not generate suggestions." },
      { status: 500 },
    );
  }
}
