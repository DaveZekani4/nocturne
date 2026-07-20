import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  // Using the session-aware server client (not the service role client) is
  // intentional here — it enforces our `is_admin()` RLS policy, so this
  // route can only ever succeed for a logged-in admin. No manual role
  // check needed; Postgres does it for us.
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.total_quantity === "number") {
    updates.total_quantity = body.total_quantity;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  const { error } = await supabase
    .from("ticket_tiers")
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
