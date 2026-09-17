"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { TeamCard } from "@/components/TeamCard";
import { useEvaluator } from "@/lib/useEvaluator";
import { groupForEvaluator } from "@/lib/evaluators";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "@/lib/types";

export default function TeamsPage() {
  const evaluatorName = useEvaluator();
  const group = evaluatorName ? groupForEvaluator(evaluatorName) : undefined;

  const [teams, setTeams] = useState<Team[] | null>(null);
  const [scoreByTable, setScoreByTable] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");

  useEffect(() => {
    if (!evaluatorName || !group) return;
    let cancelled = false;

    async function load() {
      const { data: teamRows, error: teamError } = await supabase
        .from("teams")
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
        .from("scores")
        .select("table_number, total")
        .eq("evaluator_name", evaluatorName);

      if (cancelled) return;
      if (!scoreError && scoreRows) {
        const map: Record<number, number> = {};
        scoreRows.forEach((r: any) => {
          map[r.table_number] = r.total;
        });
        setScoreByTable(map);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [evaluatorName, group]);

  const visibleTeams = useMemo(() => {
    if (!teams) return [];
    if (filter === "pending") return teams.filter((t) => !(t.table_number in scoreByTable));
    if (filter === "graded") return teams.filter((t) => t.table_number in scoreByTable);
    return teams;
  }, [teams, scoreByTable, filter]);

  const gradedCount = teams
    ? teams.filter((t) => t.table_number in scoreByTable).length
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} />
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
                    ? "border-lenovo-navy bg-lenovo-navy text-white"
                    : "border-lenovo-line bg-white text-lenovo-muted hover:border-lenovo-navy"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-card border border-lenovo-red/30 bg-lenovo-red/5 p-4 text-sm text-lenovo-red">
            Could not load teams: {error}
          </p>
        ) : null}

        {!teams && !error ? (
          <p className="text-sm text-lenovo-muted">Loading teams...</p>
        ) : null}

        {teams && teams.length === 0 ? (
          <p className="rounded-card border border-dashed border-lenovo-line p-8 text-center text-sm text-lenovo-muted">
            No teams have been imported yet. Ask an organizer to upload the
            team list from the Admin page.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTeams.map((team) => (
            <TeamCard
              key={team.table_number}
              team={team}
              graded={team.table_number in scoreByTable}
              score={scoreByTable[team.table_number]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
