import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, key: process.env.WEB_PUSH_PUBLIC_KEY ?? "" });
}
