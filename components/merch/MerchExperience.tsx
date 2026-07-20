"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MerchProduct, CartItem } from "@/types";
import MerchCard from "./MerchCard";
import CheckoutBar from "@/components/tickets/CheckoutBar";
import CheckoutModal from "@/components/tickets/CheckoutModal";

type Props = {
  initialProducts: MerchProduct[];
};

export default function MerchExperience({ initialProducts }: Props) {
  const [products, setProducts] = useState<MerchProduct[]>(initialProducts);
  const [bag, setBag] = useState<CartItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("merch_products-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merch_products" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const p = payload.new as MerchProduct;
            if (p.is_active) setProducts((prev) => [p, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const p = payload.new as MerchProduct;
            setProducts((prev) =>
              p.is_active
                ? prev.map((item) => (item.id === p.id ? p : item))
                : prev.filter((item) => item.id !== p.id)
            );
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function addToBag(product: MerchProduct) {
    setBag((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          size: null,
          quantity: 1,
          image_url: product.image_urls[0] ?? null,
        },
      ];
    });
  }

  const { itemCount, totalAmount } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const item of bag) {
      count += item.quantity;
      total += item.quantity * item.price;
    }
    return { itemCount: count, totalAmount: total };
  }, [bag]);

  async function handleCheckoutSubmit(details: {
    full_name: string;
    email: string;
    phone: string;
  }) {
    setCheckoutError(null);
    const res = await fetch("/api/merch-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...details, cart_items: bag }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Checkout failed. Please try again.");
    }

    window.location.href = data.authorization_url;
  }

  return (
    <>
      <section className="px-6 py-10">
        <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
          OFFICIAL MERCH
        </p>
        <h1 className="mt-2 font-display font-800 text-3xl">The Gear</h1>

        {products.length === 0 ? (
          <div className="mt-8 border border-dashed border-border-subtle p-8 text-center">
            <p className="font-glitch text-xs uppercase tracking-wider text-foreground/50">
              Catalog dropping soon
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              Gear is being loaded in — hoodies, shades &amp; the rest of the
              catalog go live before doors open. Check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {products.map((product) => (
              <MerchCard
                key={product.id}
                product={product}
                onAddToBag={() => addToBag(product)}
              />
            ))}
          </div>
        )}

        {checkoutError && (
          <p className="mt-2 text-sm text-danger">{checkoutError}</p>
        )}
      </section>

      {products.length > 0 && (
        <>
          <CheckoutBar
            ticketCount={itemCount}
            totalAmount={totalAmount}
            onCheckout={() => setModalOpen(true)}
            itemLabel="ITEM"
          />
          <CheckoutModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            totalAmount={totalAmount}
            onSubmit={handleCheckoutSubmit}
          />
        </>
      )}
    </>
  );
}
