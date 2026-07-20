"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import NavDrawer from "./NavDrawer";

export default function TopAppBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-border-subtle">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display font-800 text-lg tracking-wide text-electric-white"
          >
            NOCTURNE<span className="text-neon-purple text-glow"> RAVE</span>
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-md border border-border-subtle text-electric-white active:scale-95 transition-transform"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
