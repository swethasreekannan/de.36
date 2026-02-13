import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "delivery-engine.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'paused')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brand_kits (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      -- Visual Identity
      primary_color TEXT DEFAULT '#000000',
      secondary_color TEXT DEFAULT '#666666',
      accent_color TEXT DEFAULT '#0066FF',
      background_color TEXT DEFAULT '#FFFFFF',
      colors_extended TEXT DEFAULT '[]', -- JSON array of additional colors

      -- Typography
      heading_font TEXT DEFAULT 'Inter',
      body_font TEXT DEFAULT 'Inter',
      font_sizes TEXT DEFAULT '{"h1":48,"h2":36,"h3":28,"body":16,"caption":12}',

      -- Voice & Tone
      brand_voice TEXT DEFAULT '',  -- e.g., "Bold, confident, approachable"
      tone_keywords TEXT DEFAULT '[]', -- JSON array
      writing_style TEXT DEFAULT '', -- guidelines for copy

      -- Logos & Assets
      logo_url TEXT DEFAULT '',
      logo_dark_url TEXT DEFAULT '',
      icon_url TEXT DEFAULT '',

      -- Brand Guidelines
      dos TEXT DEFAULT '[]',   -- JSON array of brand dos
      donts TEXT DEFAULT '[]', -- JSON array of brand donts
      tagline TEXT DEFAULT '',
      mission TEXT DEFAULT '',
      target_audience TEXT DEFAULT '',

      -- Templates & Patterns
      visual_style TEXT DEFAULT '', -- e.g., "minimalist", "bold graphic", "editorial"
      mood_keywords TEXT DEFAULT '[]', -- JSON array
      reference_urls TEXT DEFAULT '[]', -- JSON array of inspiration links

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaterals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'social_post', 'video_script', 'one_pager',
        'deck_l1', 'deck_l2', 'deck_l3',
        'gif', 'figma_spec', 'blog_post',
        'email', 'ad_copy', 'landing_page', 'custom'
      )),
      title TEXT NOT NULL,
      brief TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'in_review', 'approved', 'delivered', 'revision')),

      -- Agent outputs
      creative_direction TEXT DEFAULT '',  -- Creative Director's vision
      content TEXT DEFAULT '',             -- Written content/copy
      design_spec TEXT DEFAULT '',         -- Design specifications (JSON)
      deck_data TEXT DEFAULT '',           -- Slide data for decks (JSON)
      motion_spec TEXT DEFAULT '',         -- Animation/motion specs

      -- Review
      brand_score INTEGER DEFAULT 0,      -- 0-100 brand alignment score
      review_notes TEXT DEFAULT '',
      revision_count INTEGER DEFAULT 0,

      -- Final output
      output_url TEXT DEFAULT '',
      output_format TEXT DEFAULT '',

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_logs (
      id TEXT PRIMARY KEY,
      collateral_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      input TEXT DEFAULT '',
      output TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (collateral_id) REFERENCES collaterals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('image', 'video', 'font', 'logo', 'icon', 'template', 'document', 'other')),
      url TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'member', 'viewer')),
      invited_by TEXT DEFAULT '',
      joined_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    );
  `);
}
