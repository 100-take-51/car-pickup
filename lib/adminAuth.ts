const COOKIE_NAME = "admin_session";

function b64urlFromBytes(bytes: Uint8Array) {
  // base64url encode
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromB64url(s: string) {
  // base64url decode
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64urlFromString(s: string) {
  return b64urlFromBytes(new TextEncoder().encode(s));
}

function stringFromB64url(s: string) {
  return new TextDecoder().decode(bytesFromB64url(s));
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlFromBytes(new Uint8Array(sig));
}

// payload: {"exp": 1730000000000}
export async function createAdminCookieValue(expMs: number) {
  const secret = process.env.ADMIN_COOKIE_SECRET || "";
  if (!secret) throw new Error("Missing ADMIN_COOKIE_SECRET");

  const payload = b64urlFromString(JSON.stringify({ exp: expMs }));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminCookieValue(value: string | undefined) {
  if (!value) return { ok: false as const };

  const secret = process.env.ADMIN_COOKIE_SECRET || "";
  if (!secret) return { ok: false as const };

  const parts = value.split(".");
  if (parts.length !== 2) return { ok: false as const };

  const [payload, sig] = parts;
  const expected = await hmac(secret, payload);

  // timing-safe-ish compare (string compare; enough for this use)
  if (sig.length !== expected.length) return { ok: false as const };
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return { ok: false as const };

  try {
    const obj = JSON.parse(stringFromB64url(payload)) as { exp?: number };
    if (!obj?.exp || Date.now() > obj.exp) return { ok: false as const };
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

export function adminCookieName() {
  return COOKIE_NAME;
}
