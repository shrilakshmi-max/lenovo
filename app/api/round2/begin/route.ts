import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ROUND2_SIZE = 20;

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

  // Round 2 can only be started once. If any team is already flagged, the
  // top 20 have already been selected - do not re-run.
  const { data: alreadyStarted, error: checkError } = await supabaseAdmin
    .from("teams")
    .select("table_number")
    .eq("round2_qualified", true)
    .limit(1);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (alreadyStarted && alreadyStarted.length > 0) {
    return NextResponse.json(
      { error: "Round 2 has already begun." },
      { status: 409 }
    );
  }

  const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
    .from("leaderboard")
    .select("table_number, average_total")
    .not("average_total", "is", null)
    .order("average_total", { ascending: false })
    .order("table_number", { ascending: true })
    .limit(ROUND2_SIZE);

  if (leaderboardError) {
    return NextResponse.json({ error: leaderboardError.message }, { status: 500 });
  }

  if (!leaderboard || leaderboard.length === 0) {
    return NextResponse.json(
      { error: "No teams have been scored in round 1 yet." },
      { status: 400 }
    );
  }

  const tableNumbers = leaderboard.map((r) => r.table_number as number);

  const { error: updateError } = await supabaseAdmin
    .from("teams")
    .update({ round2_qualified: true })
    .in("table_number", tableNumbers);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ qualified: tableNumbers.length, tableNumbers });
}
