import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Deletes a single Raipur team (and, via on-delete-cascade, all of its
// scores), then resets its raipur_roster entry back to "not registered"
// so the registration desk can register it again - this is meant for
// undoing a mistaken/duplicate registration, not a permanent ban.
// Admin-passcode gated, like every other raipur_teams mutation.
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
  const teamId = body?.teamId as string | undefined;

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("raipur_teams")
    .delete()
    .eq("team_id", teamId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: rosterError } = await supabaseAdmin
    .from("raipur_roster")
    .update({ registered: false, registered_table_number: null })
    .eq("team_id", teamId);

  if (rosterError) {
    return NextResponse.json({ error: rosterError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
