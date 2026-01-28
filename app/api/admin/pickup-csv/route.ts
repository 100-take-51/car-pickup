import { dbQuery } from "../../../../lib/db";

function isAuthed(req: Request) {
  const pass = process.env.ADMIN_PASS || "";
  const got = req.headers.get("x-admin-pass") || "";
  return !!pass && got === pass;
}

function escCsv(v: any) {
  const s = (v ?? "").toString();
  if (/[",\r\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(req: Request) {

  const rows: any[] = await dbQuery(
    `SELECT id, created_at, updated_at, status, maker, model, drivable, owner, address, phone, email, memo
       FROM pickup_requests
       ORDER BY id DESC
       LIMIT 500`
  );


  const header = ["id","created_at","updated_at","status","maker","model","drivable","owner","address","phone","email","memo"];
  const lines = [header.join(",")];

  for (const r of rows as any[]) {
    lines.push(header.map((k) => escCsv(r[k])).join(","));
  }

  const csv = lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pickup_requests.csv"',
    },
  });
}
