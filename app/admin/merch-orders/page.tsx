import { createClient } from "@/lib/supabase/server";
import MerchOrderList from "@/components/admin/MerchOrderList";
import type { MerchOrder } from "@/types";

export const revalidate = 0;

export default async function AdminMerchOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("status", "success")
    .order("created_at", { ascending: false });

  return (
    <section>
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Merch Orders</h1>
      <p className="mt-2 max-w-md text-sm text-foreground/60">
        Everyone with a confirmed hat order. Mark as fulfilled once it&apos;s
        handed over.
      </p>

      <div className="mt-6">
        <MerchOrderList initialOrders={(orders as MerchOrder[]) ?? []} />
      </div>
    </section>
  );
}
