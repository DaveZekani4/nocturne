import { createClient } from "@/lib/supabase/server";
import TierEditorRow from "@/components/admin/TierEditorRow";
import type { TicketTier } from "@/types";

export const revalidate = 0;

export default async function AdminTicketsPage() {
  const supabase = await createClient();
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <section>
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Manage Tickets</h1>
      <p className="mt-2 max-w-md text-sm text-foreground/60">
        Adjust total quantity per tier (e.g. 500 → 300), or flip a tier
        inactive to pull it from the public site instantly.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {((tiers as TicketTier[]) ?? []).map((tier) => (
          <TierEditorRow key={tier.id} tier={tier} />
        ))}
      </div>
    </section>
  );
}
