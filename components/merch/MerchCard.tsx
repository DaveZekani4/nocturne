import Image from "next/image";
import { Plus } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { MerchProduct } from "@/types";

type Props = {
  product: MerchProduct;
  onAddToBag: () => void;
};

export default function MerchCard({ product, onAddToBag }: Props) {
  const remaining = product.stock_quantity - product.stock_sold;
  const soldOut = remaining <= 0;
  const image = product.image_urls[0];

  return (
    <div className="border border-border-subtle bg-surface">
      <div className="relative aspect-[3/4] w-full bg-surface-raised">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 50vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-glitch text-[10px] text-foreground/30">
            NO IMAGE
          </div>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 bg-danger px-2 py-0.5 font-glitch text-[9px] uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="font-display font-700 text-sm">{product.name}</div>
        <div className="mt-1 font-glitch text-xs text-neon-purple">
          {formatNaira(product.price)}
        </div>
        <button
          type="button"
          onClick={onAddToBag}
          disabled={soldOut}
          className="mt-3 flex w-full items-center justify-center gap-1.5 border border-border-subtle py-2 font-glitch text-[10px] uppercase tracking-wider disabled:opacity-30"
        >
          <Plus size={12} /> Add to Bag
        </button>
      </div>
    </div>
  );
}
