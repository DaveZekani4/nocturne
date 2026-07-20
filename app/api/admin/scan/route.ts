import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: pass, error } = await supabase
    .from("ticket_passes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !pass) {
    return NextResponse.json(
      { status: "invalid", message: "Pass not found. Not a valid NOCTURNE RAVE ticket." },
      { status: 404 }
    );
  }

  if (pass.checked_in) {
    return NextResponse.json({
      status: "duplicate",
      message: `Already checked in at ${new Date(pass.checked_in_at).toLocaleTimeString()}.`,
      pass,
    });
  }

  const { data: updated, error: updateError } = await supabase
    .from("ticket_passes")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", pass.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Check-in failed — check you're an approved admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: "valid",
    message: "Checked in successfully.",
    pass: updated,
  });
}
