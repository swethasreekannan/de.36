import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const JSON_FIELDS = ["colors_extended", "tone_keywords", "dos", "donts", "mood_keywords", "reference_urls"];
const ALLOWED_FIELDS = [
  "primary_color", "secondary_color", "accent_color", "background_color", "colors_extended",
  "heading_font", "body_font", "font_sizes",
  "brand_voice", "tone_keywords", "writing_style",
  "logo_url", "logo_dark_url", "icon_url",
  "dos", "donts", "tagline", "mission", "target_audience",
  "visual_style", "mood_keywords", "reference_urls",
];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const kit = db.prepare("SELECT * FROM brand_kits WHERE project_id = ?").get(id) as Record<string, unknown> | undefined;
  if (!kit) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });

  // Parse JSON fields
  for (const field of JSON_FIELDS) {
    if (typeof kit[field] === "string") {
      try { kit[field] = JSON.parse(kit[field] as string); } catch { /* keep as string */ }
    }
  }
  if (typeof kit.font_sizes === "string") {
    try { kit.font_sizes = JSON.parse(kit.font_sizes as string); } catch { /* keep */ }
  }

  return NextResponse.json(kit);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  // Serialize JSON fields
  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.includes(key)) continue;
    if (JSON_FIELDS.includes(key) || key === "font_sizes") {
      serialized[key] = typeof value === "string" ? value : JSON.stringify(value);
    } else {
      serialized[key] = value;
    }
  }

  const fields = Object.keys(serialized)
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (!fields) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  db.prepare(`UPDATE brand_kits SET ${fields}, updated_at = datetime('now') WHERE project_id = @project_id`).run({
    ...serialized,
    project_id: id,
  });

  // Return updated kit
  const kit = db.prepare("SELECT * FROM brand_kits WHERE project_id = ?").get(id) as Record<string, unknown>;
  for (const field of JSON_FIELDS) {
    if (typeof kit[field] === "string") {
      try { kit[field] = JSON.parse(kit[field] as string); } catch { /* keep */ }
    }
  }
  if (typeof kit.font_sizes === "string") {
    try { kit.font_sizes = JSON.parse(kit.font_sizes as string); } catch { /* keep */ }
  }

  return NextResponse.json(kit);
}
