import { NextResponse } from "next/server";
import { dbExec } from "../../../lib/db";
import { sendMail } from "../../../lib/mail";
import { pushToAdmins } from "../../../lib/push";

// --- spam protection (simple in-memory) ---
type Hit = { count: number; resetAt: number };
const ipHits = new Map<string, Hit>();

function getClientIp(req: Request) {
  // Vercel等では x-forwarded-for が入る。ローカルは空のこともある
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// 例：1分で10回まで
function rateLimit(req: Request, limit = 10, windowMs = 60_000) {
  const ip = getClientIp(req);
  const now = Date.now();
  const cur = ipHits.get(ip);

  if (!cur || now > cur.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  cur.count += 1;
  ipHits.set(ip, cur);

  if (cur.count > limit) {
    const retryAfterSec = Math.ceil((cur.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }

  return { ok: true };
}



type Body = {
  maker: string;
  model: string;
  drivable: "drivable" | "not_drivable";
  owner: "self" | "not_self";
  address: string;
  phone: string;
  email: string;
  company?: string;

};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizePhone(s: string) {
  return s.replace(/[^\d+]/g, "").trim();
}

export async function POST(req: Request) {
  let body: Body;

  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const maker = (body.maker ?? "").trim();
  const model = (body.model ?? "").trim();
  const drivable = body.drivable;
  const owner = body.owner;
  const address = (body.address ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const email = (body.email ?? "").trim();
  // rate limit
  const rl = rateLimit(req, 10, 60_000); // 1分10回まで
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please retry later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );

  }

  // honeypot: bots tend to fill hidden fields
  const company = (body.company ?? "").trim();
  if (company) {
    // botっぽいので「成功したように見せて」捨てる（ユーザー体験を壊さない）
    return NextResponse.json({ ok: true });
  
  }


  if (!maker || !model || !address || !phone || !email) {
    return NextResponse.json({ ok: false, error: "Required fields are missing" }, { status: 400 });
  }
  if (drivable !== "drivable" && drivable !== "not_drivable") {
    return NextResponse.json({ ok: false, error: "Invalid drivable" }, { status: 400 });
  }
  if (owner !== "self" && owner !== "not_self") {
    return NextResponse.json({ ok: false, error: "Invalid owner" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  try {
   await dbExec(
  `INSERT INTO pickup_requests
     (maker, model, drivable, owner, address, phone, email)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [maker, model, drivable, owner, address, phone, email]
);

pushToAdmins({
  title: "新規：引取相談",
  body: `${maker} ${model} / ${drivable === "drivable" ? "自走可" : "不動"}`,
  url: "/admin/pickup",
}).catch((e) => console.error("push error:", e));

    
sendMail(
  `【引取相談】${maker} ${model} / ${drivable === "drivable" ? "自走可" : "不動"} / ${owner === "self" ? "本人" : "本人以外"}`,
  [
    `日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
    `メーカー: ${maker}`,
    `車種: ${model}`,
    `自走可否: ${drivable === "drivable" ? "自走可" : "不動"}`,
    `名義: ${owner === "self" ? "本人" : "本人以外（相続等）"}`,
    `住所: ${address}`,
    `電話: ${phone}`,
    `メール: ${email}`,
  ].join("\n")
).catch((e) => console.error("mail error:", e));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB insert error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
