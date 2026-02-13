import { NextRequest, NextResponse } from "next/server";

// Extract brand elements from a website URL
// Uses AI to analyze the page and pull out colors, fonts, voice, etc.

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    // Fetch the webpage
    const pageResponse = await fetch(url, {
      headers: { "User-Agent": "DeliveryEngine-BrandExtractor/1.0" },
    });

    if (!pageResponse.ok) {
      return NextResponse.json({ error: "Could not fetch the URL" }, { status: 400 });
    }

    const html = await pageResponse.text();

    // Extract basic colors from CSS/HTML
    const colors = extractColorsFromHtml(html);
    const fonts = extractFontsFromHtml(html);
    const textContent = extractTextContent(html);

    // If we have an AI key, use AI to analyze deeper
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey || openaiKey) {
      const analysis = await analyzeWithAI(
        anthropicKey || openaiKey!,
        !!anthropicKey,
        url,
        textContent.slice(0, 4000),
        colors,
        fonts
      );
      return NextResponse.json(analysis);
    }

    // Without AI, return what we can parse
    return NextResponse.json({
      primary_color: colors[0] || "#000000",
      secondary_color: colors[1] || "#666666",
      accent_color: colors[2] || "#0066FF",
      background_color: "#FFFFFF",
      colors_extended: colors.slice(3),
      heading_font: fonts[0] || "Inter",
      body_font: fonts[1] || fonts[0] || "Inter",
      brand_voice: "",
      visual_style: "modern",
      tagline: "",
    });
  } catch (error) {
    return NextResponse.json({ error: `Extraction failed: ${error}` }, { status: 500 });
  }
}

function extractColorsFromHtml(html: string): string[] {
  const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const matches = html.match(colorRegex) || [];
  // Deduplicate and take top colors (excluding common ones like #fff, #000)
  const unique = [...new Set(matches)]
    .filter((c) => !["#fff", "#FFF", "#ffffff", "#FFFFFF", "#000", "#000000"].includes(c))
    .slice(0, 10);
  return unique;
}

function extractFontsFromHtml(html: string): string[] {
  const fontRegex = /font-family:\s*['"]?([^;'"}\n,]+)/gi;
  const matches: string[] = [];
  let match;
  while ((match = fontRegex.exec(html)) !== null) {
    const font = match[1].trim().replace(/['"]/g, "");
    if (!matches.includes(font) && font.length < 50) {
      matches.push(font);
    }
  }
  return matches.slice(0, 5);
}

function extractTextContent(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function analyzeWithAI(
  apiKey: string,
  isAnthropic: boolean,
  url: string,
  textContent: string,
  colors: string[],
  fonts: string[]
) {
  const prompt = `Analyze this website and extract brand elements. URL: ${url}

Detected colors: ${colors.join(", ")}
Detected fonts: ${fonts.join(", ")}

Page text excerpt:
${textContent}

Return a JSON object with these fields (use your best judgment to fill in what you can detect):
{
  "primary_color": "#hex",
  "secondary_color": "#hex",
  "accent_color": "#hex",
  "background_color": "#hex",
  "colors_extended": ["#hex", ...],
  "heading_font": "font name",
  "body_font": "font name",
  "tagline": "detected tagline or empty string",
  "brand_voice": "description of brand voice",
  "visual_style": "description (e.g., minimalist, bold, editorial)",
  "mission": "detected mission or empty string",
  "target_audience": "inferred target audience",
  "tone_keywords": ["keyword1", "keyword2"],
  "mood_keywords": ["keyword1", "keyword2"]
}

Return ONLY the JSON object, no other text.`;

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
