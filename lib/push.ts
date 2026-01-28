import webpush from "web-push";
import { dbExec } from "./db";

type SubRow = { endpoint: string; p256dh: string; auth: string };

function init() {
  const pub = process.env.WEB_PUSH_PUBLIC_KEY ?? "";
  const priv = process.env.WEB_PUSH_PRIVATE_KEY ?? "";
  const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:example@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export async function pushToAdmins(payload: { title: string; body: string; url?: string }) {
  if (!init()) return;

const rows = (await dbExec(
  `SELECT endpoint, p256dh, auth FROM admin_push_subscriptions ORDER BY id DESC`
)) as any[];


  for (const r of rows as SubRow[]) {
    const sub = { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } };
    try {
      await webpush.sendNotification(sub as any, JSON.stringify(payload));
    } catch (e: any) {
      // 410/404 などは購読が死んでるので削除
      const code = e?.statusCode;
      if (code === 410 || code === 404) {
        await dbExec(
  `DELETE FROM admin_push_subscriptions WHERE endpoint=?`,
  [r.endpoint] as any
);

      }
    }
  }
}
