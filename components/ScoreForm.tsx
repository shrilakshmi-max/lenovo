"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MAX_CRITERION_SCORE, MAX_TOTAL_SCORE, RUBRIC } from "@/lib/rubric";

const TIMER_SECONDS = 10 * 60;
const ORANGE_AT = 5 * 60;
const RED_AT = 2 * 60;

function formatClock(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timerClasses(secondsLeft: number): string {
  if (secondsLeft <= 0) return "bg-red-600 animate-pulse";
  if (secondsLeft <= RED_AT) return "bg-red-600";
  if (secondsLeft <= ORANGE_AT) return "bg-orange-500";
  return "bg-green-600";
}

/** Two short beeps via Web Audio API - no audio file to bundle, and this
 * only runs after the evaluator has already been tapping the page for
 * ~10 minutes, so autoplay restrictions don't block it. */
function playBuzzer() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const beepAt = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    };
    const now = ctx.currentTime;
    beepAt(now);
    beepAt(now + 0.35);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Ignore - AudioContext unsupported or blocked; the visual timer still works.
  }
}

type Scores = {
  theme_alignment: number;
  innovation: number;
  technical_implementation: number;
  scalability: number;
};

const EMPTY: Scores = {
  theme_alignment: 3,
  innovation: 3,
  technical_implementation: 3,
  scalability: 3,
};

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-card border border-lenovo-line p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-lenovo-ink">{label}</span>
        <span className="w-8 text-center font-display text-xl font-semibold text-lenovo-red">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={MAX_CRITERION_SCORE}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="rubric-slider touch-target mt-3"
      />
      <div className="mt-1 flex justify-between px-1 text-xs text-lenovo-muted">
        {Array.from({ length: MAX_CRITERION_SCORE }, (_, i) => i + 1).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export function ScoreForm({
  matchColumn = "table_number",
  matchValue,
  evaluatorName,
  scoresTable = "scores",
  backHref = "/teams",
}: {
  /** Which column identifies the team in `scoresTable`. Raipur uses
   * "team_id" since its table_number isn't unique (two solo teams can
   * share a table) - every other hackathon matches by table_number. */
  matchColumn?: "table_number" | "team_id";
  matchValue: number | string;
  evaluatorName: string;
  scoresTable?: "scores" | "round2_scores" | "pune_scores" | "raipur_scores";
  backHref?: string;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(EMPTY);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const buzzedRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(TIMER_SECONDS);
    buzzedRef.current = false;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [matchColumn, matchValue]);

  useEffect(() => {
    if (secondsLeft === 0 && !buzzedRef.current) {
      buzzedRef.current = true;
      playBuzzer();
    }
  }, [secondsLeft]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from(scoresTable)
        .select("*")
        .eq(matchColumn, matchValue)
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
        setComment(data.comment ?? "");
        setSavedAt(data.updated_at);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [matchColumn, matchValue, evaluatorName, scoresTable]);

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
        [matchColumn]: matchValue,
        evaluator_name: evaluatorName,
        ...scores,
        comment: comment.trim() || null,
      },
      { onConflict: `${matchColumn},evaluator_name` }
    );
    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSavedAt(new Date().toISOString());
    router.push(backHref);
  }

  const timerBar = (
    <div
      className={`flex items-center justify-between rounded-card px-5 py-3 text-white transition-colors duration-500 ${timerClasses(secondsLeft)}`}
    >
      <span className="text-sm font-medium text-white/90">
        {secondsLeft > 0 ? "Time for this team" : "Time's up"}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums text-white">
        {formatClock(secondsLeft)}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {timerBar}
        <p className="text-sm text-lenovo-muted">Loading your scorecard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timerBar}
      {RUBRIC.map((criterion) => (
        <Slider
          key={criterion.key}
          label={criterion.title}
          value={scores[criterion.key]}
          onChange={(next) =>
            setScores((prev) => ({ ...prev, [criterion.key]: next }))
          }
        />
      ))}

      <div className="flex items-center justify-between rounded-card bg-lenovo-red px-5 py-4">
        <span className="text-sm font-medium text-white/80">Total score</span>
        <span className="font-display text-2xl font-semibold text-white">
          {total} / {MAX_TOTAL_SCORE}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-lenovo-ink">
          Comment <span className="font-normal text-lenovo-muted">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Any notes on this team's pitch or project..."
          className="w-full rounded-lg border border-lenovo-line p-3 text-base focus:border-lenovo-red focus:outline-none"
        />
      </div>

      {error ? (
        <p className="rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
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
