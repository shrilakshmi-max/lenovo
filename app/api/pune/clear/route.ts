import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_PASSWORD configuration." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = body?.password as string | undefined;

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const { data: existing, error: countError } = await supabaseAdmin
    .from("pune_teams")
    .select("table_number");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Deletes all pune_teams; the pune_scores foreign key is
  // on-delete-cascade, so every score is removed with them. Only touches
  // the Pune tables.
  const { error: deleteError } = await supabaseAdmin
    .from("pune_teams")
    .delete()
    .gte("table_number", 0);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ removed: existing?.length ?? 0 });
}
