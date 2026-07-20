"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { MerchProduct } from "@/types";

type Props = {
  product: MerchProduct;
  onChanged: () => void;
};

export default function MerchProductRow({ product, onChanged }: Props) {
  const [stock, setStock] = useState(product.stock_quantity);
  const [isActive, setIsActive] = useState(product.is_active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/merch/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_quantity: stock, is_active: isActive }),
    });
    setSaving(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/merch/${product.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="flex gap-3 border border-border-subtle bg-surface p-3">
      <div className="relative h-16 w-16 flex-shrink-0 bg-surface-raised">
        {product.image_urls[0] ? (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : null}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-700 text-sm">{product.name}</div>
            <div className="font-glitch text-xs text-neon-purple">
              {formatNaira(product.price)} · {product.stock_sold} sold
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete product"
            className="text-danger"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={product.stock_sold}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-20 border border-border-subtle bg-background px-2 py-1.5 text-xs outline-none focus:border-neon-purple"
          />
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--neon-purple)]"
            />
            <span className="font-glitch text-[10px] uppercase text-foreground/50">
              Live
            </span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto bg-neon-purple px-3 py-1.5 font-glitch text-[10px] uppercase text-background disabled:opacity-60"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
