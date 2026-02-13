// Brand extraction from URLs and PDF uploads
// Scrapes a website or processes a PDF to auto-populate brand kit fields

export interface ExtractedBrand {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  colors_extended?: string[];
  heading_font?: string;
  body_font?: string;
  tagline?: string;
  brand_voice?: string;
  visual_style?: string;
  logo_url?: string;
  mission?: string;
  target_audience?: string;
  tone_keywords?: string[];
  mood_keywords?: string[];
  dos?: string[];
  donts?: string[];
  writing_style?: string;
}

export async function extractBrandFromUrl(url: string): Promise<ExtractedBrand> {
  // Call our API endpoint that scrapes the site and uses AI to extract brand elements
  const response = await fetch("/api/brand/extract-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) throw new Error("Failed to extract brand from URL");
  return response.json();
}

export async function extractBrandFromPdf(file: File): Promise<ExtractedBrand> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/brand/extract-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to extract brand from PDF");
  return response.json();
}
