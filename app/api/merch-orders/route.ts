import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initializePaystackTransaction,
  generateReference,
} from "@/lib/paystack";
import type { CartItem } from "@/types";

type CheckoutBody = {
  full_name: string;
  email: string;
  phone: string;
  cart_items: CartItem[];
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
    if (!body.cart_items?.length) {
      return NextResponse.json(
        { error: "Your bag is empty." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const productIds = body.cart_items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("merch_products")
      .select("*")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { error: "Could not verify products." },
        { status: 500 }
      );
    }

    const verifiedItems: CartItem[] = [];
    let amount = 0;

    for (const item of body.cart_items) {
      const product = products.find((p) => p.id === item.product_id);

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: "One of the items in your bag is no longer available." },
          { status: 409 }
        );
      }

      const remaining = product.stock_quantity - product.stock_sold;
      if (item.quantity < 1 || item.quantity > remaining) {
        return NextResponse.json(
          {
            error: `Only ${remaining} of "${product.name}" left — please adjust your quantity.`,
          },
          { status: 409 }
        );
      }

      verifiedItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
        image_url: product.image_urls[0] ?? null,
      });
      amount += product.price * item.quantity;
    }

    const reference = generateReference("MER");

    const { error: orderError } = await supabase.from("merch_orders").insert({
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      cart_items: verifiedItems,
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
      metadata: { type: "merch_order", full_name: body.full_name },
    });

    return NextResponse.json({
      authorization_url: paystackRes.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.error("POST /api/merch-orders error:", err);
    return NextResponse.json(
      { error: "Something went wrong starting checkout. Please try again." },
      { status: 500 }
    );
  }
}
