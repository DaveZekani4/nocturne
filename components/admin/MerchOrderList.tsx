"use client";

import { useMemo, useState } from "react";
import { Package, PackageCheck, Search } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { MerchOrder } from "@/types";

type Props = {
  initialOrders: MerchOrder[];
};

export default function MerchOrderList({ initialOrders }: Props) {
  const [orders, setOrders] = useState<MerchOrder[]>(initialOrders);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.full_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.paystack_ref.toLowerCase().includes(q)
    );
  }, [orders, query]);

  async function toggleFulfilled(order: MerchOrder) {
    const next = order.fulfillment_status === "fulfilled" ? "pending" : "fulfilled";
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, fulfillment_status: next } : o
      )
    );
    await fetch(`/api/admin/merch-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillment_status: next }),
    });
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          placeholder="Search name, email, phone, or reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-border-subtle bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-neon-purple"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-foreground/50">No paid merch orders yet.</p>
        )}
        {filtered.map((order) => {
          const fulfilled = order.fulfillment_status === "fulfilled";
          return (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 border border-border-subtle bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-700 text-sm">
                  {order.full_name}
                </div>
                <div className="truncate font-glitch text-[10px] text-foreground/50">
                  {order.email} · {order.phone}
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {order.cart_items
                    .map((i) => `${i.name} ×${i.quantity}`)
                    .join(", ")}{" "}
                  · {formatNaira(order.amount)}
                </div>
              </div>
              <button
                onClick={() => toggleFulfilled(order)}
                className={`flex flex-shrink-0 items-center gap-1.5 px-3 py-2 font-glitch text-[10px] uppercase tracking-wider ${
                  fulfilled
                    ? "bg-success text-background"
                    : "border border-border-subtle text-foreground/60"
                }`}
              >
                {fulfilled ? <PackageCheck size={12} /> : <Package size={12} />}
                {fulfilled ? "Fulfilled" : "Mark Fulfilled"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
