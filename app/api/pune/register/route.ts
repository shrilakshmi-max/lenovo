import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// No passcode by design (matches the evaluator pages' trust model) - this
// is meant for fast, repeated use by desk volunteers. Table number +
// evaluator group are assigned atomically by the register_pune_team
// Postgres function (see supabase/migrations/005_pune_register_function.sql),
// which serializes concurrent calls so two desks can never collide.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamId = body?.teamId as string | undefined;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .rpc("register_pune_team", { p_team_id: teamId })
    .single();

  if (error) {
    const status =
      error.code === "P0002"
        ? 404
        : error.code === "23505"
        ? 409
        : error.code === "P0001"
        ? 409
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  const result = data as {
    assigned_table_number: number;
    assigned_group_number: number;
  };

  return NextResponse.json({
    tableNumber: result.assigned_table_number,
    groupNumber: result.assigned_group_number,
  });
}
