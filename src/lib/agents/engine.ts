import { BrandKit, CollateralType, GenerationRequest, AgentOutput } from "../types";
import {
  brandContext,
  CREATIVE_DIRECTOR_SYSTEM,
  CONTENT_WRITER_SYSTEM,
  DESIGNER_SYSTEM,
  DECK_ARCHITECT_SYSTEM,
  MOTION_DESIGNER_SYSTEM,
  BRAND_GUARDIAN_SYSTEM,
} from "./prompts";

// Agent orchestration engine — runs the full creative pipeline

interface PipelineResult {
  creative_direction: string;
  content: string;
  design_spec: string;
  deck_data: string;
  motion_spec: string;
  brand_score: number;
  review_notes: string;
  agent_logs: AgentOutput[];
}

async function callAgent(
  systemPrompt: string,
  userPrompt: string,
  agentName: string
): Promise<AgentOutput> {
  const start = Date.now();

  const response = await fetch("/api/agents/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, agent: agentName }),
  });

  if (!response.ok) {
    throw new Error(`Agent ${agentName} failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    agent: agentName as AgentOutput["agent"],
    content: data.content,
    metadata: data.metadata,
    duration_ms: Date.now() - start,
  };
}

function getRequiredAgents(type: CollateralType): string[] {
  const base = ["creative_director", "content_writer", "brand_guardian"];

  switch (type) {
    case "social_post":
      return [...base, "designer"];
    case "video_script":
      return [...base, "motion_designer"];
    case "one_pager":
      return [...base, "designer"];
    case "deck_l1":
    case "deck_l2":
    case "deck_l3":
      return [...base, "deck_architect"];
    case "gif":
      return [...base, "designer", "motion_designer"];
    case "figma_spec":
      return [...base, "designer"];
    case "blog_post":
    case "email":
    case "ad_copy":
      return [...base];
    case "landing_page":
      return [...base, "designer"];
    case "custom":
      return [...base, "designer"];
    default:
      return base;
  }
}

export async function runPipeline(request: GenerationRequest): Promise<PipelineResult> {
  const { type, title, brief, brand_kit, additional_context } = request;
  const agents = getRequiredAgents(type);
  const logs: AgentOutput[] = [];
  const brandCtx = brandContext(brand_kit);

  const briefPrompt = `
## BRIEF
**Type:** ${type.replace(/_/g, " ").toUpperCase()}
**Title:** ${title}
**Brief:** ${brief}
${additional_context ? `**Additional Context:** ${additional_context}` : ""}

${brandCtx}
`.trim();

  // Phase 1: Creative Director sets the vision
  const cdOutput = await callAgent(
    CREATIVE_DIRECTOR_SYSTEM,
    `Create a creative direction for this deliverable:\n\n${briefPrompt}`,
    "creative_director"
  );
  logs.push(cdOutput);

  // Phase 2: Content Writer + Designer/Specialist run in parallel
  const phase2Promises: Promise<AgentOutput>[] = [];

  // Content Writer always runs
  phase2Promises.push(
    callAgent(
      CONTENT_WRITER_SYSTEM,
      `Write the copy for this deliverable.\n\n${briefPrompt}\n\n## CREATIVE DIRECTION\n${cdOutput.content}`,
      "content_writer"
    )
  );

  // Designer if needed
  if (agents.includes("designer")) {
    phase2Promises.push(
      callAgent(
        DESIGNER_SYSTEM,
        `Create a design specification for this deliverable.\n\n${briefPrompt}\n\n## CREATIVE DIRECTION\n${cdOutput.content}`,
        "designer"
      )
    );
  }

  // Deck Architect if needed
  if (agents.includes("deck_architect")) {
    const deckLevel = type === "deck_l3" ? "L3 (Beautiful Animations)" : type === "deck_l2" ? "L2 (Slide Transitions)" : "L1 (Brand Aligned)";
    phase2Promises.push(
      callAgent(
        DECK_ARCHITECT_SYSTEM,
        `Create a ${deckLevel} deck specification.\n\n${briefPrompt}\n\n## CREATIVE DIRECTION\n${cdOutput.content}`,
        "deck_architect"
      )
    );
  }

  // Motion Designer if needed
  if (agents.includes("motion_designer")) {
    phase2Promises.push(
      callAgent(
        MOTION_DESIGNER_SYSTEM,
        `Create motion/animation specifications.\n\n${briefPrompt}\n\n## CREATIVE DIRECTION\n${cdOutput.content}`,
        "motion_designer"
      )
    );
  }

  const phase2Results = await Promise.all(phase2Promises);
  logs.push(...phase2Results);

  // Extract results by agent
  const contentOutput = phase2Results.find((r) => r.agent === "content_writer");
  const designOutput = phase2Results.find((r) => r.agent === "designer");
  const deckOutput = phase2Results.find((r) => r.agent === "deck_architect");
  const motionOutput = phase2Results.find((r) => r.agent === "motion_designer");

  // Phase 3: Brand Guardian reviews everything
  const reviewPrompt = `Review this deliverable for brand alignment.

${brandCtx}

## CREATIVE DIRECTION
${cdOutput.content}

## CONTENT/COPY
${contentOutput?.content || "N/A"}

${designOutput ? `## DESIGN SPECIFICATION\n${designOutput.content}` : ""}
${deckOutput ? `## DECK SPECIFICATION\n${deckOutput.content}` : ""}
${motionOutput ? `## MOTION SPECIFICATION\n${motionOutput.content}` : ""}`;

  const guardianOutput = await callAgent(BRAND_GUARDIAN_SYSTEM, reviewPrompt, "brand_guardian");
  logs.push(guardianOutput);

  // Parse brand score from guardian output
  const scoreMatch = guardianOutput.content.match(/(?:score|alignment)[:\s]*(\d{1,3})/i);
  const brandScore = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 75;

  return {
    creative_direction: cdOutput.content,
    content: contentOutput?.content || "",
    design_spec: designOutput?.content || "",
    deck_data: deckOutput?.content || "",
    motion_spec: motionOutput?.content || "",
    brand_score: brandScore,
    review_notes: guardianOutput.content,
    agent_logs: logs,
  };
}

export { getRequiredAgents };
