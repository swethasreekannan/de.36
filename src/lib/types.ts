export interface Project {
  id: string;
  name: string;
  client_name: string;
  description: string;
  status: "active" | "archived" | "paused";
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  project_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  colors_extended: string[];
  heading_font: string;
  body_font: string;
  font_sizes: { h1: number; h2: number; h3: number; body: number; caption: number };
  brand_voice: string;
  tone_keywords: string[];
  writing_style: string;
  logo_url: string;
  logo_dark_url: string;
  icon_url: string;
  dos: string[];
  donts: string[];
  tagline: string;
  mission: string;
  target_audience: string;
  visual_style: string;
  mood_keywords: string[];
  reference_urls: string[];
  created_at: string;
  updated_at: string;
}

export type CollateralType =
  | "social_post"
  | "video_script"
  | "one_pager"
  | "deck_l1"
  | "deck_l2"
  | "deck_l3"
  | "gif"
  | "figma_spec"
  | "blog_post"
  | "email"
  | "ad_copy"
  | "landing_page"
  | "custom";

export type CollateralStatus = "draft" | "in_review" | "approved" | "delivered" | "revision";

export interface Collateral {
  id: string;
  project_id: string;
  type: CollateralType;
  title: string;
  brief: string;
  status: CollateralStatus;
  creative_direction: string;
  content: string;
  design_spec: string;
  deck_data: string;
  motion_spec: string;
  brand_score: number;
  review_notes: string;
  revision_count: number;
  output_url: string;
  output_format: string;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  collateral_id: string;
  agent_name: string;
  action: string;
  input: string;
  output: string;
  duration_ms: number;
  created_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  type: "image" | "video" | "font" | "logo" | "icon" | "template" | "document" | "other";
  url: string;
  thumbnail_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Agent types
export type AgentRole =
  | "creative_director"
  | "content_writer"
  | "designer"
  | "deck_architect"
  | "motion_designer"
  | "brand_guardian";

export interface AgentOutput {
  agent: AgentRole;
  content: string;
  metadata?: Record<string, unknown>;
  duration_ms: number;
}

export interface GenerationRequest {
  project_id: string;
  type: CollateralType;
  title: string;
  brief: string;
  brand_kit: BrandKit;
  additional_context?: string;
}

export interface SlideData {
  slides: Slide[];
  theme: SlideTheme;
}

export interface Slide {
  layout: "title" | "content" | "two_column" | "image_left" | "image_right" | "quote" | "stats" | "closing";
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  image_prompt?: string;
  notes?: string;
  stats?: { label: string; value: string }[];
  quote?: { text: string; author: string };
  transition?: string;
  animation?: string;
}

export interface SlideTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
}

export interface DesignSpec {
  format: string;
  width: number;
  height: number;
  layout: string;
  sections: DesignSection[];
  color_palette: string[];
  typography: Record<string, string>;
}

export interface DesignSection {
  type: "header" | "hero" | "body" | "cta" | "footer" | "stats" | "testimonial" | "features";
  content: string;
  style: Record<string, string>;
  position: { x: number; y: number; width: number; height: number };
}
