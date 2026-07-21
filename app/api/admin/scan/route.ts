import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



type PassRow = { tier_name: string; checked_in: boolean; checked_in_at: string | null };


function tierBreakdown(passes: PassRow[]): string {
  const counts = new Map<string, number>();
  for (const p of passes) {
    counts.set(p.tier_name, (counts.get(p.tier_name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tier, count]) => `${count}x ${tier}`)
    .join(", ");
}

export async function POST(req: Request) {
  const { code } = await req.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!code?.trim()) {
    return NextResponse.json({ error: "No code provided." }, { status: 400 });
  }

  const reference = code.trim();

  // Find the order this QR belongs to.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("paystack_ref", reference)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { status: "invalid", message: "Order not found. Not a valid NOCTURNE RAVE ticket." },
      { status: 404 }
    );
  }

  // All individual passes that belong to this order.
  const { data: passes, error: passesError } = await supabase
    .from("ticket_passes")
    .select("*")
    .eq("order_id", order.id);

  if (passesError || !passes || passes.length === 0) {
    return NextResponse.json(
      { status: "invalid", message: "No tickets found for this order." },
      { status: 404 }
    );
  }

  const alreadyCheckedIn = passes.filter((p) => p.checked_in);
  const notYetCheckedIn = passes.filter((p) => !p.checked_in);

  if (notYetCheckedIn.length === 0) {
    // Every pass on this order was already scanned in.
    const latest = alreadyCheckedIn.sort(
      (a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    )[0];
    return NextResponse.json({
      status: "duplicate",
      message: `Whole group (${tierBreakdown(passes)}) already checked in at ${new Date(
        latest.checked_in_at
      ).toLocaleTimeString()}.`,
      passes,
      breakdown: tierBreakdown(passes),
    });
  }

  const now = new Date().toISOString();
  const idsToCheckIn = notYetCheckedIn.map((p) => p.id);

  const { data: updated, error: updateError } = await supabase
    .from("ticket_passes")
    .update({ checked_in: true, checked_in_at: now })
    .in("id", idsToCheckIn)
    .select();

  if (updateError) {
    return NextResponse.json(
      { error: "Check-in failed — check you're an approved admin." },
      { status: 403 }
    );
  }

  const partialNote =
    alreadyCheckedIn.length > 0
      ? ` (${alreadyCheckedIn.length} of ${passes.length} were already in — the rest are checked in now)`
      : "";

  return NextResponse.json({
    status: "valid",
    message: `Checked in: ${tierBreakdown(passes)}.${partialNote}`,
    passes: updated,
    groupSize: passes.length,
    breakdown: tierBreakdown(passes),
  });
}