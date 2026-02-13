"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Upload, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "brand">("info");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Step 1: Project info
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Brand extraction
  const [brandMethod, setBrandMethod] = useState<"url" | "pdf" | "manual">("url");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extractedBrand, setExtractedBrand] = useState<Record<string, unknown> | null>(null);

  async function handleExtractFromUrl() {
    if (!websiteUrl) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/brand/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      setExtractedBrand(data);
    } catch {
      alert("Failed to extract brand from URL");
    }
    setExtracting(false);
  }

  async function handleExtractFromPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/brand/extract-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Brand extraction failed: ${data.error || "Unknown error"}. Check your ANTHROPIC_API_KEY in .env.local and ensure you have API credits.`);
        setExtractedBrand(null);
      } else if (data._needs_key) {
        setExtractedBrand(data);
      } else if (data.error || data._note?.includes("could not be parsed")) {
        alert(`Brand extraction returned unexpected data: ${data._note || data.error}`);
        setExtractedBrand(null);
      } else {
        setExtractedBrand(data);
      }
    } catch {
      alert("Failed to extract brand from PDF. Check the browser console for details.");
    }
    setExtracting(false);
  }

  async function handleCreate() {
    if (!name || !clientName) return;
    setLoading(true);
    try {
      // Create project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, client_name: clientName, description }),
      });
      const project = await res.json();

      // If we have extracted brand data, update the brand kit
      if (extractedBrand) {
        await fetch(`/api/projects/${project.id}/brand`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractedBrand),
        });
      }

      router.push(`/projects/${project.id}`);
    } catch {
      alert("Failed to create project");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
      <p className="text-sm text-[var(--muted)] mt-1">
        One project per client. Add brand guidelines to power AI-generated collateral.
      </p>

      {step === "info" && (
        <div className="mt-8 space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                placeholder='e.g., "Toss the Coin — Q1 Campaign"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input
                type="text"
                placeholder='e.g., "Toss the Coin"'
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Brief description of the project scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep("brand")}
            disabled={!name || !clientName}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Next: Brand Guidelines <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === "brand" && (
        <div className="mt-8 space-y-6">
          {/* Method selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "url" as const, label: "Website URL", desc: "Auto-extract from site", icon: Globe },
              { id: "pdf" as const, label: "Upload PDF", desc: "Brand guidelines doc", icon: Upload },
              { id: "manual" as const, label: "Manual Entry", desc: "Fill in brand details", icon: Sparkles },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setBrandMethod(method.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  brandMethod === method.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]"
                }`}
              >
                <method.icon className={`w-5 h-5 mb-2 ${brandMethod === method.id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} />
                <p className="text-sm font-medium">{method.label}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{method.desc}</p>
              </button>
            ))}
          </div>

          {/* URL extraction */}
          {brandMethod === "url" && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://tossthe.coin"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  onClick={handleExtractFromUrl}
                  disabled={!websiteUrl || extracting}
                  className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Extract
                </button>
              </div>
              <p className="text-[10px] text-[var(--muted)] mt-2">
                We&apos;ll scan the website and extract colors, fonts, voice, and visual style using AI.
              </p>
            </div>
          )}

          {/* PDF upload */}
          {brandMethod === "pdf" && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">Upload Brand Guidelines</label>
              <label className="relative block border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center hover:border-[var(--accent)]/30 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--muted)]">Drop your PDF here or click to browse</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleExtractFromPdf}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              {extracting && (
                <div className="flex items-center gap-2 mt-3 text-sm text-[var(--accent)]">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing brand guidelines...
                </div>
              )}
            </div>
          )}

          {/* Manual — just skip to project, they'll fill it in later */}
          {brandMethod === "manual" && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
              <p className="text-sm text-[var(--muted)]">
                You can fill in brand details after creating the project. Click &quot;Create Project&quot; below to continue.
              </p>
            </div>
          )}

          {/* Extracted brand preview */}
          {extractedBrand && (
            <div className={`bg-[var(--card)] border rounded-xl p-6 animate-fade-in ${
              extractedBrand._needs_key ? "border-[var(--warning,orange)]/30" : "border-[var(--success)]/30"
            }`}>
              {extractedBrand._needs_key ? (
                <div>
                  <p className="text-sm font-medium text-[orange] mb-2">API key required</p>
                  <p className="text-xs text-[var(--muted)]">
                    {String(extractedBrand._note || "Add ANTHROPIC_API_KEY to .env.local to enable AI-powered brand extraction.")}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--success)] mb-3">Brand elements extracted</p>

                  {/* Colors row */}
                  <div className="flex items-center gap-3 mb-4">
                    {[
                      { label: "Primary", value: extractedBrand.primary_color },
                      { label: "Secondary", value: extractedBrand.secondary_color },
                      { label: "Accent", value: extractedBrand.accent_color },
                      { label: "Background", value: extractedBrand.background_color },
                    ]
                      .filter((c) => typeof c.value === "string" && c.value)
                      .map((c) => (
                        <div key={c.label} className="flex items-center gap-1.5">
                          <div
                            className="w-6 h-6 rounded-md border border-[var(--border)] shadow-sm"
                            style={{ background: String(c.value) }}
                          />
                          <div className="text-[10px]">
                            <span className="text-[var(--muted)] block">{c.label}</span>
                            <span className="text-[var(--foreground)] font-mono">{String(c.value)}</span>
                          </div>
                        </div>
                      ))}
                    {/* Extended colors */}
                    {Array.isArray(extractedBrand.colors_extended) &&
                      (extractedBrand.colors_extended as string[])
                        .filter((c) => typeof c === "string" && c)
                        .map((color, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-md border border-[var(--border)] shadow-sm"
                              style={{ background: color }}
                            />
                            <span className="text-[10px] text-[var(--foreground)] font-mono">{color}</span>
                          </div>
                        ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {typeof extractedBrand.heading_font === "string" && extractedBrand.heading_font ? (
                      <div><span className="text-[var(--muted)]">Heading Font:</span> <span className="font-medium">{extractedBrand.heading_font}</span></div>
                    ) : null}
                    {typeof extractedBrand.body_font === "string" && extractedBrand.body_font ? (
                      <div><span className="text-[var(--muted)]">Body Font:</span> <span className="font-medium">{extractedBrand.body_font}</span></div>
                    ) : null}
                    {typeof extractedBrand.tagline === "string" && extractedBrand.tagline ? (
                      <div className="col-span-2"><span className="text-[var(--muted)]">Tagline:</span> <span className="italic">&ldquo;{extractedBrand.tagline}&rdquo;</span></div>
                    ) : null}
                    {typeof extractedBrand.brand_voice === "string" && extractedBrand.brand_voice ? (
                      <div className="col-span-2"><span className="text-[var(--muted)]">Voice:</span> {extractedBrand.brand_voice}</div>
                    ) : null}
                    {typeof extractedBrand.visual_style === "string" && extractedBrand.visual_style ? (
                      <div className="col-span-2"><span className="text-[var(--muted)]">Visual Style:</span> {extractedBrand.visual_style}</div>
                    ) : null}
                    {Array.isArray(extractedBrand.tone_keywords) && (extractedBrand.tone_keywords as string[]).length > 0 ? (
                      <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[var(--muted)]">Tone:</span>
                        {(extractedBrand.tone_keywords as string[]).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px]">{kw}</span>
                        ))}
                      </div>
                    ) : null}
                    {Array.isArray(extractedBrand.dos) && (extractedBrand.dos as string[]).length > 0 ? (
                      <div>
                        <span className="text-[var(--success)] font-medium block mb-1">Do&apos;s</span>
                        <ul className="text-[var(--muted)] space-y-0.5">
                          {(extractedBrand.dos as string[]).slice(0, 3).map((d, i) => <li key={i}>+ {d}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    {Array.isArray(extractedBrand.donts) && (extractedBrand.donts as string[]).length > 0 ? (
                      <div>
                        <span className="text-[red]/70 font-medium block mb-1">Don&apos;ts</span>
                        <ul className="text-[var(--muted)] space-y-0.5">
                          {(extractedBrand.donts as string[]).slice(0, 3).map((d, i) => <li key={i}>- {d}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("info")}
              className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
