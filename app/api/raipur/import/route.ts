import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { assignRaipurGroups, parseRaipurTeamsCsv } from "@/lib/raipurCsvImport";

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
  const csvText = body?.csv as string | undefined;

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  if (!csvText || typeof csvText !== "string") {
    return NextResponse.json({ error: "No CSV content received." }, { status: 400 });
  }

  const { rows, errors: parseErrors } = parseRaipurTeamsCsv(csvText);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid team rows found in the file.", details: parseErrors },
      { status: 400 }
    );
  }

  const grouped = assignRaipurGroups(rows).map((row) => ({
    ...row,
    is_solo: row.member2_name === null || row.member2_name.trim() === "",
  }));

  // Full reset: every upload wipes all existing raipur_teams (and, via the
  // on-delete-cascade foreign key, all existing raipur_scores) and
  // replaces them with the new file. This only ever touches the Raipur
  // tables - UP and Pune are untouched.
  const { error: deleteError } = await supabaseAdmin
    .from("raipur_teams")
    .delete()
    .gte("table_number", 0);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("raipur_teams")
    .insert(grouped);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: grouped.length,
    warnings: parseErrors,
  });
}
