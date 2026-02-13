import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

// GET — list all members of a project
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const members = db.prepare(`
    SELECT pm.*, u.email, u.name, u.avatar_url
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.joined_at ASC
  `).all(id);
  return NextResponse.json(members);
}

// POST — invite a team member by email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, name, role } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = getDb();

  // Check project exists
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Find or create user
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (!user) {
    const userId = uuid();
    db.prepare("INSERT INTO users (id, email, name) VALUES (?, ?, ?)").run(
      userId,
      email,
      name || email.split("@")[0]
    );
    user = { id: userId };
  }

  // Check if already a member
  const existing = db.prepare(
    "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?"
  ).get(id, user.id);
  if (existing) {
    return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });
  }

  // Add as member
  const memberId = uuid();
  db.prepare(
    "INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)"
  ).run(memberId, id, user.id, role || "member");

  // Return the full member info
  const member = db.prepare(`
    SELECT pm.*, u.email, u.name, u.avatar_url
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.id = ?
  `).get(memberId);

  return NextResponse.json(member, { status: 201 });
}

// DELETE — remove a member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user_id } = await req.json();

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?").run(id, user_id);
  return NextResponse.json({ success: true });
}
