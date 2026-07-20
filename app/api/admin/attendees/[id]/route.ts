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

  const { error } = await supabase
    .from("orders")
    .update({ checked_in: Boolean(body.checked_in) })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Update rejected — check you're an approved admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
