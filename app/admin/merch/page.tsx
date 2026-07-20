"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MerchUploadForm from "@/components/admin/MerchUploadForm";
import MerchProductRow from "@/components/admin/MerchProductRow";
import type { MerchProduct } from "@/types";

export default function AdminMerchPage() {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("merch_products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as MerchProduct[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    void fetchProducts();
  }, [fetchProducts]);

  return (
    <section>
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Manage Merch</h1>
      <p className="mt-2 max-w-md text-sm text-foreground/60">
        Upload gear here and it goes live on the public /merch page instantly
        — nothing shows up there until you publish it from this panel.
      </p>

      <div className="mt-6">
        <MerchUploadForm onCreated={fetchProducts} />
      </div>

      <h2 className="mt-10 font-display font-700 text-lg">
        Published Products
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {loading && <p className="text-sm text-foreground/50">Loading…</p>}
        {!loading && products.length === 0 && (
          <p className="text-sm text-foreground/50">
            No products yet — upload your first item above.
          </p>
        )}
        {products.map((product) => (
          <MerchProductRow
            key={product.id}
            product={product}
            onChanged={fetchProducts}
          />
        ))}
      </div>
    </section>
  );
}
