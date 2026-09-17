import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { assignGroups, parseTeamsCsv } from "@/lib/csvImport";

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

  const { rows, errors: parseErrors } = parseTeamsCsv(csvText);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid team rows found in the file.", details: parseErrors },
      { status: 400 }
    );
  }

  const grouped = assignGroups(rows);

  // Full reset: every upload wipes all existing teams (and, via the
  // on-delete-cascade foreign key, all existing scores) and replaces them
  // with the new file. There is no merge/preserve behavior - this is
  // intentionally destructive so organizers get a clean slate every time.
  const { error: deleteError } = await supabaseAdmin
    .from("teams")
    .delete()
    .gte("table_number", 0);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("teams")
    .insert(grouped);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: grouped.length,
    warnings: parseErrors,
  });
}
