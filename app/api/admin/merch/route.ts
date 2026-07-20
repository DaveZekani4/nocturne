import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();

  if (!body.name?.trim() || !body.price || body.price <= 0) {
    return NextResponse.json(
      { error: "Name and a valid price (in naira) are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("merch_products").insert({
    name: body.name.trim(),
    description: body.description?.trim() || null,
    price: Math.round(Number(body.price) * 100), // naira -> kobo
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
    stock_quantity: Number(body.stock_quantity) || 0,
    is_active: body.is_active ?? true,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not create product — check you're an approved admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
