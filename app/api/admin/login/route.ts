import { NextResponse } from "next/server";
import { adminCookieName, createAdminCookieValue } from "../../../../lib/adminAuth";

type Body = { pass?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const pass = (body.pass ?? "").trim();
  const adminPass = process.env.ADMIN_PASS || "";

  if (!adminPass || pass !== adminPass) {
    return NextResponse.json({ ok: false, error: "ログイン失敗" }, { status: 401 });
  }

  // ★ここがポイント：shadow しない
  let cookieValue = "";
  try {
    const expMs = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30日
    cookieValue = await createAdminCookieValue(expMs); // ← const じゃなく代入
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Cookie error: ${e?.message ?? e}` },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: adminCookieName(), // "admin_session"
    value: cookieValue,      // ★空じゃなくなる
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
