"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (details: {
    full_name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
};

export default function CheckoutModal({
  open,
  onClose,
  totalAmount,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ full_name: fullName, email, phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md border border-neon-purple/30 bg-surface p-6 sm:mx-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-800 text-xl">Almost There</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-foreground/60"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-1 font-glitch text-xs text-foreground/50">
          Total due: <span className="text-neon-purple">{formatNaira(totalAmount)}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
          />
          <input
            required
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
          />

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 bg-neon-purple py-3.5 font-display font-700 text-sm text-background disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Redirecting to Paystack…
              </>
            ) : (
              "Pay with Paystack"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
