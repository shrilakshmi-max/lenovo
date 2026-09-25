export interface Team {
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
  group_number: 1 | 2 | 3 | 4;
  // Only present on rows from the "teams" table (round 1 / UP). Rows from
  // "pune_teams" don't have this column - it's optional so the same Team
  // type can represent both.
  round2_qualified?: boolean;
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
  table_number: number;
  team_id: string | null;
  team_name: string | null;
  project_title: string | null;
  project_theme: string | null;
  group_number?: 1 | 2 | 3 | 4;
  evaluations_count: number;
  average_total: number | null;
  avg_theme_alignment: number | null;
  avg_innovation: number | null;
  avg_technical_implementation: number | null;
  avg_scalability: number | null;
}
