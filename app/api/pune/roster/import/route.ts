import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseRosterCsv } from "@/lib/puneRosterImport";

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

  const { rows, errors: parseErrors } = parseRosterCsv(csvText);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid roster rows found in the file.", details: parseErrors },
      { status: 400 }
    );
  }

  // Upsert by team_id. Only the fields below are written on conflict, so
  // this never touches `registered` / `registered_table_number` for a team
  // that's already checked in - re-uploading a corrected roster can't
  // accidentally un-register anyone.
  const { error: upsertError } = await supabaseAdmin
    .from("pune_roster")
    .upsert(rows, { onConflict: "team_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: rows.length,
    warnings: parseErrors,
  });
}
