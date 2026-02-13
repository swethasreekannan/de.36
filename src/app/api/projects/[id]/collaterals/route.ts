import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const collaterals = db.prepare(
    "SELECT * FROM collaterals WHERE project_id = ? ORDER BY updated_at DESC"
  ).all(id);
  return NextResponse.json(collaterals);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { type, title, brief } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "type and title are required" }, { status: 400 });
  }

  const db = getDb();
  const collateralId = uuid();

  db.prepare(
    "INSERT INTO collaterals (id, project_id, type, title, brief) VALUES (?, ?, ?, ?, ?)"
  ).run(collateralId, id, type, title, brief || "");

  const collateral = db.prepare("SELECT * FROM collaterals WHERE id = ?").get(collateralId);
  return NextResponse.json(collateral, { status: 201 });
}
