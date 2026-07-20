"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tickets", label: "Tickets & Entry" },
  { href: "/merch", label: "Official Merch" },
  { href: "/#enquiries", label: "Enquiries" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NavDrawer({ open, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-surface border-l border-neon-purple/30 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <span className="font-glitch text-xs tracking-widest text-neon-purple-bright">
            MAINFRAME
          </span>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1 text-electric-white active:scale-95 transition-transform"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-col px-5 py-6 gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="font-display font-700 text-xl py-3 text-foreground hover:text-neon-purple-bright transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
