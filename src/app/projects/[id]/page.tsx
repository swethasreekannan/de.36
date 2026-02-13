"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Palette,
  Users,
  FileText,
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  Eye,
  User,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  client_name: string;
  description: string;
  status: string;
}

interface BrandKit {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  colors_extended: string[];
  heading_font: string;
  body_font: string;
  brand_voice: string;
  tone_keywords: string[];
  writing_style: string;
  tagline: string;
  mission: string;
  target_audience: string;
  visual_style: string;
  mood_keywords: string[];
  dos: string[];
  donts: string[];
  logo_url: string;
  reference_urls: string[];
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

interface Collateral {
  id: string;
  type: string;
  title: string;
  status: string;
  brand_score: number;
  created_at: string;
  created_by: string;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--muted)",
  in_review: "var(--accent)",
  approved: "var(--success)",
  delivered: "var(--gradient-to)",
  revision: "var(--warning)",
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

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<"brand" | "team" | "collateral">("brand");
  const [project, setProject] = useState<Project | null>(null);
  const [brand, setBrand] = useState<BrandKit | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [collaterals, setCollaterals] = useState<Collateral[]>([]);
  const [saving, setSaving] = useState(false);

  // Team invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then(setProject).catch(() => {});
    fetch(`/api/projects/${id}/brand`).then((r) => r.json()).then(setBrand).catch(() => {});
    fetch(`/api/projects/${id}/members`).then((r) => r.json()).then(setMembers).catch(() => {});
    fetch(`/api/projects/${id}/collaterals`).then((r) => r.json()).then(setCollaterals).catch(() => {});
  }, [id]);

  async function saveBrand(updates: Partial<BrandKit>) {
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/brand`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setBrand(data);
    setSaving(false);
  }

  async function inviteMember() {
    if (!inviteEmail) return;
    setInviting(true);
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
    });
    if (res.ok) {
      const member = await res.json();
      setMembers((prev) => [...prev, member]);
      setInviteEmail("");
      setInviteName("");
    }
    setInviting(false);
  }

  async function removeMember(userId: string) {
    await fetch(`/api/projects/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects" className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">{project.client_name}</p>
        </div>
        <span
          className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-full ${
            project.status === "active"
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--muted)]/10 text-[var(--muted)]"
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1 mb-6 w-fit">
        {[
          { id: "brand" as const, label: "Brand Kit", icon: Palette },
          { id: "team" as const, label: "Team", icon: Users, count: members.length },
          { id: "collateral" as const, label: "Collateral", icon: FileText, count: collaterals.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-white/20" : "bg-[var(--border)]"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Brand Kit Tab */}
      {tab === "brand" && brand && (
        <div className="grid grid-cols-2 gap-6 animate-fade-in">
          {/* Colors */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Colors</h3>
            <div className="space-y-3">
              {[
                { label: "Primary", key: "primary_color" as const, value: brand.primary_color },
                { label: "Secondary", key: "secondary_color" as const, value: brand.secondary_color },
                { label: "Accent", key: "accent_color" as const, value: brand.accent_color },
                { label: "Background", key: "background_color" as const, value: brand.background_color },
              ].map((color) => (
                <div key={color.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color.value}
                    onChange={(e) => saveBrand({ [color.key]: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
                  />
                  <div>
                    <p className="text-sm font-medium">{color.label}</p>
                    <p className="text-xs text-[var(--muted)]">{color.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Typography</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Heading Font</label>
                <input
                  type="text"
                  value={brand.heading_font}
                  onChange={(e) => saveBrand({ heading_font: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Body Font</label>
                <input
                  type="text"
                  value={brand.body_font}
                  onChange={(e) => saveBrand({ body_font: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <p className="text-lg font-bold" style={{ fontFamily: brand.heading_font }}>Heading Preview</p>
                <p className="text-sm text-[var(--muted)] mt-1" style={{ fontFamily: brand.body_font }}>
                  Body text preview — the quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </div>

          {/* Voice & Tone */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Voice & Tone</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Brand Voice</label>
                <input
                  type="text"
                  value={brand.brand_voice}
                  onChange={(e) => saveBrand({ brand_voice: e.target.value })}
                  placeholder="Bold, confident, approachable..."
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Writing Style</label>
                <textarea
                  value={brand.writing_style}
                  onChange={(e) => saveBrand({ writing_style: e.target.value })}
                  placeholder="Guidelines for how copy should be written..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Tagline</label>
                <input
                  type="text"
                  value={brand.tagline}
                  onChange={(e) => saveBrand({ tagline: e.target.value })}
                  placeholder="Your brand tagline"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Brand Identity */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Brand Identity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Mission</label>
                <textarea
                  value={brand.mission}
                  onChange={(e) => saveBrand({ mission: e.target.value })}
                  placeholder="What drives this brand..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Target Audience</label>
                <input
                  type="text"
                  value={brand.target_audience}
                  onChange={(e) => saveBrand({ target_audience: e.target.value })}
                  placeholder="Who is this brand for?"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Visual Style</label>
                <input
                  type="text"
                  value={brand.visual_style}
                  onChange={(e) => saveBrand({ visual_style: e.target.value })}
                  placeholder="minimalist, bold graphic, editorial..."
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Brand Rules */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 col-span-2">
            <h3 className="font-semibold mb-4">Brand Rules</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-[var(--success)] font-medium mb-2">DO</label>
                <textarea
                  value={Array.isArray(brand.dos) ? brand.dos.join("\n") : ""}
                  onChange={(e) => saveBrand({ dos: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="One rule per line..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--success)] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--destructive)] font-medium mb-2">DON&apos;T</label>
                <textarea
                  value={Array.isArray(brand.donts) ? brand.donts.join("\n") : ""}
                  onChange={(e) => saveBrand({ donts: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="One rule per line..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--destructive)] resize-none"
                />
              </div>
            </div>
          </div>

          {saving && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-[var(--accent)]">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="space-y-6 animate-fade-in">
          {/* Invite form */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--accent)]" />
              Invite Team Member
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <input
                type="text"
                placeholder="Name (optional)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-40 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-32 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={inviteMember}
                disabled={!inviteEmail || inviting}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Invite
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-2">
              Team members can create collateral, view brand kit, and collaborate on deliverables.
            </p>
          </div>

          {/* Members list */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-6 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--muted)]">
                {members.length} team member{members.length !== 1 ? "s" : ""}
              </h3>
            </div>
            {members.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--muted)]">
                No team members yet. Invite someone above.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role] || User;
                  return (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--accent)]">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-[var(--muted)]">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{member.role}</span>
                      </div>
                      {member.role !== "owner" && (
                        <button
                          onClick={() => removeMember(member.user_id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--destructive)]/10 text-[var(--muted)] hover:text-[var(--destructive)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collateral Tab */}
      {tab === "collateral" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              All collateral generated for this project, powered by your brand kit.
            </p>
            <Link
              href={`/projects/${id}/collateral/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Collateral
            </Link>
          </div>

          {collaterals.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
              <h3 className="text-lg font-medium">No collateral yet</h3>
              <p className="text-sm text-[var(--muted)] mt-1 max-w-md mx-auto">
                Generate your first piece — social post, deck, one-pager, GIF, or anything else.
              </p>
              <Link
                href={`/projects/${id}/collateral/new`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors mt-4"
              >
                Generate First Collateral
              </Link>
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wider">
                    <th className="text-left px-6 py-3 font-medium">Title</th>
                    <th className="text-left px-6 py-3 font-medium">Type</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Brand Score</th>
                    <th className="text-left px-6 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {collaterals.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--card-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/projects/${id}/collateral/${c.id}`}
                          className="text-sm font-medium hover:text-[var(--accent)] transition-colors"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted)]">
                        {TYPE_LABELS[c.type] || c.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
                          style={{
                            color: STATUS_COLORS[c.status],
                            background: `${STATUS_COLORS[c.status]}15`,
                          }}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.brand_score > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${c.brand_score}%`,
                                  background:
                                    c.brand_score >= 80
                                      ? "var(--success)"
                                      : c.brand_score >= 60
                                      ? "var(--warning)"
                                      : "var(--destructive)",
                                }}
                              />
                            </div>
                            <span className="text-xs text-[var(--muted)]">{c.brand_score}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted)]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
