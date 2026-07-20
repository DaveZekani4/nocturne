import { createClient } from "@/lib/supabase/server";
import AttendeeList from "@/components/admin/AttendeeList";
import type { Order } from "@/types";

export const revalidate = 0;

export default async function AdminAttendeesPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "success")
    .order("created_at", { ascending: false });

  return (
    <section>
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Attendees</h1>
      <p className="mt-2 max-w-md text-sm text-foreground/60">
        Everyone with a confirmed ticket. Search, check in at the gate, or
        export the full list as CSV.
      </p>

      <div className="mt-6">
        <AttendeeList initialOrders={(orders as Order[]) ?? []} />
      </div>
    </section>
  );
}
