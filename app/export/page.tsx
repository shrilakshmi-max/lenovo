"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { downloadCsv, rowsToCsv } from "@/lib/csvExport";
import { LeaderboardRow } from "@/lib/types";

const HEADERS = ["Rank", "Team Name", "Students", "Project Name", "Project Theme", "Project Link"];

function studentsFor(row: LeaderboardRow): string {
  return [row.leader_name, row.member2_name].filter(Boolean).join(", ");
}

function toCsvRows(rows: LeaderboardRow[]): string[][] {
  return rows.map((row, index) => [
    String(index + 1),
    row.team_name ?? "",
    studentsFor(row),
    row.project_title ?? "",
    row.project_theme ?? "",
    row.project_link ?? "",
  ]);
}

interface HackathonExport {
  label: string;
  view: "leaderboard" | "pune_leaderboard" | "raipur_leaderboard";
  filename: string;
}

const HACKATHONS: HackathonExport[] = [
  { label: "UP (Lucknow)", view: "leaderboard", filename: "up-leaderboard.csv" },
  { label: "Pune", view: "pune_leaderboard", filename: "pune-leaderboard.csv" },
  { label: "Raipur", view: "raipur_leaderboard", filename: "raipur-leaderboard.csv" },
];

export default function ExportPage() {
  const [rowsByView, setRowsByView] = useState<Record<string, LeaderboardRow[] | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      for (const hackathon of HACKATHONS) {
        const { data, error } = await supabase
          .from(hackathon.view)
          .select("*")
          .order("average_total", { ascending: false, nullsFirst: false });

        if (cancelled) return;
        if (error) {
          setErrors((prev) => ({ ...prev, [hackathon.view]: error.message }));
        } else {
          setRowsByView((prev) => ({ ...prev, [hackathon.view]: data as LeaderboardRow[] }));
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDownload(hackathon: HackathonExport) {
    const rows = rowsByView[hackathon.view];
    if (!rows) return;
    const csv = rowsToCsv(HEADERS, toCsvRows(rows));
    downloadCsv(hackathon.filename, csv);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header mode="raipur" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
          Results export
        </p>
        <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
          Download leaderboard CSV
        </h1>
        <p className="mt-1 text-sm text-lenovo-muted">
          Each file is ranked by average score and includes team name,
          students, project name, project theme, and project link.
        </p>

        <div className="mt-6 space-y-4">
          {HACKATHONS.map((hackathon) => {
            const rows = rowsByView[hackathon.view];
            const error = errors[hackathon.view];
            return (
              <div
                key={hackathon.view}
                className="flex flex-col justify-between gap-3 rounded-card border border-lenovo-line bg-white p-5 shadow-card sm:flex-row sm:items-center"
              >
                <div>
                  <h2 className="font-display text-base font-semibold text-lenovo-ink">
                    {hackathon.label}
                  </h2>
                  {error ? (
                    <p className="mt-1 text-sm text-lenovo-maroon">
                      Could not load: {error}
                    </p>
                  ) : rows ? (
                    <p className="mt-1 text-sm text-lenovo-muted">
                      {rows.length} team{rows.length === 1 ? "" : "s"}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-lenovo-muted">Loading...</p>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(hackathon)}
                  disabled={!rows || rows.length === 0}
                  className="touch-target rounded-full bg-lenovo-red px-6 text-sm font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
                >
                  Download CSV
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
