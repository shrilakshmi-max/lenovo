import Papa from "papaparse";

export interface ParsedRaipurTeamRow {
  team_id: string;
  table_number: number;
  team_name: string | null;
  leader_name: string | null;
  member2_name: string | null;
  leader_email: string | null;
  leader_contact: string | null;
  attendees: string | null;
  project_title: string | null;
  project_theme: string | null;
  project_link: string | null;
  pitch_night_marks: number | null;
}

export interface RaipurParseResult {
  rows: ParsedRaipurTeamRow[];
  errors: string[];
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanNumber(value: unknown): number | null {
  const str = clean(value);
  if (str === null) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

/**
 * Same column layout as the original sheet (Table Number, Team ID, ...),
 * but deduped by Team ID rather than Table Number - Raipur allows two
 * one-person teams to share a table, so table numbers aren't unique here.
 */
export function parseRaipurTeamsCsv(csvText: string): RaipurParseResult {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const errors: string[] = parsed.errors.map(
    (e) => `Row ${e.row ?? "?"}: ${e.message}`
  );

  const rows = parsed.data;
  if (rows.length === 0) {
    return { rows: [], errors: ["The file has no rows."] };
  }

  const dataRows = rows.slice(1); // first row is the header
  const byTeamId = new Map<string, ParsedRaipurTeamRow>();

  dataRows.forEach((row, index) => {
    const csvLineNumber = index + 2; // +1 for header, +1 for 1-based
    const tableNumberRaw = clean(row[0]);
    const tableNumber = tableNumberRaw ? parseInt(tableNumberRaw, 10) : NaN;
    const teamId = clean(row[1]);

    if (!tableNumberRaw || Number.isNaN(tableNumber) || !teamId) {
      // Rows missing a table number or Team ID are not real team rows.
      return;
    }

    if (byTeamId.has(teamId)) {
      errors.push(
        `Line ${csvLineNumber}: duplicate Team ID ${teamId} - this row overwrote the earlier one.`
      );
    }

    byTeamId.set(teamId, {
      team_id: teamId,
      table_number: tableNumber,
      team_name: clean(row[2]),
      leader_name: clean(row[3]),
      member2_name: clean(row[4]),
      leader_email: clean(row[5]),
      leader_contact: clean(row[6]),
      attendees: clean(row[7]),
      project_title: clean(row[8]),
      project_theme: clean(row[9]),
      project_link: clean(row[10]),
      pitch_night_marks: cleanNumber(row[11]),
    });
  });

  return { rows: Array.from(byTeamId.values()), errors };
}

export interface GroupedRaipurTeamRow extends ParsedRaipurTeamRow {
  group_number: 1 | 2 | 3 | 4 | 5;
}

/**
 * Sorts by table number ascending and splits into 5 contiguous, evenly
 * sized groups (any remainder goes to the earliest groups). Used for the
 * bulk "Replace team data" import, where table numbers are already
 * assigned (bypassing the registration desk) - unrelated to the
 * (group-1)*10+k formula the registration desk itself uses.
 */
export function assignRaipurGroups(
  rows: ParsedRaipurTeamRow[]
): GroupedRaipurTeamRow[] {
  const sorted = [...rows].sort((a, b) => a.table_number - b.table_number);
  const total = sorted.length;
  const base = Math.floor(total / 5);
  const remainder = total % 5;

  const groupSizes = [0, 1, 2, 3, 4].map((i) => base + (i < remainder ? 1 : 0));

  const grouped: GroupedRaipurTeamRow[] = [];
  let cursor = 0;
  groupSizes.forEach((size, groupIndex) => {
    for (let i = 0; i < size; i++) {
      grouped.push({
        ...sorted[cursor],
        group_number: (groupIndex + 1) as 1 | 2 | 3 | 4 | 5,
      });
      cursor++;
    }
  });

  return grouped;
}
