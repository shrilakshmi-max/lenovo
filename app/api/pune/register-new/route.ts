import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// No passcode by design, same as /api/pune/register - for a team that
// walked up without ever being on the pre-uploaded roster. Generates a
// unique Team ID and assigns a table/group atomically via
// register_new_pune_team (see supabase/migrations/007_pune_spot_registration.sql).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const leaderName = (body?.leaderName as string | undefined)?.trim();
  const projectTheme = (body?.projectTheme as string | undefined)?.trim();

  if (!leaderName) {
    return NextResponse.json({ error: "Team leader name is required." }, { status: 400 });
  }
  if (!projectTheme) {
    return NextResponse.json({ error: "Project theme is required." }, { status: 400 });
  }

  const teamName = (body?.teamName as string | undefined)?.trim() || null;
  const member2Name = (body?.member2Name as string | undefined)?.trim() || null;
  const leaderEmail = (body?.leaderEmail as string | undefined)?.trim() || null;
  const leaderContact = (body?.leaderContact as string | undefined)?.trim() || null;
  const projectTitle = (body?.projectTitle as string | undefined)?.trim() || null;
  const projectLink = (body?.projectLink as string | undefined)?.trim() || null;
  const attendees = member2Name
    ? "2 - Both team members will attend"
    : "1 - Individual participation";

  const { data, error } = await supabaseAdmin
    .rpc("register_new_pune_team", {
      p_team_name: teamName,
      p_leader_name: leaderName,
      p_member2_name: member2Name,
      p_leader_email: leaderEmail,
      p_leader_contact: leaderContact,
      p_attendees: attendees,
      p_project_title: projectTitle,
      p_project_theme: projectTheme,
      p_project_link: projectLink,
    })
    .single();

  if (error) {
    const status = error.code === "P0001" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  const result = data as {
    assigned_team_id: string;
    assigned_table_number: number;
    assigned_group_number: number;
  };

  return NextResponse.json({
    teamId: result.assigned_team_id,
    tableNumber: result.assigned_table_number,
    groupNumber: result.assigned_group_number,
  });
}
