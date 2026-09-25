import Papa from "papaparse";

export interface ParsedRosterRow {
  team_id: string;
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

export interface RosterParseResult {
  rows: ParsedRosterRow[];
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
 * Same column layout as the main team-list sheet, minus the leading Table
 * Number column (teams aren't assigned a table until they register at the
 * desk): Team ID, Team Name, Team Leader Name, Team Member 2, Team Leader
 * Email, Team Leader Contact, Attendees, Project Title, Project Theme,
 * Link, Pitch Night Marks.
 */
export function parseRosterCsv(csvText: string): RosterParseResult {
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
  const byTeamId = new Map<string, ParsedRosterRow>();

  dataRows.forEach((row, index) => {
    const csvLineNumber = index + 2; // +1 for header, +1 for 1-based
    const teamId = clean(row[0]);

    if (!teamId) {
      // Rows without a usable Team ID are not real team rows; skip quietly.
      return;
    }

    if (byTeamId.has(teamId)) {
      errors.push(
        `Line ${csvLineNumber}: duplicate Team ID ${teamId} - this row overwrote the earlier one.`
      );
    }

    byTeamId.set(teamId, {
      team_id: teamId,
      team_name: clean(row[1]),
      leader_name: clean(row[2]),
      member2_name: clean(row[3]),
      leader_email: clean(row[4]),
      leader_contact: clean(row[5]),
      attendees: clean(row[6]),
      project_title: clean(row[7]),
      project_theme: clean(row[8]),
      project_link: clean(row[9]),
      pitch_night_marks: cleanNumber(row[10]),
    });
  });

  return { rows: Array.from(byTeamId.values()), errors };
}
