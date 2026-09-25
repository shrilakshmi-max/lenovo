import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// No passcode by design, same as /api/pune/register - this is meant for
// the desk to quickly fill in a team name that's missing on the roster
// while checking a team in.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamId = body?.teamId as string | undefined;
  const teamName = body?.teamName as string | undefined;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }
  if (typeof teamName !== "string" || teamName.trim().length === 0) {
    return NextResponse.json({ error: "Team name can't be empty." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("pune_roster")
    .update({ team_name: teamName.trim() })
    .eq("team_id", teamId)
    .select("team_id, team_name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No roster entry for that Team ID." }, { status: 404 });
  }

  return NextResponse.json({ team_id: data.team_id, team_name: data.team_name });
}
