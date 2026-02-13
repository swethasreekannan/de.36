# Delivery Engine

AI-powered marketing collateral platform for agencies. Manage client projects, store brand kits, and generate brand-aligned content at scale using a 6-agent AI pipeline.

## Quick Setup (5 minutes)

### Prerequisites

- **Node.js** — Download from https://nodejs.org (click the "LTS" button)
- **Git** — Download from https://git-scm.com

### Step-by-step

Open **Terminal** (Mac) or **Command Prompt** (Windows) and run:

```bash
# 1. Download the project
git clone https://github.com/swethasreekannan/de.36.git

# 2. Go into the folder
cd de.36

# 3. Install dependencies
npm install

# 4. Create your environment file
cp .env.local.example .env.local

# 5. Run the app
npm run dev
```

Open http://localhost:3000 in your browser. Done!

### Adding your AI API key (optional)

The app works in **demo mode** without any API key — you'll see sample outputs from all agents.

To enable live AI generation:

1. Get an API key from https://console.anthropic.com (sign up, go to API Keys, create one)
2. Open the `.env.local` file in any text editor
3. Paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
4. Save and restart the app (`Ctrl+C` then `npm run dev`)

## What's Inside

### Pages

| Page | What it does |
|------|-------------|
| `/` | Dashboard — project overview, stats, agent pipeline |
| `/projects` | All client projects with search and filter |
| `/projects/new` | Create a project (URL scrape, PDF upload, or manual brand entry) |
| `/projects/[id]` | Project detail — Brand Kit, Team, Collateral tabs |
| `/projects/[id]/collateral/new` | Generate collateral with AI agents |
| `/generate` | Quick Generate — pick project + type and go |
| `/settings` | API key config and agent status |

### AI Agent Pipeline

Every piece of collateral runs through this pipeline:

1. **Creative Director** — Sets the creative vision (not generic — specific, inspired direction)
2. **Content Writer** — Writes headlines, body copy, CTAs (sharp, on-brand, no corporate speak)
3. **Designer** — Creates detailed design specs (grid, colors, typography, layout)
4. **Deck Architect** — Structures slide decks (L1: clean, L2: transitions, L3: animations)
5. **Motion Designer** — Defines GIF/video specs (storyboards, timing, easing curves)
6. **Brand Guardian** — Reviews everything, scores 0-100 for brand alignment

### Collateral Types

Social posts, video scripts, one-pagers, decks (L1/L2/L3), GIFs, Figma specs, blog posts, emails, ad copy, landing pages, and custom.

### Team Collaboration

- Invite teammates by email
- Roles: Owner, Admin, Member, Viewer
- Everyone shares the brand kit and can create collateral

### Brand Intake

Three ways to set up a client's brand:

- **Website URL** — AI scrapes the site and extracts colors, fonts, voice, style
- **PDF Upload** — Upload brand guidelines, AI reads and extracts elements
- **Manual** — Fill in the brand kit fields yourself

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- SQLite via better-sqlite3
- Tailwind CSS
- Anthropic Claude / OpenAI GPT-4o (configurable)
