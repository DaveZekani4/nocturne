import { Minus, Plus } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";
import type { TicketTier } from "@/types";

type Props = {
  tier: TicketTier;
  qty: number;
  onChange: (delta: number) => void;
};

export default function TicketTierCard({ tier, qty, onChange }: Props) {
  const remaining = tier.total_quantity - tier.quantity_sold;
  const soldOut = remaining <= 0;
  const lowStock = !soldOut && remaining <= 20 && tier.online_checkout_enabled;

  // Gate-only tiers (e.g. "Pay at Entry") show no stepper — informational only
  if (!tier.online_checkout_enabled) {
    return (
      <div className="relative mb-3 border border-border-subtle bg-surface p-4 opacity-60">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-700 text-base">{tier.name}</div>
            <div className="mt-1 text-xs text-foreground/50">
              {tier.description}
            </div>
          </div>
          <div className="whitespace-nowrap text-right font-glitch font-700 text-lg text-neon-purple">
            {formatNaira(tier.price)}
          </div>
        </div>
        <div className="mt-4 font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
          Registered at the gate, no online checkout
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative mb-3 border bg-surface p-4",
        lowStock ? "border-neon-purple" : "border-border-subtle",
        soldOut && "opacity-50"
      )}
    >
      {lowStock && (
        <span className="absolute -top-2.5 right-4 bg-neon-purple px-2 py-0.5 font-glitch text-[9px] uppercase tracking-wider text-background">
          Low stock
        </span>
      )}
      {soldOut && (
        <span className="absolute -top-2.5 right-4 bg-danger px-2 py-0.5 font-glitch text-[9px] uppercase tracking-wider text-white">
          Sold out
        </span>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="font-display font-700 text-base">{tier.name}</div>
          <div className="mt-1 text-xs text-foreground/50">
            {tier.description}
          </div>
        </div>
        <div className="whitespace-nowrap text-right font-glitch font-700 text-lg text-neon-purple">
          {formatNaira(tier.price)}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
          {soldOut ? "None left" : `${remaining} left`}
        </span>

        <div className="flex items-center border border-border-subtle">
          <button
            type="button"
            onClick={() => onChange(-1)}
            disabled={qty === 0}
            aria-label={`Remove one ${tier.name} ticket`}
            className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-glitch text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => onChange(1)}
            disabled={soldOut || qty >= remaining}
            aria-label={`Add one ${tier.name} ticket`}
            className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
