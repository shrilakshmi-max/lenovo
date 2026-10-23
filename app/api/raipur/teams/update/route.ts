import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Lets an organizer manually override a single team's table number (or
// Lab 1-style location) and evaluator group from /raipur/admin, for
// corrections after the normal registration-desk assignment. raipur_teams
// has no public write policy, so this goes through the service-role
// client, gated by the same admin passcode as import/clear.
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
  const tableNumber = body?.tableNumber as number | null | undefined;
  const location = body?.location as string | null | undefined;
  const groupNumber = body?.groupNumber as number | undefined;

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }
  if (!groupNumber || groupNumber < 1 || groupNumber > 5) {
    return NextResponse.json({ error: "Invalid evaluator group." }, { status: 400 });
  }
  if ((tableNumber === null || tableNumber === undefined) && !location) {
    return NextResponse.json(
      { error: "Provide a table number or a location." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("raipur_teams")
    .update({
      table_number: tableNumber ?? null,
      location: location ?? null,
      group_number: groupNumber,
    })
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
