"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { RubricReference } from "@/components/RubricReference";
import { ScoreForm } from "@/components/ScoreForm";
import { usePuneEvaluator } from "@/lib/usePuneEvaluator";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "@/lib/types";

export default function PuneTeamGradingPage() {
  const evaluatorName = usePuneEvaluator();
  const params = useParams<{ tableNumber: string }>();
  const tableNumber = Number(params.tableNumber);

  const [team, setTeam] = useState<Team | null | undefined>(undefined);

  useEffect(() => {
    if (!Number.isFinite(tableNumber)) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("pune_teams")
        .select("*")
        .eq("table_number", tableNumber)
        .maybeSingle();
      if (!cancelled) setTeam((data as Team) ?? null);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tableNumber]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} mode="pune" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/pune/teams"
          className="mb-4 inline-block text-sm font-medium text-lenovo-muted hover:text-lenovo-red"
        >
          &larr; Back to my teams
        </Link>

        {team === undefined ? (
          <p className="text-sm text-lenovo-muted">Loading team...</p>
        ) : team === null ? (
          <p className="rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-4 text-sm text-lenovo-maroon">
            No team found for table {tableNumber}.
          </p>
        ) : (
          <>
            <div className="mb-6 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-lenovo-red px-2.5 py-1 text-xs font-semibold text-white">
                  Table {team.table_number}
                </span>
                <RubricReference />
              </div>
              <h1 className="font-display text-xl font-semibold text-lenovo-ink">
                {team.team_name || "Unnamed team"}
              </h1>
              <p className="mt-1 text-sm text-lenovo-muted">
                {team.project_title}
              </p>
              {team.project_theme ? (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-lenovo-purple">
                  {team.project_theme}
                </p>
              ) : null}

              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-lenovo-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-lenovo-muted">Team leader</dt>
                  <dd className="font-medium text-lenovo-ink">{team.leader_name || "-"}</dd>
                </div>
                <div>
                  <dt className="text-lenovo-muted">Team member 2</dt>
                  <dd className="font-medium text-lenovo-ink">{team.member2_name || "-"}</dd>
                </div>
                {team.project_link ? (
                  <div className="sm:col-span-2">
                    <dt className="text-lenovo-muted">Project link</dt>
                    <dd>
                      <a
                        href={team.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-medium text-lenovo-red hover:underline"
                      >
                        {team.project_link}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {evaluatorName ? (
              <ScoreForm
                tableNumber={team.table_number}
                evaluatorName={evaluatorName}
                scoresTable="pune_scores"
                backHref="/pune/teams"
              />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
