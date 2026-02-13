"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Each project = one client. Brand kit, team, and all collaterals in one place.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1">
          {["all", "active", "paused", "archived"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
          <p className="text-[var(--muted)]">
            {search ? "No projects match your search." : "No projects yet. Create one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--accent)]/30 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${(i * 47 + 200) % 360}, 65%, 50%), hsl(${(i * 47 + 230) % 360}, 65%, 40%))`,
                  }}
                >
                  {project.client_name.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                    project.status === "active"
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : project.status === "paused"
                      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                      : "bg-[var(--muted)]/10 text-[var(--muted)]"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-[var(--muted)] mt-0.5">{project.client_name}</p>
              {project.description && (
                <p className="text-xs text-[var(--muted)] mt-2 line-clamp-2">{project.description}</p>
              )}
              <p className="text-[10px] text-[var(--muted)] mt-4">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
