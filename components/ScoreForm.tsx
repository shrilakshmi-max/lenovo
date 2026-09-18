"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MAX_CRITERION_SCORE, MAX_TOTAL_SCORE, RUBRIC } from "@/lib/rubric";

type Scores = {
  theme_alignment: number;
  innovation: number;
  technical_implementation: number;
  scalability: number;
};

const EMPTY: Scores = {
  theme_alignment: 5,
  innovation: 5,
  technical_implementation: 5,
  scalability: 5,
};

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-lenovo-line p-3">
      <span className="text-sm font-medium text-lenovo-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="touch-target flex h-11 w-11 items-center justify-center rounded-full border border-lenovo-navy text-lg font-semibold text-lenovo-navy hover:bg-lenovo-navy hover:text-white"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-8 text-center font-display text-xl font-semibold text-lenovo-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(MAX_CRITERION_SCORE, value + 1))}
          className="touch-target flex h-11 w-11 items-center justify-center rounded-full border border-lenovo-navy bg-lenovo-navy text-lg font-semibold text-white hover:bg-lenovo-navy-deep"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ScoreForm({
  tableNumber,
  evaluatorName,
  scoresTable = "scores",
  backHref = "/teams",
}: {
  tableNumber: number;
  evaluatorName: string;
  scoresTable?: "scores" | "round2_scores";
  backHref?: string;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from(scoresTable)
        .select("*")
        .eq("table_number", tableNumber)
        .eq("evaluator_name", evaluatorName)
        .maybeSingle();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setScores({
          theme_alignment: data.theme_alignment,
          innovation: data.innovation,
          technical_implementation: data.technical_implementation,
          scalability: data.scalability,
        });
        setSavedAt(data.updated_at);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tableNumber, evaluatorName, scoresTable]);

  const total =
    scores.theme_alignment +
    scores.innovation +
    scores.technical_implementation +
    scores.scalability;

  async function submit() {
    setSaving(true);
    setError(null);
    const { error: upsertError } = await supabase.from(scoresTable).upsert(
      {
        table_number: tableNumber,
        evaluator_name: evaluatorName,
        ...scores,
      },
      { onConflict: "table_number,evaluator_name" }
    );
    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSavedAt(new Date().toISOString());
    router.push(backHref);
  }

  if (loading) {
    return <p className="text-sm text-lenovo-muted">Loading your scorecard...</p>;
  }

  return (
    <div className="space-y-4">
      {RUBRIC.map((criterion) => (
        <Stepper
          key={criterion.key}
          label={criterion.title}
          value={scores[criterion.key]}
          onChange={(next) =>
            setScores((prev) => ({ ...prev, [criterion.key]: next }))
          }
        />
      ))}

      <div className="flex items-center justify-between rounded-card bg-lenovo-navy px-5 py-4">
        <span className="text-sm font-medium text-white/80">Total score</span>
        <span className="font-display text-2xl font-semibold text-white">
          {total} / {MAX_TOTAL_SCORE}
        </span>
      </div>

      {error ? (
        <p className="rounded-card border border-lenovo-red/30 bg-lenovo-red/5 p-3 text-sm text-lenovo-red">
          {error}
        </p>
      ) : null}

      {savedAt ? (
        <p className="text-xs text-lenovo-muted">
          Last saved {new Date(savedAt).toLocaleString()}
        </p>
      ) : null}

      <button
        onClick={submit}
        disabled={saving}
        className="touch-target w-full rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Submit score"}
      </button>
    </div>
  );
}
