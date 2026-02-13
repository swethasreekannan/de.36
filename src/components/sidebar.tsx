"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-[var(--border)] flex flex-col bg-[var(--background)]">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Delivery Engine</h1>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">by your agency</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="rounded-lg bg-gradient-to-r from-[var(--gradient-from)]/10 to-[var(--gradient-to)]/10 p-3">
          <p className="text-xs font-medium text-[var(--foreground)]">AI Agents Active</p>
          <p className="text-[10px] text-[var(--muted)] mt-1">
            6 agents ready to generate
          </p>
          <div className="flex gap-1 mt-2">
            {["CD", "CW", "DS", "DA", "MD", "BG"].map((agent) => (
              <div
                key={agent}
                className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[8px] font-bold text-[var(--accent)]"
              >
                {agent}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
