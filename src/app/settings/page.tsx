"use client";

import { useState } from "react";
import { Key, Brain, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In production, these would be saved to .env.local or a secure vault
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-sm text-[var(--muted)] mt-1 mb-8">
        Configure your API keys and agent preferences.
      </p>

      {/* API Keys */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="font-semibold">API Keys</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Add your API key to power the AI agents. Without a key, the app runs in demo mode with sample outputs.
          Set these as environment variables in <code className="text-[var(--accent)]">.env.local</code>.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Anthropic API Key</label>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
          <p className="text-[10px] text-[var(--muted)] mt-1">Uses Claude Sonnet 4.5 for all agents</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">OpenAI API Key <span className="text-[var(--muted)] font-normal">(fallback)</span></label>
          <input
            type="password"
            placeholder="sk-..."
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
          <p className="text-[10px] text-[var(--muted)] mt-1">Uses GPT-4o as fallback if Anthropic key is not set</p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Agent Config */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="font-semibold">AI Agents</h2>
        </div>

        <div className="space-y-3">
          {[
            { name: "Creative Director", desc: "Sets creative vision and direction for every piece", status: "active" },
            { name: "Content Writer", desc: "Writes headlines, body copy, CTAs, and all text content", status: "active" },
            { name: "Designer", desc: "Creates detailed design specifications and layouts", status: "active" },
            { name: "Deck Architect", desc: "Structures slide decks with L1/L2/L3 support", status: "active" },
            { name: "Motion Designer", desc: "Defines animations, GIF specs, and motion graphics", status: "active" },
            { name: "Brand Guardian", desc: "Reviews all output for brand alignment (0-100 score)", status: "active" },
          ].map((agent) => (
            <div key={agent.name} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
              <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
              <div className="flex-1">
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{agent.desc}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--success)] font-medium">{agent.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup instructions */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mt-6">
        <h2 className="font-semibold mb-3">Quick Setup</h2>
        <div className="bg-[var(--background)] rounded-lg p-4 font-mono text-xs space-y-1">
          <p className="text-[var(--muted)]"># Create .env.local in the project root:</p>
          <p><span className="text-[var(--accent)]">ANTHROPIC_API_KEY</span>=sk-ant-your-key-here</p>
          <p className="text-[var(--muted)]"># Or use OpenAI as an alternative:</p>
          <p><span className="text-[var(--accent)]">OPENAI_API_KEY</span>=sk-your-key-here</p>
        </div>
      </div>
    </div>
  );
}
