import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  const projects = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, client_name, description } = body;

  if (!name || !client_name) {
    return NextResponse.json({ error: "Name and client_name are required" }, { status: 400 });
  }

  const db = getDb();
  const id = uuid();

  db.prepare(
    "INSERT INTO projects (id, name, client_name, description) VALUES (?, ?, ?, ?)"
  ).run(id, name, client_name, description || "");

  // Auto-create brand kit
  const brandKitId = uuid();
  db.prepare("INSERT INTO brand_kits (id, project_id) VALUES (?, ?)").run(brandKitId, id);

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
