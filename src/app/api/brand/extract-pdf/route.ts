import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

// Brand extraction agent prompt — teaches the LLM how to analyze brand guidelines
const BRAND_AGENT_PROMPT = `You are an expert brand analyst agent. You are reviewing a brand guidelines PDF document.

Your job: extract every brand element from this document with precision. You have been trained to identify:

## COLORS
Look at color swatches, palette sections, logo usage, backgrounds, and any hex/RGB values shown.
- Primary color: the dominant brand color (logo, headers, key UI elements)
- Secondary color: the supporting brand color
- Accent color: used for CTAs, highlights, or emphasis
- Background color: typical page/section backgrounds
- Extended palette: any additional brand colors

## TYPOGRAPHY
Look for font specimens, typography sections, or any named typefaces.
- Heading/display font family (exact name, e.g. "Montserrat", "Playfair Display")
- Body/paragraph font family
- Note specific weights if mentioned (Bold, Light, etc.)

## BRAND IDENTITY
- Tagline or slogan
- Mission statement or brand purpose
- Target audience
- Brand voice (how the brand speaks — formal, warm, bold, technical, etc.)
- Writing style guidelines
- Visual style (clean, organic, geometric, minimalist, etc.)

## BRAND RULES
- Dos: things the brand should always do
- Don'ts: things the brand must avoid

## INSTRUCTIONS
- Be precise with hex color values. Estimate from visual swatches if exact values aren't printed.
- If a color appears as a large swatch, read its hex value from any labels nearby.
- For fonts, use the exact typeface name shown in the document.
- Extract real content — never return placeholder or generic values.
- If you truly cannot find a field, leave it as empty string or empty array.

Return ONLY a JSON object with this structure:
{
  "primary_color": "#hex",
  "secondary_color": "#hex",
  "accent_color": "#hex",
  "background_color": "#hex",
  "colors_extended": ["#hex1", "#hex2"],
  "heading_font": "Font Name",
  "body_font": "Font Name",
  "tagline": "",
  "brand_voice": "description of how the brand communicates",
  "writing_style": "guidelines for written content",
  "visual_style": "description of the visual identity",
  "mission": "",
  "target_audience": "",
  "tone_keywords": ["keyword1", "keyword2"],
  "mood_keywords": ["keyword1", "keyword2"],
  "dos": ["brand guideline dos"],
  "donts": ["brand guideline donts"]
}

Return ONLY valid JSON. No markdown fences, no explanation, no commentary.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save file for reference
    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${uuid()}-${file.name}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      // Send the actual PDF to Claude using native document support
      // Claude can SEE the PDF pages — colors, fonts, layouts, everything
      const pdfBase64 = buffer.toString("base64");
      console.log(`[extract-pdf] Using Anthropic API. PDF size: ${(buffer.length / 1024).toFixed(1)}KB, base64 length: ${pdfBase64.length}`);
      const analysis = await analyzeWithClaude(anthropicKey, pdfBase64);
      console.log("[extract-pdf] Anthropic extraction successful:", Object.keys(analysis));
      return NextResponse.json(analysis);
    }

    if (openaiKey) {
      // OpenAI fallback: send text content (less accurate for visual elements)
      const textContent = buffer.toString("utf-8").slice(0, 8000);
      console.log(`[extract-pdf] Using OpenAI API fallback. Text content length: ${textContent.length}`);
      const analysis = await analyzeWithOpenAI(openaiKey, file.name, textContent);
      console.log("[extract-pdf] OpenAI extraction successful:", Object.keys(analysis));
      return NextResponse.json(analysis);
    }

    // No API key — return a real error, not silent defaults
    console.warn("[extract-pdf] No API key configured. Set ANTHROPIC_API_KEY in .env.local");
    return NextResponse.json(
      { error: "No AI API key configured. Add ANTHROPIC_API_KEY to your .env.local file and restart the dev server." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[extract-pdf] Extraction failed:", error);
    return NextResponse.json(
      { error: `PDF extraction failed: ${error instanceof Error ? error.message : error}` },
      { status: 500 }
    );
  }
}

async function analyzeWithClaude(apiKey: string, pdfBase64: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: BRAND_AGENT_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[extract-pdf] Anthropic API error:", response.status, JSON.stringify(data.error || data));
    throw new Error(
      data.error?.message || `Anthropic API error (${response.status})`
    );
  }

  const text = data.content?.[0]?.text || "{}";
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { raw: text, _note: "AI response could not be parsed as JSON" };
  }
}

async function analyzeWithOpenAI(
  apiKey: string,
  fileName: string,
  textContent: string
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are analyzing a brand guidelines document named "${fileName}".\n\nDocument text:\n${textContent}\n\n${BRAND_AGENT_PROMPT}`,
        },
      ],
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `OpenAI API error (${response.status})`
    );
  }

  const text = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, _note: "AI response could not be parsed as JSON" };
  }
}
