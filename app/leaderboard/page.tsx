"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { useEvaluator } from "@/lib/useEvaluator";
import { supabase } from "@/lib/supabaseClient";
import { LeaderboardRow } from "@/lib/types";

export default function LeaderboardPage() {
  const evaluatorName = useEvaluator(false);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("leaderboard")
        .select("*")
        .order("average_total", { ascending: false, nullsFirst: false });

      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setRows(data as LeaderboardRow[]);
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
            Live standings
          </p>
          <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-lenovo-muted">
            Ranked by average total score across all evaluators. Top 10 teams
            are highlighted.
          </p>
        </div>

        {error ? (
          <p className="rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-4 text-sm text-lenovo-maroon">
            Could not load the leaderboard: {error}
          </p>
        ) : null}

        {!rows && !error ? (
          <p className="text-sm text-lenovo-muted">Loading leaderboard...</p>
        ) : null}

        {rows && rows.length === 0 ? (
          <p className="rounded-card border border-dashed border-lenovo-line p-8 text-center text-sm text-lenovo-muted">
            No teams have been imported yet.
          </p>
        ) : null}

        {rows && rows.length > 0 ? <LeaderboardTable rows={rows} /> : null}
      </main>
    </div>
  );
}
