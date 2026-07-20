import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.stock_quantity === "number") {
    updates.stock_quantity = body.stock_quantity;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }
  if (typeof body.price === "number") {
    updates.price = Math.round(body.price * 100);
  }

  const { error } = await supabase
    .from("merch_products")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Update rejected — check you're an approved admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase.from("merch_products").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Delete rejected — check you're an approved admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
