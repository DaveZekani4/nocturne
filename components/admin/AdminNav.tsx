"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/scan", label: "Scan" },
  { href: "/admin/merch", label: "Merch" },
  { href: "/admin/merch-orders", label: "Merch Orders" },
  { href: "/admin/attendees", label: "Attendees" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 overflow-x-auto border-b border-border-subtle bg-surface px-4 py-3">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap px-3 py-2 font-glitch text-[11px] uppercase tracking-wider",
              pathname === link.href
                ? "bg-neon-purple text-background"
                : "text-foreground/60"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        aria-label="Sign out"
        className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 font-glitch text-[11px] uppercase tracking-wider text-foreground/60"
      >
        <LogOut size={13} /> Sign Out
      </button>
    </header>
  );
}
