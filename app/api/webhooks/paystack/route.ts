import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPaystackSignature, generatePassCode } from "@/lib/paystack";
import type { OrderLineItem } from "@/types";
import type { CartItem } from "@/types";

/**
 * Paystack calls this endpoint for every transaction event. We only act
 * on `charge.success`, and we re-derive the signature ourselves rather
 * than trusting the payload — this is the one place that's allowed to
 * mark an order as paid and move stock, so it has to be airtight.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createAdminClient();

  if (event.event !== "charge.success") {
    // Acknowledge anything else (failed, abandoned) so Paystack stops retrying.
    return NextResponse.json({ received: true });
  }

  const reference: string = event.data.reference;

  // Try ticket orders first, then merch orders — reference prefix tells us which.
  if (reference.startsWith("NR1-TIX-")) {
    await handleTicketOrder(supabase, reference);
  } else if (reference.startsWith("NR1-MER-")) {
    await handleMerchOrder(supabase, reference);
  }

  return NextResponse.json({ received: true });
}

async function handleTicketOrder(
  supabase: ReturnType<typeof createAdminClient>,
  reference: string
) {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("paystack_ref", reference)
    .single();

  if (!order || order.status === "success") return; // already processed / not found

  const items = order.items as OrderLineItem[];

  let allReserved = true;
  for (const item of items) {
    const { data: ok } = await supabase.rpc("increment_tier_sold", {
      p_tier_id: item.tier_id,
      p_qty: item.quantity,
    });
    if (!ok) allReserved = false;
  }

  // Payment succeeded either way — money has moved. If we couldn't
  // reserve stock (extreme edge case: oversold race), we still mark
  // success but this is where a human refund/manual reconciliation
  // would kick in. Logging loudly so it surfaces to the team.
  if (!allReserved) {
    console.error(
      `⚠️ Oversell risk on order ${order.id} (ref ${reference}) — stock could not be fully reserved after payment.`
    );
  }

  await supabase
    .from("orders")
    .update({ status: "success" })
    .eq("id", order.id);

  // Mint one scannable pass per individual ticket unit — a "3x General
  // Admission" line item becomes 3 separate rows, each independently
  // checked in at the gate.
  const passRows = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: order.id,
      tier_id: item.tier_id,
      tier_name: item.tier_name,
      code: generatePassCode(),
      full_name: order.full_name,
      email: order.email,
    }))
  );

  if (passRows.length > 0) {
    await supabase.from("ticket_passes").insert(passRows);
  }
}

async function handleMerchOrder(
  supabase: ReturnType<typeof createAdminClient>,
  reference: string
) {
  const { data: order } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("paystack_ref", reference)
    .single();

  if (!order || order.status === "success") return;

  const items = order.cart_items as CartItem[];

  let allReserved = true;
  for (const item of items) {
    const { data: ok } = await supabase.rpc("increment_merch_sold", {
      p_product_id: item.product_id,
      p_qty: item.quantity,
    });
    if (!ok) allReserved = false;
  }

  if (!allReserved) {
    console.error(
      `⚠️ Oversell risk on merch order ${order.id} (ref ${reference}) — stock could not be fully reserved after payment.`
    );
  }

  await supabase
    .from("merch_orders")
    .update({ status: "success" })
    .eq("id", order.id);
}
