import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const collateral = db.prepare("SELECT * FROM collaterals WHERE id = ?").get(id);
  if (!collateral) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Also fetch agent logs
  const logs = db.prepare(
    "SELECT * FROM agent_logs WHERE collateral_id = ? ORDER BY created_at ASC"
  ).all(id);

  return NextResponse.json({ ...collateral as Record<string, unknown>, agent_logs: logs });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const allowed = ["status", "title", "brief", "review_notes"];
  const fields = Object.keys(body)
    .filter((k) => allowed.includes(k))
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (!fields) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  db.prepare(`UPDATE collaterals SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...body, id });
  const collateral = db.prepare("SELECT * FROM collaterals WHERE id = ?").get(id);
  return NextResponse.json(collateral);
}
