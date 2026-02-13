"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
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

const COLLATERAL_TYPES = [
  { id: "social_post", label: "Social Post", desc: "Instagram, LinkedIn, Twitter", icon: Image },
  { id: "video_script", label: "Video Script", desc: "Short-form or long-form video", icon: Video },
  { id: "one_pager", label: "One Pager", desc: "Single-page sales collateral", icon: FileText },
  { id: "deck_l1", label: "Deck (L1)", desc: "Brand-aligned slides, clean layout", icon: Presentation },
  { id: "deck_l2", label: "Deck (L2)", desc: "Slides with transitions", icon: Presentation },
  { id: "deck_l3", label: "Deck (L3)", desc: "Slides with beautiful animations", icon: Presentation },
  { id: "gif", label: "GIF", desc: "Animated social graphics", icon: Film },
  { id: "figma_spec", label: "Figma Spec", desc: "Design specification for Figma", icon: Layout },
  { id: "blog_post", label: "Blog Post", desc: "Long-form article", icon: FileText },
  { id: "email", label: "Email", desc: "Marketing or sales email", icon: Mail },
  { id: "ad_copy", label: "Ad Copy", desc: "Paid ads — Google, Meta, LinkedIn", icon: Megaphone },
  { id: "landing_page", label: "Landing Page", desc: "Full landing page design + copy", icon: Globe },
  { id: "custom", label: "Custom", desc: "Describe what you need", icon: Wand2 },
];

export default function NewCollateralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  async function handleGenerate() {
    if (!selectedType || !title) return;
    setGenerating(true);
    setProgress(["Starting pipeline..."]);

    // Simulate progress updates
    const agents = [
      "Creative Director analyzing brief...",
      "Content Writer crafting copy...",
      "Specialist agents working in parallel...",
      "Brand Guardian reviewing alignment...",
      "Finalizing deliverable...",
    ];

    let idx = 0;
    const progressInterval = setInterval(() => {
      if (idx < agents.length) {
        setProgress((prev) => [...prev, agents[idx]]);
        idx++;
      }
    }, 2000);

    try {
      const res = await fetch("/api/collaterals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: id,
          type: selectedType,
          title,
          brief,
          additional_context: additionalContext,
        }),
      });

      clearInterval(progressInterval);

      if (res.ok) {
        const collateral = await res.json();
        router.push(`/projects/${id}/collateral/${collateral.id}`);
      } else {
        const err = await res.json();
        setProgress((prev) => [...prev, `Error: ${err.error || "Generation failed"}`]);
        setGenerating(false);
      }
    } catch {
      clearInterval(progressInterval);
      setProgress((prev) => [...prev, "Error: Network error"]);
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate Collateral</h1>
          <p className="text-sm text-[var(--muted)]">
            AI agents will create brand-aligned content based on your brief.
          </p>
        </div>
      </div>

      {!generating ? (
        <div className="space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium mb-3">What do you need?</label>
            <div className="grid grid-cols-4 gap-2">
              {COLLATERAL_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedType === type.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <type.icon
                    className={`w-4 h-4 mb-1.5 ${
                      selectedType === type.id ? "text-[var(--accent)]" : "text-[var(--muted)]"
                    }`}
                  />
                  <p className="text-xs font-medium">{type.label}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Brief */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                placeholder='e.g., "Q1 Product Launch Social Campaign"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brief</label>
              <textarea
                placeholder="Describe what you need. The more detail, the better the output. Include: key message, audience, objective, any specific requirements..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Additional Context <span className="text-[var(--muted)] font-normal">(optional)</span></label>
              <textarea
                placeholder="Any reference links, competitor examples, specific tone requests, data points to include..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedType || !title}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-opacity animate-pulse-glow"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI Agents
          </button>

          {/* Pipeline preview */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium mb-3">
              Pipeline Preview
            </p>
            <div className="flex items-center gap-1.5 text-[10px]">
              {["Creative Director", "Content Writer", selectedType?.includes("deck") ? "Deck Architect" : "Designer", "Brand Guardian"]
                .filter(Boolean)
                .map((agent, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-md font-medium">
                      {agent}
                    </span>
                    {i < arr.length - 1 && <span className="text-[var(--muted)]">→</span>}
                  </span>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Generation progress */
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-from)]/20 to-[var(--gradient-to)]/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold">Agents at work</h3>
          <p className="text-sm text-[var(--muted)] mt-1 mb-6">
            Your creative team is generating brand-aligned content...
          </p>
          <div className="max-w-sm mx-auto space-y-2 text-left">
            {progress.map((msg, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm animate-slide-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {i === progress.length - 1 ? (
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0">
                    <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <span className={i === progress.length - 1 ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
