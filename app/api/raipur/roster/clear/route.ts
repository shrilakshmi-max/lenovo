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
    .from("raipur_roster")
    .select("team_id");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Only clears the pending-roster table - never touches raipur_teams or
  // raipur_scores, so any team that has already registered stays
  // registered.
  const { error: deleteError } = await supabaseAdmin
    .from("raipur_roster")
    .delete()
    .in("registered", [true, false]);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ removed: existing?.length ?? 0 });
}
