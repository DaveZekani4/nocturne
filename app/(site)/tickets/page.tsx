import { createClient } from "@/lib/supabase/server";
import TicketsExperience from "@/components/tickets/TicketsExperience";
import type { TicketTier } from "@/types";

export const revalidate = 0; // always fetch fresh stock counts

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return <TicketsExperience initialTiers={(tiers as TicketTier[]) ?? []} />;
}
