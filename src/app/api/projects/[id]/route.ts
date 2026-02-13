import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const fields = Object.keys(body)
    .filter((k) => ["name", "client_name", "description", "status"].includes(k))
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (!fields) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  db.prepare(`UPDATE projects SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({
    ...body,
    id,
  });

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json(project);
}
