"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { TeamCard } from "@/components/TeamCard";
import { useRaipurEvaluator } from "@/lib/useRaipurEvaluator";
import { raipurGroupForEvaluator } from "@/lib/raipur";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "@/lib/types";

export default function RaipurTeamsPage() {
  const evaluatorName = useRaipurEvaluator();
  const group = evaluatorName ? raipurGroupForEvaluator(evaluatorName) : undefined;

  const [teams, setTeams] = useState<Team[] | null>(null);
  // Raipur matches scores by team_id (table_number isn't unique - two solo
  // teams can share one), unlike every other hackathon here.
  const [scoreByTeam, setScoreByTeam] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");

  useEffect(() => {
    if (!evaluatorName || !group) return;
    let cancelled = false;

    async function load() {
      const { data: teamRows, error: teamError } = await supabase
        .from("raipur_teams")
        .select("*")
        .eq("group_number", group!.groupNumber)
        .order("table_number", { ascending: true });

      if (cancelled) return;
      if (teamError) {
        setError(teamError.message);
        return;
      }
      setTeams(teamRows as Team[]);

      const { data: scoreRows, error: scoreError } = await supabase
        .from("raipur_scores")
        .select("team_id, total")
        .eq("evaluator_name", evaluatorName);

      if (cancelled) return;
      if (!scoreError && scoreRows) {
        const map: Record<string, number> = {};
        scoreRows.forEach((r: any) => {
          map[r.team_id] = r.total;
        });
        setScoreByTeam(map);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [evaluatorName, group]);

  const visibleTeams = useMemo(() => {
    if (!teams) return [];
    if (filter === "pending")
      return teams.filter((t) => !(t.team_id! in scoreByTeam));
    if (filter === "graded")
      return teams.filter((t) => t.team_id! in scoreByTeam);
    return teams;
  }, [teams, scoreByTeam, filter]);

  const gradedCount = teams
    ? teams.filter((t) => t.team_id! in scoreByTeam).length
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} mode="raipur" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
              {group?.label}
            </p>
            <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
              Teams assigned to you
            </h1>
            {teams ? (
              <p className="mt-1 text-sm text-lenovo-muted">
                {gradedCount} of {teams.length} graded
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            {(["all", "pending", "graded"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`touch-target rounded-full border px-4 text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "border-lenovo-red bg-lenovo-red text-white"
                    : "border-lenovo-line bg-white text-lenovo-muted hover:border-lenovo-red"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-4 text-sm text-lenovo-maroon">
            Could not load teams: {error}
          </p>
        ) : null}

        {!teams && !error ? (
          <p className="text-sm text-lenovo-muted">Loading teams...</p>
        ) : null}

        {teams && teams.length === 0 ? (
          <p className="rounded-card border border-dashed border-lenovo-line p-8 text-center text-sm text-lenovo-muted">
            No teams have been imported yet. Ask an organizer to upload the
            team list from the Raipur Admin page.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTeams.map((team) => (
            <TeamCard
              key={team.team_id ?? team.table_number}
              team={team}
              graded={team.team_id! in scoreByTeam}
              href={`/raipur/teams/${team.team_id}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
