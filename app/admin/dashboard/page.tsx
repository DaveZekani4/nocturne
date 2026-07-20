import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import type { TicketTier } from "@/types";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: orders } = await supabase
    .from("orders")
    .select("amount, status")
    .eq("status", "success");

  const { data: merchOrders } = await supabase
    .from("merch_orders")
    .select("amount, status")
    .eq("status", "success");

  const ticketRevenue = (orders ?? []).reduce((sum, o) => sum + o.amount, 0);
  const merchRevenue = (merchOrders ?? []).reduce((sum, o) => sum + o.amount, 0);
  const totalRevenue = ticketRevenue + merchRevenue;

  const allTiers = (tiers as TicketTier[]) ?? [];
  const totalSold = allTiers.reduce((sum, t) => sum + t.quantity_sold, 0);

  return (
    <section>
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} />
        <StatCard label="Tickets Sold" value={String(totalSold)} />
        <StatCard label="Ticket Revenue" value={formatNaira(ticketRevenue)} />
        <StatCard label="Merch Revenue" value={formatNaira(merchRevenue)} />
      </div>

      <h2 className="mt-10 font-display font-700 text-lg">Tickets Per Tier</h2>
      <div className="mt-4 flex flex-col gap-3">
        {allTiers.map((tier) => {
          const pct =
            tier.total_quantity > 0
              ? Math.min(100, Math.round((tier.quantity_sold / tier.total_quantity) * 100))
              : 0;
          return (
            <div key={tier.id} className="border border-border-subtle bg-surface p-4">
              <div className="flex justify-between font-glitch text-xs">
                <span>{tier.name}</span>
                <span>
                  {tier.quantity_sold} / {tier.total_quantity}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden bg-surface-raised">
                <div
                  className="h-full bg-gradient-to-r from-neon-violet to-neon-purple"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-subtle bg-surface p-4">
      <p className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className="mt-1 font-display font-800 text-xl text-neon-purple">
        {value}
      </p>
    </div>
  );
}
