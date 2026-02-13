"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  FileText,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--gradient-from)]/20 via-[var(--background)] to-[var(--gradient-to)]/20 border border-[var(--border)] p-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">Delivery Engine</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-xl">
            Your AI-powered creative studio. Generate brand-aligned collateral at scale — social posts, decks, one-pagers, GIFs, landing pages, and more.
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FolderKanban className="w-4 h-4" />
              New Project
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Quick Generate
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--gradient-from)]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: projects.filter((p) => p.status === "active").length, icon: FolderKanban, color: "var(--accent)" },
          { label: "Total Collaterals", value: "—", icon: FileText, color: "var(--success)" },
          { label: "Delivered", value: "—", icon: TrendingUp, color: "var(--gradient-to)" },
          { label: "In Review", value: "—", icon: Users, color: "var(--warning)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-hover)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)] text-sm">{stat.label}</span>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-[var(--muted)] text-sm mt-1 max-w-md mx-auto">
              Create your first client project. Upload brand guidelines or paste a website URL to auto-extract brand elements.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors mt-4"
            >
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)]/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(i * 60) % 360}, 60%, 50%), hsl(${(i * 60 + 30) % 360}, 60%, 40%))`,
                    }}
                  >
                    {project.client_name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                      project.status === "active"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : "bg-[var(--muted)]/10 text-[var(--muted)]"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <h3 className="text-sm font-medium mt-3 group-hover:text-[var(--accent)] transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">{project.client_name}</p>
                <div className="flex items-center gap-3 mt-4 text-[10px] text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[var(--success)]" /> 0 delivered
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--warning)]" /> 0 in progress
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[var(--accent)]" /> 0 in review
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Agent Pipeline */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">AI Agent Pipeline</h2>
        <div className="flex items-center gap-2">
          {[
            { name: "Creative Director", abbr: "CD", desc: "Sets the creative vision" },
            { name: "Content Writer", abbr: "CW", desc: "Writes sharp copy" },
            { name: "Designer", abbr: "DS", desc: "Creates design specs" },
            { name: "Deck Architect", abbr: "DA", desc: "Structures decks" },
            { name: "Motion Designer", abbr: "MD", desc: "Defines animations" },
            { name: "Brand Guardian", abbr: "BG", desc: "Reviews alignment" },
          ].map((agent, i) => (
            <div key={agent.abbr} className="flex items-center gap-2 flex-1">
              <div className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 text-center hover:border-[var(--accent)]/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent)] mx-auto">
                  {agent.abbr}
                </div>
                <p className="text-xs font-medium mt-2">{agent.name}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{agent.desc}</p>
              </div>
              {i < 5 && <ArrowRight className="w-3 h-3 text-[var(--muted)] shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
