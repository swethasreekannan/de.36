import { NextRequest, NextResponse } from "next/server";

// This endpoint invokes an AI agent with the given system prompt and user prompt.
// It supports multiple providers — defaults to Anthropic Claude, falls back to OpenAI.
// Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env.local

export async function POST(req: NextRequest) {
  const { system, prompt, agent } = await req.json();

  if (!system || !prompt) {
    return NextResponse.json({ error: "system and prompt are required" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    if (anthropicKey) {
      return await callAnthropic(anthropicKey, system, prompt, agent);
    } else if (openaiKey) {
      return await callOpenAI(openaiKey, system, prompt, agent);
    } else {
      // Demo mode — return structured placeholder to show the pipeline works
      return NextResponse.json({
        content: getDemoResponse(agent, prompt),
        metadata: { provider: "demo", agent },
      });
    }
  } catch (error) {
    console.error(`Agent ${agent} error:`, error);
    return NextResponse.json(
      { error: `Agent invocation failed: ${error}` },
      { status: 500 }
    );
  }
}

async function callAnthropic(apiKey: string, system: string, prompt: string, agent: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";

  return NextResponse.json({ content, metadata: { provider: "anthropic", agent, model: "claude-sonnet-4-5-20250929" } });
}

async function callOpenAI(apiKey: string, system: string, prompt: string, agent: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  return NextResponse.json({ content, metadata: { provider: "openai", agent, model: "gpt-4o" } });
}

function getDemoResponse(agent: string, prompt: string): string {
  const briefMatch = prompt.match(/\*\*Title:\*\*\s*(.+)/);
  const title = briefMatch?.[1] || "Untitled";

  const responses: Record<string, string> = {
    creative_director: `# Creative Direction: ${title}

## Core Concept
"Break the Pattern" — Position the brand as the disruptor that challenges industry conventions with bold, unexpected creative.

## Visual Approach
- Lead with dramatic negative space — let the message breathe
- Use brand primary as a weapon: bold color blocks that demand attention
- Asymmetric layouts that create visual tension and forward momentum
- Photography/imagery: high contrast, candid over posed, movement over stillness

## Messaging Hierarchy
1. Hook/Headline — provocative, challenges assumptions
2. Value proposition — one sentence, crystal clear
3. Proof point — specific, measurable, believable
4. CTA — action-oriented, urgent but not desperate

## Tone & Feel
Confident without arrogance. Sharp without being cold. Like a mentor who tells you what you need to hear, not what you want to hear.

## Key Elements
- Bold typographic headline as the hero element
- Single supporting visual (not a collage)
- Clean data visualization if stats are involved
- Signature brand color accent as a recurring motif

## Inspiration Notes
- Apple's "Think Different" simplicity
- Nike's emotional storytelling with minimal copy
- Stripe's precision in technical communication
- The Economist's wit in headline writing`,

    content_writer: `# Copy: ${title}

## Headlines (3 Variants)
1. **"Stop Settling for Almost."** — Confrontational, creates tension
2. **"Built Different. Not Just Better."** — Confident positioning
3. **"The Gap Between Good and Great Is Smaller Than You Think."** — Aspirational hook

## Subheadline
What if the thing standing between you and extraordinary results was just one decision?

## Body Copy
Great work doesn't come from great tools alone. It comes from the refusal to accept "good enough."

Every detail matters. Every pixel has purpose. Every word earns its place. That's not perfectionism — it's professionalism.

We built this for teams who are tired of compromising between speed and quality. Because you shouldn't have to choose.

## CTA Options
1. **"Start Creating"** — Direct, active
2. **"See What's Possible"** — Curiosity-driven
3. **"Join the 2,400+ teams who stopped settling"** — Social proof

## Supporting Copy
- Caption: "Quality at the speed of now."
- Alt text: "[Brand] platform dashboard showing real-time creative collaboration"
- Hashtags: #NoCompromise #CreativeExcellence #BuiltDifferent`,

    designer: `# Design Specification: ${title}

## Layout
- Grid: 12-column, 8px base unit
- Aspect Ratio: 1080x1080 (social) / 1920x1080 (presentation)
- Safe Area: 48px padding all sides

## Sections
\`\`\`json
{
  "sections": [
    {
      "type": "hero",
      "position": {"x": 0, "y": 0, "width": 1080, "height": 600},
      "background": "primary_color at 8% opacity",
      "content": "headline + subhead",
      "style": {"textAlign": "left", "padding": "64px"}
    },
    {
      "type": "body",
      "position": {"x": 0, "y": 600, "width": 1080, "height": 320},
      "background": "background_color",
      "content": "body copy + proof points",
      "style": {"textAlign": "left", "padding": "48px 64px"}
    },
    {
      "type": "cta",
      "position": {"x": 0, "y": 920, "width": 1080, "height": 160},
      "background": "accent_color",
      "content": "CTA button + supporting text",
      "style": {"textAlign": "center", "padding": "40px"}
    }
  ]
}
\`\`\`

## Typography
- Headline: heading_font, 48px, bold, -1% letter-spacing
- Subhead: body_font, 20px, regular, line-height 1.5
- Body: body_font, 16px, regular, line-height 1.6
- CTA: heading_font, 18px, semibold, uppercase, 2% letter-spacing

## Color Application
- 60% background_color (white space)
- 30% primary_color (accents, backgrounds)
- 10% accent_color (CTAs, highlights)

## Visual Elements
- Accent bar: 4px wide, accent_color, left edge of hero
- Subtle grid pattern: primary_color at 3% opacity
- CTA button: accent_color, 12px border-radius, 16px 32px padding`,

    deck_architect: `# Deck: ${title}

## Slide Structure (10 Slides)

### Slide 1 — Title
**Layout:** title
**Title:** ${title}
**Subtitle:** [Tagline or one-line value prop]
**Visual:** Full-bleed brand color background, centered white text, logo bottom-right
**Transition:** Fade in (0.5s)

### Slide 2 — The Problem
**Layout:** content
**Title:** "The Status Quo Is Broken"
**Bullets:**
- Pain point 1 with specific data
- Pain point 2 that audience feels personally
- Pain point 3 that quantifies the cost
**Visual:** Dark background, red accent on key stats
**Transition:** Slide left

### Slide 3 — The Insight
**Layout:** quote
**Quote:** "The best time to change was yesterday. The second best time is now."
**Visual:** Minimalist, large typography, lots of breathing room
**Transition:** Fade

### Slide 4 — The Solution
**Layout:** image_right
**Title:** "Introducing [Brand]"
**Body:** Clear, concise value prop in 2-3 sentences
**Visual:** Product screenshot or hero image
**Transition:** Slide up

### Slide 5 — How It Works
**Layout:** two_column
**Title:** "Simple by Design"
**Left:** Step 1, 2, 3 with icons
**Right:** Supporting visual
**Transition:** Slide left

### Slide 6 — Key Features
**Layout:** content
**Title:** "Built for Teams Who Ship"
**Bullets:** 4 key features with one-line descriptions
**Animation (L3):** Staggered reveal, 0.3s delay between items

### Slide 7 — Social Proof
**Layout:** stats
**Stats:** [{"label": "Active Teams", "value": "2,400+"}, {"label": "Faster Delivery", "value": "47%"}, {"label": "Satisfaction", "value": "98%"}]
**Animation (L3):** Counter animation from 0 to final number

### Slide 8 — Testimonial
**Layout:** quote
**Quote:** {"text": "This changed how our entire team works.", "author": "Head of Design, Company X"}
**Visual:** Subtle brand pattern background

### Slide 9 — Pricing / Plans
**Layout:** two_column
**Title:** "Choose Your Path"
**Visual:** Two clean pricing cards

### Slide 10 — CTA / Close
**Layout:** closing
**Title:** "Ready to Start?"
**Body:** CTA + contact info
**Visual:** Bold brand color, large CTA button
**Transition:** Fade`,

    motion_designer: `# Motion Spec: ${title}

## Format
- Output: GIF / MP4
- Dimensions: 1080x1080 (social square)
- Duration: 4 seconds
- FPS: 24
- Loop: Seamless

## Storyboard

### Frame 1 (0s - 0.5s): Entrance
- Background fades in from black to brand primary_color
- Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94) — ease-out-quad

### Frame 2 (0.5s - 1.5s): Headline Reveal
- Text animates in from bottom, 24px travel distance
- Letter-by-letter reveal, 0.02s per character
- Easing: cubic-bezier(0.68, -0.55, 0.265, 1.55) — ease-in-out-back

### Frame 3 (1.5s - 2.5s): Supporting Element
- Accent line draws from left to right (accent_color)
- Subhead fades in at 60% opacity
- Duration: 0.8s
- Easing: linear for line, ease-out for text

### Frame 4 (2.5s - 3.5s): CTA Pulse
- CTA element scales from 0.95 to 1.0 with subtle pulse
- Background shifts to 5% darker shade
- Easing: ease-in-out

### Frame 5 (3.5s - 4.0s): Logo Resolve
- Brand logo fades in center-bottom
- All elements hold for 0.3s before loop point
- Easing: ease-out

## Color Transitions
- Background: primary_color → primary_color (darken 5%) → primary_color
- Text: white throughout
- Accents: accent_color with 0.2s color pulse at 2.5s

## Export Notes
- GIF: Max 256 colors, dithered, optimize for <3MB
- MP4: H.264, CRF 23, for higher quality social uploads`,

    brand_guardian: `# Brand Alignment Review: ${title}

## Overall Score: 85/100

### Breakdown:
- **Color Usage: 18/20** — Primary and accent colors used correctly. The 60/30/10 ratio is well-maintained. Minor note: ensure the accent color (#accent) is reserved for CTAs only.
- **Typography: 17/20** — Correct font pairing. Heading sizes create clear hierarchy. Consider bumping body text to 17px for better mobile readability.
- **Voice & Tone: 16/20** — Copy is sharp and confident, aligning well with the brand voice. The headline "Stop Settling" is strong. One concern: "Built Different" may feel too casual for B2B contexts.
- **Visual Style: 17/20** — Clean, modern, with good use of negative space. The asymmetric layout adds visual interest. The accent bar is a nice brand motif.
- **Overall Quality: 17/20** — This is polished, professional work. It would stand out in a social feed. The creative concept is cohesive across all elements.

### Violations:
- None critical. All brand guidelines are respected.

### Strengths:
- Strong creative concept that threads through all elements
- Excellent typographic hierarchy
- Copy is punchy without being gimmicky
- Design spec is production-ready

### Suggested Improvements:
1. Add a secondary headline option that's more formal for B2B contexts
2. Consider adding a subtle texture/grain to the background for more depth
3. The GIF loop point could be smoother — add 0.2s fade buffer
4. Deck slide 6 has 4 bullets — good, but add icons to make it more scannable`,
  };

  return responses[agent] || `Agent "${agent}" processed the request successfully.`;
}
