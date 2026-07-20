import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initializePaystackTransaction,
  generateReference,
} from "@/lib/paystack";
import type { OrderLineItem } from "@/types";

type CheckoutBody = {
  full_name: string;
  email: string;
  phone: string;
  items: { tier_id: string; quantity: number }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;

    if (!body.full_name?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Full name, email, and phone are required." },
        { status: 400 }
      );
    }
    if (!body.items?.length) {
      return NextResponse.json(
        { error: "Your bag is empty — add at least one ticket." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Pull live tier data so we price and validate stock server-side —
    // never trust prices/availability sent from the client.
    const tierIds = body.items.map((i) => i.tier_id);
    const { data: tiers, error: tiersError } = await supabase
      .from("ticket_tiers")
      .select("*")
      .in("id", tierIds);

    if (tiersError || !tiers) {
      return NextResponse.json(
        { error: "Could not verify ticket tiers." },
        { status: 500 }
      );
    }

    const lineItems: OrderLineItem[] = [];
    let amount = 0;

    for (const item of body.items) {
      const tier = tiers.find((t) => t.id === item.tier_id);

      if (!tier || !tier.is_active || !tier.online_checkout_enabled) {
        return NextResponse.json(
          { error: `One of the selected tiers is no longer available online.` },
          { status: 409 }
        );
      }

      const remaining = tier.total_quantity - tier.quantity_sold;
      if (item.quantity < 1 || item.quantity > remaining) {
        return NextResponse.json(
          {
            error: `Only ${remaining} "${tier.name}" ticket(s) left — please adjust your quantity.`,
          },
          { status: 409 }
        );
      }

      lineItems.push({
        tier_id: tier.id,
        tier_name: tier.name,
        quantity: item.quantity,
        unit_price: tier.price,
      });
      amount += tier.price * item.quantity;
    }

    const reference = generateReference("TIX");

    const { error: orderError } = await supabase.from("orders").insert({
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      items: lineItems,
      amount,
      paystack_ref: reference,
      status: "pending",
    });

    if (orderError) {
      return NextResponse.json(
        { error: "Could not create your order. Please try again." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const paystackRes = await initializePaystackTransaction({
      email: body.email.trim().toLowerCase(),
      amountKobo: amount,
      reference,
      callbackUrl: `${siteUrl}/checkout/success?reference=${reference}`,
      metadata: { type: "ticket_order", full_name: body.full_name },
    });

    return NextResponse.json({
      authorization_url: paystackRes.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      { error: "Something went wrong starting checkout. Please try again." },
      { status: 500 }
    );
  }
}
