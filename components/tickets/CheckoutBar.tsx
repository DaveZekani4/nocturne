import { Zap } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type Props = {
  ticketCount: number;
  totalAmount: number;
  onCheckout: () => void;
  itemLabel?: string;
};

export default function CheckoutBar({
  ticketCount,
  totalAmount,
  onCheckout,
  itemLabel = "TICKET",
}: Props) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 border-t border-neon-violet/40 bg-background/95 px-5 py-3.5 backdrop-blur-md">
      <div className="font-glitch text-[11px] text-foreground/60">
        <span>
          {ticketCount} {itemLabel}{ticketCount === 1 ? "" : "S"}
        </span>
        <div className="font-display font-700 text-lg text-foreground">
          {formatNaira(totalAmount)}
        </div>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={ticketCount === 0}
        className="flex items-center gap-2 bg-neon-purple px-5 py-3.5 font-display font-700 text-sm text-background shadow-[0_0_18px_rgba(168,85,247,0.55)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        <Zap size={15} />
        Checkout
      </button>
    </div>
  );
}
