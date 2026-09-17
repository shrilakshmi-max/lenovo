import Papa from "papaparse";

export interface ParsedTeamRow {
  table_number: number;
  team_id: string | null;
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

export interface ParseResult {
  rows: ParsedTeamRow[];
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
 * The source sheet only guarantees the first 11 columns (Table Number ..
 * Link if any) plus an optional Pitch Night Marks column; anything after
 * that is leftover pivot-table scratch data from the sheet and is ignored.
 */
export function parseTeamsCsv(csvText: string): ParseResult {
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
  const result: ParsedTeamRow[] = [];
  const seenTableNumbers = new Set<number>();

  dataRows.forEach((row, index) => {
    const csvLineNumber = index + 2; // +1 for header, +1 for 1-based
    const tableNumberRaw = clean(row[0]);
    const tableNumber = tableNumberRaw ? parseInt(tableNumberRaw, 10) : NaN;

    if (!tableNumberRaw || Number.isNaN(tableNumber)) {
      // Rows without a usable table number are not real team rows; skip quietly.
      return;
    }

    if (seenTableNumbers.has(tableNumber)) {
      errors.push(
        `Line ${csvLineNumber}: duplicate Table Number ${tableNumber} - later row overwrote the earlier one.`
      );
    }
    seenTableNumbers.add(tableNumber);

    result.push({
      table_number: tableNumber,
      team_id: clean(row[1]),
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

  return { rows: result, errors };
}

export interface GroupedTeamRow extends ParsedTeamRow {
  group_number: 1 | 2 | 3 | 4;
}

/**
 * Sorts by table number ascending and splits into 4 contiguous, evenly
 * sized groups (any remainder goes to the earliest groups).
 */
export function assignGroups(rows: ParsedTeamRow[]): GroupedTeamRow[] {
  const sorted = [...rows].sort((a, b) => a.table_number - b.table_number);
  const total = sorted.length;
  const base = Math.floor(total / 4);
  const remainder = total % 4;

  const groupSizes = [0, 1, 2, 3].map((i) => base + (i < remainder ? 1 : 0));

  const grouped: GroupedTeamRow[] = [];
  let cursor = 0;
  groupSizes.forEach((size, groupIndex) => {
    for (let i = 0; i < size; i++) {
      grouped.push({
        ...sorted[cursor],
        group_number: (groupIndex + 1) as 1 | 2 | 3 | 4,
      });
      cursor++;
    }
  });

  return grouped;
}
