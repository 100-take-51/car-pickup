import { NextResponse } from "next/server";
import { dbExec } from "../../../../../lib/db";

type Sub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(req: Request) {
  const sub = (await req.json()) as Sub;

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ ok: false, error: "invalid subscription" }, { status: 400 });
  }

 await dbExec(
  `INSERT INTO admin_push_subscriptions (endpoint, p256dh, auth)
   VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE p256dh=VALUES(p256dh), auth=VALUES(auth)`,
  [sub.endpoint, sub.keys.p256dh, sub.keys.auth] as any
);

  return NextResponse.json({ ok: true });
}
