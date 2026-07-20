"use client";

import { useMemo, useState } from "react";
import { Check, Download, Search } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { Order, OrderLineItem } from "@/types";

type Props = {
  initialOrders: Order[];
};

export default function AttendeeList({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
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

  async function toggleCheckIn(order: Order) {
    const next = !order.checked_in;
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, checked_in: next } : o))
    );
    await fetch(`/api/admin/attendees/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked_in: next }),
    });
  }

  function exportCsv() {
    const rows = [
      ["Name", "Email", "Phone", "Tickets", "Amount", "Reference", "Checked In"],
      ...orders.map((o) => [
        o.full_name,
        o.email,
        o.phone,
        (o.items as OrderLineItem[])
          .map((i) => `${i.tier_name} x${i.quantity}`)
          .join("; "),
        String(o.amount / 100),
        o.paystack_ref,
        o.checked_in ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nocturne-rave-attendees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
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
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 border border-border-subtle px-3 py-2.5 font-glitch text-[10px] uppercase tracking-wider"
        >
          <Download size={13} /> CSV
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-foreground/50">No paid orders yet.</p>
        )}
        {filtered.map((order) => (
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
                {(order.items as OrderLineItem[])
                  .map((i) => `${i.tier_name} ×${i.quantity}`)
                  .join(", ")}{" "}
                · {formatNaira(order.amount)}
              </div>
            </div>
            <button
              onClick={() => toggleCheckIn(order)}
              className={`flex flex-shrink-0 items-center gap-1.5 px-3 py-2 font-glitch text-[10px] uppercase tracking-wider ${
                order.checked_in
                  ? "bg-success text-background"
                  : "border border-border-subtle text-foreground/60"
              }`}
            >
              <Check size={12} />
              {order.checked_in ? "In" : "Check In"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
