"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TicketTier } from "@/types";
import LedgerBar from "./LedgerBar";
import TicketTierCard from "./TicketTierCard";
import CheckoutBar from "./CheckoutBar";
import CheckoutModal from "./CheckoutModal";

type Props = {
  initialTiers: TicketTier[];
};

export default function TicketsExperience({ initialTiers }: Props) {
  const [tiers, setTiers] = useState<TicketTier[]>(initialTiers);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Live-subscribe to ticket_tiers so "X left" and the ledger update in
  // every open tab the moment someone else's payment confirms — no
  // refresh needed. This is what makes the FOMO counter feel real.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("ticket_tiers-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ticket_tiers" },
        (payload) => {
          setTiers((prev) =>
            prev.map((t) =>
              t.id === payload.new.id ? (payload.new as TicketTier) : t
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleQtyChange(tierId: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev, [tierId]: Math.max(0, (prev[tierId] ?? 0) + delta) };
      if (next[tierId] === 0) delete next[tierId];
      return next;
    });
  }

  const { ticketCount, totalAmount } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [tierId, qty] of Object.entries(cart)) {
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) continue;
      count += qty;
      total += qty * tier.price;
    }
    return { ticketCount: count, totalAmount: total };
  }, [cart, tiers]);

  const claimed = useMemo(
    () => tiers.reduce((sum, t) => sum + t.quantity_sold, 0),
    [tiers]
  );
  const cap = useMemo(
    () =>
      tiers
        .filter((t) => t.online_checkout_enabled)
        .reduce((sum, t) => sum + t.total_quantity, 0),
    [tiers]
  );

  async function handleCheckoutSubmit(details: {
    full_name: string;
    email: string;
    phone: string;
  }) {
    setCheckoutError(null);
    const items = Object.entries(cart).map(([tier_id, quantity]) => ({
      tier_id,
      quantity,
    }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...details, items }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Checkout failed. Please try again.");
    }

    // Hand off to Paystack's hosted checkout page.
    window.location.href = data.authorization_url;
  }

  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <section className="px-6 py-10">
        <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
          TICKETS &amp; ENTRY
        </p>
        <h1 className="mt-2 font-display font-800 text-3xl">
          Grab em Tickets!
        </h1>

        <LedgerBar claimed={claimed} cap={cap} />

        <div className="mt-6">
          {sortedTiers.map((tier) => (
            <TicketTierCard
              key={tier.id}
              tier={tier}
              qty={cart[tier.id] ?? 0}
              onChange={(delta) => handleQtyChange(tier.id, delta)}
            />
          ))}
        </div>

        {checkoutError && (
          <p className="mt-2 text-sm text-danger">{checkoutError}</p>
        )}
      </section>

      <CheckoutBar
        ticketCount={ticketCount}
        totalAmount={totalAmount}
        onCheckout={() => setModalOpen(true)}
      />

      <CheckoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        totalAmount={totalAmount}
        onSubmit={handleCheckoutSubmit}
      />
    </>
  );
}
