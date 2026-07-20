import { createClient } from "@/lib/supabase/server";
import MerchExperience from "@/components/merch/MerchExperience";
import type { MerchProduct } from "@/types";

export const revalidate = 0;

export default async function MerchPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("merch_products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return <MerchExperience initialProducts={(products as MerchProduct[]) ?? []} />;
}
