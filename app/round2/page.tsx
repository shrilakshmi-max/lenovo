"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Round2EvaluatorPicker } from "@/components/Round2EvaluatorPicker";
import { loadRound2Evaluator } from "@/lib/round2";
import { supabase } from "@/lib/supabaseClient";

export default function Round2Page() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [started, setStarted] = useState(false);

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadRound2Evaluator()) {
      router.replace("/round2/teams");
      return;
    }

    let cancelled = false;
    async function checkStarted() {
      const { data } = await supabase
        .from("teams")
        .select("table_number")
        .eq("round2_qualified", true)
        .limit(1);
      if (cancelled) return;
      setStarted((data?.length ?? 0) > 0);
      setChecking(false);
    }
    checkStarted();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function beginRound2() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/round2/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Could not begin round 2.");
        return;
      }
      setStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not begin round 2.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header mode="round2" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
            Lenovo LEAP Hackathon 2026 - Round 2
          </p>
          <h1 className="font-display text-2xl font-semibold text-lenovo-ink sm:text-3xl">
            {checking
              ? "Checking round 2 status..."
              : started
              ? "Select your name to begin judging"
              : "Round 2 has not started yet"}
          </h1>
          {started ? (
            <p className="mx-auto mt-2 max-w-md text-sm text-lenovo-muted">
              Your selection is remembered on this device. All 20 round 2
              teams are assigned to every evaluator.
            </p>
          ) : null}
        </div>

        {checking ? null : started ? (
          <Round2EvaluatorPicker />
        ) : (
          <div className="mx-auto w-full max-w-md rounded-card border border-lenovo-line bg-white p-5 shadow-card">
            <p className="text-sm text-lenovo-muted">
              This selects the top 20 teams from the round 1 leaderboard and
              opens round 2 for judging. It can only be done once.
            </p>

            <label className="mb-1 mt-4 block text-sm font-medium text-lenovo-ink">
              Admin passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-navy focus:outline-none"
              placeholder="Enter passcode"
            />

            {error ? (
              <p className="mt-3 rounded-card border border-lenovo-red/30 bg-lenovo-red/5 p-3 text-sm text-lenovo-red">
                {error}
              </p>
            ) : null}

            <button
              onClick={beginRound2}
              disabled={submitting}
              className="touch-target mt-4 w-full rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
            >
              {submitting ? "Starting..." : "Begin Round 2"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
