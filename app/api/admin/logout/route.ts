import { NextResponse } from "next/server";
import { adminCookieName } from "../../../../lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Cookieを失効させる
  res.cookies.set({
    name: adminCookieName(),
    value: "",
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
