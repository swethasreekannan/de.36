"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FolderKanban,
  Loader2,
  Image,
  Video,
  FileText,
  Presentation,
  Film,
  Layout,
  Mail,
  Megaphone,
  Globe,
  Wand2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string;
}

const COLLATERAL_TYPES = [
  { id: "social_post", label: "Social Post", icon: Image },
  { id: "video_script", label: "Video Script", icon: Video },
  { id: "one_pager", label: "One Pager", icon: FileText },
  { id: "deck_l1", label: "Deck (L1)", icon: Presentation },
  { id: "deck_l2", label: "Deck (L2)", icon: Presentation },
  { id: "deck_l3", label: "Deck (L3)", icon: Presentation },
  { id: "gif", label: "GIF", icon: Film },
  { id: "figma_spec", label: "Figma Spec", icon: Layout },
  { id: "blog_post", label: "Blog Post", icon: FileText },
  { id: "email", label: "Email", icon: Mail },
  { id: "ad_copy", label: "Ad Copy", icon: Megaphone },
  { id: "landing_page", label: "Landing Page", icon: Globe },
  { id: "custom", label: "Custom", icon: Wand2 },
];

export default function GeneratePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!selectedProject || !selectedType || !title) return;
    setGenerating(true);
    setProgress(["Starting agent pipeline..."]);

    const agents = [
      "Creative Director setting the vision...",
      "Content Writer crafting copy...",
      "Specialist agents executing...",
      "Brand Guardian reviewing...",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < agents.length) {
        setProgress((prev) => [...prev, agents[idx]]);
        idx++;
      }
    }, 2500);

    try {
      const res = await fetch("/api/collaterals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: selectedProject, type: selectedType, title, brief }),
      });
      clearInterval(interval);
      if (res.ok) {
        const collateral = await res.json();
        router.push(`/projects/${selectedProject}/collateral/${collateral.id}`);
      } else {
        setProgress((prev) => [...prev, "Error: Generation failed"]);
        setGenerating(false);
      }
    } catch {
      clearInterval(interval);
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="max-w-lg mx-auto mt-20 animate-fade-in">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-from)]/20 to-[var(--gradient-to)]/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold">Generating...</h3>
          <div className="max-w-sm mx-auto mt-4 space-y-2 text-left">
            {progress.map((msg, i) => (
              <div key={i} className="flex items-center gap-2 text-sm animate-slide-in">
                {i === progress.length - 1 ? (
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--success)] shrink-0" />
                )}
                <span className={i === progress.length - 1 ? "" : "text-[var(--muted)]"}>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[var(--accent)]" />
          Quick Generate
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Pick a project, choose a format, write a brief — AI agents handle the rest.
        </p>
      </div>

      <div className="space-y-6">
        {/* Project selector */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <label className="block text-sm font-medium mb-3">
            <FolderKanban className="w-4 h-4 inline mr-1.5" />
            Select Project
          </label>
          {projects.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No projects yet. <a href="/projects/new" className="text-[var(--accent)]">Create one first.</a>
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedProject === p.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-[10px] text-[var(--muted)]">{p.client_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Collateral Type</label>
          <div className="grid grid-cols-5 gap-2">
            {COLLATERAL_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedType === type.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]"
                }`}
              >
                <type.icon className={`w-4 h-4 mx-auto mb-1 ${selectedType === type.id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} />
                <p className="text-[10px] font-medium">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Brief */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              placeholder="Give it a name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Brief</label>
            <textarea
              placeholder="Describe what you need..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selectedProject || !selectedType || !title}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Generate
        </button>
      </div>
    </div>
  );
}
