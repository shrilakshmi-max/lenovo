export interface Team {
  // Always a real number for UP/Pune/Round2. Only null for Raipur's fixed
  // Lab 1 teams (see `location`) - narrow with a local check wherever
  // Raipur data specifically flows through, same as `is_solo` below.
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
  group_number: 1 | 2 | 3 | 4 | 5;
  // Only present on rows from the "teams" table (round 1 / UP). Rows from
  // "pune_teams"/"raipur_teams" don't have this column - it's optional so
  // the same Team type can represent all of them.
  round2_qualified?: boolean;
  // Only present on rows from "raipur_teams" - whether this is a
  // one-person team (which may share its table_number with exactly one
  // other solo team, so table_number isn't unique there).
  is_solo?: boolean;
  // Only present on rows from "raipur_teams" - a fixed seating label
  // (e.g. "Lab 1") that overrides table_number for display, for the
  // handful of special teams judged outside the normal table blocks.
  location?: string | null;
}

export interface Score {
  id: string;
  table_number: number;
  evaluator_name: string;
  theme_alignment: number;
  innovation: number;
  technical_implementation: number;
  scalability: number;
  total: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardRow {
  // See Team.table_number - only null for Raipur's Lab 1 teams.
  table_number: number;
  team_id: string | null;
  team_name: string | null;
  leader_name?: string | null;
  member2_name?: string | null;
  project_title: string | null;
  project_theme: string | null;
  project_link?: string | null;
  group_number?: 1 | 2 | 3 | 4 | 5;
  // Only present on rows from "raipur_leaderboard" - see Team.location.
  location?: string | null;
  evaluations_count: number;
  average_total: number | null;
  avg_theme_alignment: number | null;
  avg_innovation: number | null;
  avg_technical_implementation: number | null;
  avg_scalability: number | null;
}
