import { NextResponse } from "next/server";
import { dbExec, dbQuery } from "../../../../lib/db";

type Status = "new" | "working" | "done" | "ng";

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export const dynamic = "force-dynamic";

// GET /api/admin/pickup?limit=200&q=...&status=new
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = clampInt(url.searchParams.get("limit"), 200, 1, 500);
    const q = (url.searchParams.get("q") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim() as Status | "";

    const where: string[] = [];
    const params: any[] = [];

    if (q) {
      const like = `%${q}%`;
      where.push(
        `(maker LIKE ? OR model LIKE ? OR address LIKE ? OR phone LIKE ? OR email LIKE ? OR memo LIKE ?)`
      );
      params.push(like, like, like, like, like, like);
    }

    if (status && ["new", "working", "done", "ng"].includes(status)) {
      where.push(`status = ?`);
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    params.push(limit);

    const rows = await dbQuery<any[]>(
      `SELECT id, maker, model, drivable, owner, address, phone, email,
              status, memo, created_at, updated_at
         FROM pickup_requests
         ${whereSql}
         ORDER BY id DESC
         LIMIT ?`,
      params
    );

    // ★今回の切り分け用：Nextが見てるDBを返す（問題が解決したら消してOK）
    return NextResponse.json({
      ok: true,
      rows,
      
    });
  } catch (e: any) {
    console.error("admin pickup GET error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/pickup
// 単体: { id, status, memo }
// 一括: { ids: number[], status }
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // ---- bulk update ----
    if (Array.isArray(body?.ids)) {
      const ids = body.ids.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n) && n > 0);
      const status = String(body?.status ?? "") as Status;

      if (ids.length === 0) {
        return NextResponse.json({ ok: false, error: "Invalid ids" }, { status: 400 });
      }
      if (!["new", "working", "done", "ng"].includes(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
      }

      // IN (?) を安全に組み立て
      const placeholders = ids.map(() => "?").join(",");
      await dbExec(
        `UPDATE pickup_requests
            SET status = ?
          WHERE id IN (${placeholders})`,
        [status, ...ids]
      );

      return NextResponse.json({ ok: true });
    }

    // ---- single update ----
    const id = Number(body?.id);
    const status = String(body?.status ?? "") as Status;
    const memoRaw = body?.memo;
    const memo = memoRaw === null || memoRaw === undefined ? null : String(memoRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }
    if (!["new", "working", "done", "ng"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    await dbExec(
      `UPDATE pickup_requests
          SET status = ?, memo = ?
        WHERE id = ?`,
      [status, memo, id]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("admin pickup PATCH error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

