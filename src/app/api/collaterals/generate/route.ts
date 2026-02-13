import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { BrandKit, CollateralType } from "@/lib/types";

// Generate collateral by running the full agent pipeline
// POST { project_id, type, title, brief, additional_context? }

const JSON_FIELDS = ["colors_extended", "tone_keywords", "dos", "donts", "mood_keywords", "reference_urls"];

function parseBrandKit(raw: Record<string, unknown>): BrandKit {
  const kit = { ...raw } as Record<string, unknown>;
  for (const field of JSON_FIELDS) {
    if (typeof kit[field] === "string") {
      try { kit[field] = JSON.parse(kit[field] as string); } catch { kit[field] = []; }
    }
  }
  if (typeof kit.font_sizes === "string") {
    try { kit.font_sizes = JSON.parse(kit.font_sizes as string); } catch { /* keep */ }
  }
  return kit as unknown as BrandKit;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { project_id, type, title, brief, additional_context } = body;

  if (!project_id || !type || !title) {
    return NextResponse.json({ error: "project_id, type, and title are required" }, { status: 400 });
  }

  const db = getDb();

  // Verify project exists
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(project_id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get brand kit
  const rawKit = db.prepare("SELECT * FROM brand_kits WHERE project_id = ?").get(project_id) as Record<string, unknown> | undefined;
  if (!rawKit) {
    return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
  }
  const brandKit = parseBrandKit(rawKit);

  // Create collateral record
  const collateralId = uuid();
  db.prepare(
    "INSERT INTO collaterals (id, project_id, type, title, brief, status) VALUES (?, ?, ?, ?, ?, 'draft')"
  ).run(collateralId, project_id, type, title, brief || "");

  // Run the agent pipeline via internal API calls
  // This is done sequentially: Creative Director → Writers/Designers → Brand Guardian
  try {
    const baseUrl = req.nextUrl.origin;

    // Phase 1: Creative Director
    const cdResult = await invokeAgent(baseUrl, "creative_director", type, title, brief, brandKit, additional_context);

    // Phase 2: Run content writer + specialist in parallel
    const phase2 = [
      invokeAgent(baseUrl, "content_writer", type, title, brief, brandKit, additional_context, cdResult.content),
    ];

    if (needsDesigner(type)) {
      phase2.push(invokeAgent(baseUrl, "designer", type, title, brief, brandKit, additional_context, cdResult.content));
    }
    if (needsDeckArchitect(type)) {
      phase2.push(invokeAgent(baseUrl, "deck_architect", type, title, brief, brandKit, additional_context, cdResult.content));
    }
    if (needsMotion(type)) {
      phase2.push(invokeAgent(baseUrl, "motion_designer", type, title, brief, brandKit, additional_context, cdResult.content));
    }

    const phase2Results = await Promise.all(phase2);
    const contentResult = phase2Results[0];
    const designResult = phase2Results.find(r => r.agent === "designer");
    const deckResult = phase2Results.find(r => r.agent === "deck_architect");
    const motionResult = phase2Results.find(r => r.agent === "motion_designer");

    // Phase 3: Brand Guardian review
    const allContent = [
      cdResult.content,
      contentResult?.content,
      designResult?.content,
      deckResult?.content,
      motionResult?.content,
    ].filter(Boolean).join("\n\n---\n\n");

    const guardianResult = await invokeAgent(baseUrl, "brand_guardian", type, title, allContent, brandKit);

    // Parse brand score
    const scoreMatch = guardianResult.content.match(/(?:score|alignment)[:\s]*(\d{1,3})/i);
    const brandScore = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 75;

    // Update collateral with results
    db.prepare(`
      UPDATE collaterals SET
        creative_direction = ?,
        content = ?,
        design_spec = ?,
        deck_data = ?,
        motion_spec = ?,
        brand_score = ?,
        review_notes = ?,
        status = 'in_review',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      cdResult.content,
      contentResult?.content || "",
      designResult?.content || "",
      deckResult?.content || "",
      motionResult?.content || "",
      brandScore,
      guardianResult.content,
      collateralId
    );

    // Log agent activity
    const allResults = [cdResult, ...phase2Results, guardianResult];
    for (const result of allResults) {
      db.prepare(
        "INSERT INTO agent_logs (id, collateral_id, agent_name, action, output, duration_ms) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(uuid(), collateralId, result.agent, "generate", result.content.slice(0, 500), result.duration_ms || 0);
    }

    const collateral = db.prepare("SELECT * FROM collaterals WHERE id = ?").get(collateralId);
    return NextResponse.json(collateral, { status: 201 });
  } catch (error) {
    // Mark as draft on failure
    db.prepare("UPDATE collaterals SET status = 'draft', review_notes = ? WHERE id = ?").run(
      `Generation failed: ${error}`,
      collateralId
    );
    return NextResponse.json({ error: `Pipeline failed: ${error}` }, { status: 500 });
  }
}

function needsDesigner(type: CollateralType) {
  return ["social_post", "one_pager", "gif", "figma_spec", "landing_page", "custom"].includes(type);
}

function needsDeckArchitect(type: CollateralType) {
  return ["deck_l1", "deck_l2", "deck_l3"].includes(type);
}

function needsMotion(type: CollateralType) {
  return ["video_script", "gif"].includes(type);
}

import { brandContext } from "@/lib/agents/prompts";
import {
  CREATIVE_DIRECTOR_SYSTEM,
  CONTENT_WRITER_SYSTEM,
  DESIGNER_SYSTEM,
  DECK_ARCHITECT_SYSTEM,
  MOTION_DESIGNER_SYSTEM,
  BRAND_GUARDIAN_SYSTEM,
} from "@/lib/agents/prompts";

const AGENT_SYSTEMS: Record<string, string> = {
  creative_director: CREATIVE_DIRECTOR_SYSTEM,
  content_writer: CONTENT_WRITER_SYSTEM,
  designer: DESIGNER_SYSTEM,
  deck_architect: DECK_ARCHITECT_SYSTEM,
  motion_designer: MOTION_DESIGNER_SYSTEM,
  brand_guardian: BRAND_GUARDIAN_SYSTEM,
};

async function invokeAgent(
  baseUrl: string,
  agentName: string,
  type: CollateralType,
  title: string,
  brief: string,
  brandKit: BrandKit,
  additionalContext?: string,
  creativeDirection?: string
): Promise<{ agent: string; content: string; duration_ms: number }> {
  const start = Date.now();
  const brandCtx = brandContext(brandKit);

  let userPrompt = `## BRIEF\n**Type:** ${type.replace(/_/g, " ").toUpperCase()}\n**Title:** ${title}\n**Brief:** ${brief}\n\n${brandCtx}`;

  if (additionalContext) {
    userPrompt += `\n\n## ADDITIONAL CONTEXT\n${additionalContext}`;
  }
  if (creativeDirection) {
    userPrompt += `\n\n## CREATIVE DIRECTION\n${creativeDirection}`;
  }

  const response = await fetch(`${baseUrl}/api/agents/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: AGENT_SYSTEMS[agentName],
      prompt: userPrompt,
      agent: agentName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent ${agentName} failed`);
  }

  const data = await response.json();
  return {
    agent: agentName,
    content: data.content || "",
    duration_ms: Date.now() - start,
  };
}
