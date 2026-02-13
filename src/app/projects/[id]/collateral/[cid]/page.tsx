"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Copy,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Collateral {
  id: string;
  project_id: string;
  type: string;
  title: string;
  brief: string;
  status: string;
  creative_direction: string;
  content: string;
  design_spec: string;
  deck_data: string;
  motion_spec: string;
  brand_score: number;
  review_notes: string;
  revision_count: number;
  created_at: string;
  agent_logs: { agent_name: string; action: string; output: string; duration_ms: number; created_at: string }[];
}

const AGENT_COLORS: Record<string, string> = {
  creative_director: "#6366f1",
  content_writer: "#8b5cf6",
  designer: "#ec4899",
  deck_architect: "#f59e0b",
  motion_designer: "#10b981",
  brand_guardian: "#06b6d4",
};

const AGENT_LABELS: Record<string, string> = {
  creative_director: "Creative Director",
  content_writer: "Content Writer",
  designer: "Designer",
  deck_architect: "Deck Architect",
  motion_designer: "Motion Designer",
  brand_guardian: "Brand Guardian",
};

const TYPE_LABELS: Record<string, string> = {
  social_post: "Social Post",
  video_script: "Video Script",
  one_pager: "One Pager",
  deck_l1: "Deck (L1)",
  deck_l2: "Deck (L2)",
  deck_l3: "Deck (L3)",
  gif: "GIF",
  figma_spec: "Figma Spec",
  blog_post: "Blog Post",
  email: "Email",
  ad_copy: "Ad Copy",
  landing_page: "Landing Page",
  custom: "Custom",
};

export default function CollateralDetailPage({
  params,
}: {
  params: Promise<{ id: string; cid: string }>;
}) {
  const { id, cid } = use(params);
  const [collateral, setCollateral] = useState<Collateral | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    creative_direction: true,
    content: true,
    design_spec: false,
    deck_data: false,
    motion_spec: false,
    review_notes: true,
  });

  useEffect(() => {
    fetch(`/api/collaterals/${cid}`)
      .then((r) => r.json())
      .then(setCollateral)
      .catch(() => {});
  }, [cid]);

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/collaterals/${cid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCollateral((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  }

  if (!collateral) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const sections = [
    { key: "creative_direction", label: "Creative Direction", agent: "creative_director", content: collateral.creative_direction },
    { key: "content", label: "Content / Copy", agent: "content_writer", content: collateral.content },
    { key: "design_spec", label: "Design Specification", agent: "designer", content: collateral.design_spec },
    { key: "deck_data", label: "Deck Structure", agent: "deck_architect", content: collateral.deck_data },
    { key: "motion_spec", label: "Motion Specification", agent: "motion_designer", content: collateral.motion_spec },
    { key: "review_notes", label: "Brand Guardian Review", agent: "brand_guardian", content: collateral.review_notes },
  ].filter((s) => s.content);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{collateral.title}</h1>
          <p className="text-sm text-[var(--muted)]">{TYPE_LABELS[collateral.type] || collateral.type}</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-sm font-medium">Status:</span>
          <select
            value={collateral.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
            <option value="revision">Needs Revision</option>
          </select>
        </div>

        {/* Brand Score */}
        {collateral.brand_score > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Brand Score:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${collateral.brand_score}%`,
                    background:
                      collateral.brand_score >= 80 ? "var(--success)" : collateral.brand_score >= 60 ? "var(--warning)" : "var(--destructive)",
                  }}
                />
              </div>
              <span className={`text-sm font-bold ${
                collateral.brand_score >= 80 ? "text-[var(--success)]" : collateral.brand_score >= 60 ? "text-[var(--warning)]" : "text-[var(--destructive)]"
              }`}>
                {collateral.brand_score}/100
              </span>
              {collateral.brand_score >= 80 ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors" title="Preview">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors" title="Export">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors" title="Regenerate">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Brief */}
      {collateral.brief && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-4">
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-2">Brief</h3>
          <p className="text-sm text-[var(--foreground)]">{collateral.brief}</p>
        </div>
      )}

      {/* Agent output sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.key} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--card-hover)] transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: AGENT_COLORS[section.agent] }}
              />
              <span className="text-sm font-medium flex-1 text-left">{section.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full text-[var(--muted)] bg-[var(--background)]">
                {AGENT_LABELS[section.agent]}
              </span>
              {expandedSections[section.key] ? (
                <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
              )}
            </button>
            {expandedSections[section.key] && (
              <div className="px-5 pb-5 border-t border-[var(--border)]">
                <div className="flex justify-end mt-3 mb-2">
                  <button
                    onClick={() => copyToClipboard(section.content)}
                    className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)] bg-[var(--background)] rounded-lg p-4 overflow-auto">
                    {section.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Agent Activity Log */}
      {collateral.agent_logs && collateral.agent_logs.length > 0 && (
        <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3">
            Agent Activity Log
          </h3>
          <div className="space-y-2">
            {collateral.agent_logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: AGENT_COLORS[log.agent_name] }}
                />
                <span className="font-medium w-32 shrink-0">
                  {AGENT_LABELS[log.agent_name] || log.agent_name}
                </span>
                <span className="text-[var(--muted)]">{log.action}</span>
                <span className="text-[var(--muted)] ml-auto">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
