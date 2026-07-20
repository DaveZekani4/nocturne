"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { TicketTier } from "@/types";

type Props = {
  tier: TicketTier;
};

export default function TierEditorRow({ tier }: Props) {
  const [totalQuantity, setTotalQuantity] = useState(tier.total_quantity);
  const [isActive, setIsActive] = useState(tier.is_active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch(`/api/admin/tiers/${tier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_quantity: totalQuantity,
        is_active: isActive,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const soldOut = tier.quantity_sold >= totalQuantity;

  return (
    <div className="border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display font-700">{tier.name}</div>
          <div className="mt-1 font-glitch text-xs text-foreground/50">
            {formatNaira(tier.price)} · {tier.quantity_sold} sold
          </div>
        </div>
        {soldOut && (
          <span className="bg-danger px-2 py-0.5 font-glitch text-[9px] uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-3">
        <label className="flex-1">
          <span className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
            Total Quantity
          </span>
          <input
            type="number"
            min={tier.quantity_sold}
            value={totalQuantity}
            onChange={(e) => setTotalQuantity(Number(e.target.value))}
            className="mt-1 w-full border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-neon-purple"
          />
        </label>

        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-[var(--neon-purple)]"
          />
          <span className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
            Active
          </span>
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-neon-purple px-4 py-2 font-display font-700 text-xs text-background disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            "Save"
          )}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
