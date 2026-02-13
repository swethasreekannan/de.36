import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

// Extract brand elements from an uploaded PDF brand guidelines document
// Uses AI to read and analyze the PDF content

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save file temporarily
    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${uuid()}-${file.name}`);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Read file content as text (basic extraction)
    const textContent = Buffer.from(bytes).toString("utf-8").slice(0, 8000);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey || openaiKey) {
      const analysis = await analyzeDocWithAI(
        anthropicKey || openaiKey!,
        !!anthropicKey,
        file.name,
        textContent
      );
      return NextResponse.json(analysis);
    }

    // Without AI, return empty template for manual fill
    return NextResponse.json({
      primary_color: "#000000",
      secondary_color: "#666666",
      accent_color: "#0066FF",
      heading_font: "Inter",
      body_font: "Inter",
      brand_voice: "",
      visual_style: "",
      _note: "PDF uploaded successfully. Add an ANTHROPIC_API_KEY or OPENAI_API_KEY to enable AI-powered brand extraction.",
    });
  } catch (error) {
    return NextResponse.json({ error: `PDF extraction failed: ${error}` }, { status: 500 });
  }
}

async function analyzeDocWithAI(apiKey: string, isAnthropic: boolean, fileName: string, textContent: string) {
  const prompt = `You are analyzing a brand guidelines document named "${fileName}". Extract all brand elements you can find.

Document content excerpt:
${textContent}

Return a JSON object with these fields (fill in what you can detect from the document):
{
  "primary_color": "#hex or empty",
  "secondary_color": "#hex or empty",
  "accent_color": "#hex or empty",
  "background_color": "#hex or empty",
  "colors_extended": [],
  "heading_font": "font name or empty",
  "body_font": "font name or empty",
  "tagline": "",
  "brand_voice": "description",
  "writing_style": "guidelines for writing",
  "visual_style": "description",
  "mission": "",
  "target_audience": "",
  "tone_keywords": [],
  "mood_keywords": [],
  "dos": ["brand dos"],
  "donts": ["brand donts"]
}

Return ONLY the JSON object.`;

  if (isAnthropic) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    try { return JSON.parse(text); } catch { return { raw: text }; }
  } else {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }
}
