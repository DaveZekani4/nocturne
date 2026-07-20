import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { formatNaira } from "@/lib/utils";
import type { Order, OrderLineItem, MerchOrder, TicketPass } from "@/types";
import Link from "next/link";
import QRCode from "qrcode";

export const revalidate = 0;

type Props = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { reference } = await searchParams;

  if (!reference) {
    return (
      <StatusShell
        status="failed"
        title="No Reference Found"
        message="We couldn't find a transaction reference. If you just paid, check your email for confirmation or contact us on WhatsApp."
      />
    );
  }

  const isMerch = reference.startsWith("NR1-MER-");
  const table = isMerch ? "merch_orders" : "orders";

  const supabase = createAdminClient();
  let { data: order } = await supabase
    .from(table)
    .select("*")
    .eq("paystack_ref", reference)
    .single<Order | MerchOrder>();

  // Webhook is the source of truth, but it can lag a few seconds behind
  // the redirect. If the order still shows pending, double-check directly
  // with Paystack so the user isn't stuck looking at "pending" needlessly.
  if (order && order.status === "pending") {
    try {
      const verification = await verifyPaystackTransaction(reference);
      if (verification.data.status === "success") {
        await supabase.from(table).update({ status: "success" }).eq("id", order.id);
        order = { ...order, status: "success" };
      }
    } catch {
      
    }
  }

  if (!order) {
    return (
      <StatusShell
        status="failed"
        title="Order Not Found"
        message="We couldn't locate this order. If money left your account, contact us on WhatsApp with your reference and we'll sort it out."
      />
    );
  }

  if (order.status === "failed") {
    return (
      <StatusShell
        status="failed"
        title="Payment Failed"
        message="This transaction didn't go through. No charge was made. Abeg try again."
      />
    );
  }

  if (order.status === "pending") {
    return (
      <StatusShell
        status="pending"
        title="Confirming Payment…"
        message="Your payment is still processing. Refresh this page in a few seconds, your confirmation will appear here once verified."
      />
    );
  }

  return isMerch ? (
    <MerchSuccess order={order as MerchOrder} />
  ) : (
    <TicketSuccess order={order as Order} />
  );
}

async function TicketSuccess({ order }: { order: Order }) {
  const items = order.items as OrderLineItem[];
  const supabase = createAdminClient();

  const { data: passes } = await supabase
    .from("ticket_passes")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const passesWithQr = await Promise.all(
    ((passes as TicketPass[]) ?? []).map(async (pass) => ({
      pass,
      qr: await QRCode.toDataURL(pass.code, {
        margin: 1,
        color: { dark: "#131313", light: "#f5f5f5" },
        width: 240,
      }),
    }))
  );

  return (
    <section className="flex min-h-[75vh] flex-col items-center px-6 py-12 text-center">
      <p className="font-glitch text-xs tracking-[0.3em] text-success">
        TRANSACTION CONFIRMED
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">
        You&apos;re In. See You There.
      </h1>

      <div className="mt-6 w-full max-w-sm border border-neon-purple/30 bg-surface p-5 text-left">
        <p className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
          Reference
        </p>
        <p className="mb-4 font-glitch text-sm text-neon-purple">
          {order.paystack_ref}
        </p>

        {items.map((item) => (
          <div
            key={item.tier_id}
            className="flex justify-between border-t border-border-subtle py-2 text-sm"
          >
            <span>
              {item.tier_name} × {item.quantity}
            </span>
            <span className="font-glitch">
              {formatNaira(item.unit_price * item.quantity)}
            </span>
          </div>
        ))}

        <div className="mt-2 flex justify-between border-t border-border-subtle pt-3 font-display font-700">
          <span>Total</span>
          <span className="text-neon-purple">{formatNaira(order.amount)}</span>
        </div>
      </div>

      {passesWithQr.length > 0 && (
        <div className="mt-8 w-full max-w-sm">
          <p className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
            Your Passes — Show At The Gate
          </p>
          <div className="mt-3 flex flex-col gap-4">
            {passesWithQr.map(({ pass, qr }) => (
              <div
                key={pass.id}
                className="border border-border-subtle bg-surface p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`QR code for ${pass.tier_name} pass`}
                  className="mx-auto h-40 w-40"
                />
                <p className="mt-3 font-display font-700 text-sm">
                  {pass.tier_name}
                </p>
                <p className="font-glitch text-xs tracking-wider text-foreground/50">
                  {pass.code}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 max-w-xs text-xs text-foreground/50">
        A confirmation has been sent to {order.email}. Screenshot this page
        or save it, each pass is scanned once at the gate.
      </p>

      <Link
        href="/"
        className="mt-6 border border-border-subtle px-6 py-3 font-display font-700 text-sm"
      >
        Back to Home
      </Link>
    </section>
  );
}

function MerchSuccess({ order }: { order: MerchOrder }) {
  return (
    <section className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-glitch text-xs tracking-[0.3em] text-success">
        TRANSACTION CONFIRMED
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Gear Secured</h1>

      <div className="mt-6 w-full max-w-sm border border-neon-purple/30 bg-surface p-5 text-left">
        <p className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
          Reference
        </p>
        <p className="mb-4 font-glitch text-sm text-neon-purple">
          {order.paystack_ref}
        </p>

        {order.cart_items.map((item, idx) => (
          <div
            key={`${item.product_id}-${idx}`}
            className="flex justify-between border-t border-border-subtle py-2 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-glitch">
              {formatNaira(item.price * item.quantity)}
            </span>
          </div>
        ))}

        <div className="mt-2 flex justify-between border-t border-border-subtle pt-3 font-display font-700">
          <span>Total</span>
          <span className="text-neon-purple">{formatNaira(order.amount)}</span>
        </div>
      </div>

      <p className="mt-6 max-w-xs text-xs text-foreground/50">
        A confirmation has been sent to {order.email}. Pick up your gear at
        the merch desk on the night.
      </p>

      <Link
        href="/"
        className="mt-6 border border-border-subtle px-6 py-3 font-display font-700 text-sm"
      >
        Back to Home
      </Link>
    </section>
  );
}

function StatusShell({
  status,
  title,
  message,
}: {
  status: "pending" | "failed";
  title: string;
  message: string;
}) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p
        className={`font-glitch text-xs tracking-[0.3em] ${
          status === "failed" ? "text-danger" : "text-warning"
        }`}
      >
        {status === "failed" ? "TRANSACTION FAILED" : "PROCESSING"}
      </p>
      <h1 className="mt-2 font-display font-800 text-2xl">{title}</h1>
      <p className="mt-4 max-w-sm font-body text-foreground/70">{message}</p>
      <Link
        href="/tickets"
        className="mt-6 border border-border-subtle px-6 py-3 font-display font-700 text-sm"
      >
        Back to Tickets
      </Link>
    </section>
  );
}
