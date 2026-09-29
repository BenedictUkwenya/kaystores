import { NextResponse } from "next/server";
import {
  AFTER_DARK_AGE_COOKIE,
  AFTER_DARK_AGE_MAX_AGE_SEC,
} from "@/lib/after-dark/age-gate";

/** Sets the httpOnly age-verification cookie (18+ confirmed). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AFTER_DARK_AGE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AFTER_DARK_AGE_MAX_AGE_SEC,
  });
  return res;
}
