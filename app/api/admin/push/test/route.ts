import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, verifyAdminCookieValue } from "../../../../../lib/adminAuth";
import { pushToAdmins } from "../../../../../lib/push";

async function isAuthed() {
  // ★最小修正：cookies() は Promise なので先に await してから get()
  const cookie = (await cookies()).get(adminCookieName())?.value;
  const ok = (await verifyAdminCookieValue(cookie)).ok;
  return ok;
}

export async function GET() {
  const ok = await isAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    await pushToAdmins({
      title: "テスト通知",
      body: "push test",
      url: "/admin/pickup",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("push test error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
