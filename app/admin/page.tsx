"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { useEvaluator } from "@/lib/useEvaluator";

interface ImportResult {
  imported: number;
  removed: number;
  warnings: string[];
}

export default function AdminPage() {
  const evaluatorName = useEvaluator(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setError(null);
    if (!file) {
      setFileName(null);
      setCsvText(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result as string);
    reader.readAsText(file);
  }

  async function submit() {
    if (!csvText) {
      setError("Choose a CSV file first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, csv: csvText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Import failed.");
        return;
      }
      setResult(body);
      setCsvText(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
          Organizer only
        </p>
        <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
          Import team list
        </h1>
        <p className="mt-1 text-sm text-lenovo-muted">
          Upload the team list CSV to replace the current data. The file must
          keep the same column order as the original sheet: Table Number,
          Team ID, Team Name, Team Leader Name, Team Member 2, Team Leader
          Email, Team Leader Contact, Attendees, Project Title, Project
          Theme, Link, Pitch Night Marks.
        </p>

        <div className="mt-6 space-y-4 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
          <div>
            <label className="mb-1 block text-sm font-medium text-lenovo-ink">
              Admin passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-navy focus:outline-none"
              placeholder="Enter passcode"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-lenovo-ink">
              CSV file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileSelected}
              className="block w-full text-sm text-lenovo-muted file:mr-3 file:touch-target file:rounded-full file:border-0 file:bg-lenovo-navy file:px-4 file:text-sm file:font-medium file:text-white hover:file:bg-lenovo-navy-deep"
            />
            {fileName ? (
              <p className="mt-1 text-xs text-lenovo-muted">Selected: {fileName}</p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-card border border-lenovo-red/30 bg-lenovo-red/5 p-3 text-sm text-lenovo-red">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="rounded-card border border-lenovo-navy/20 bg-lenovo-navy/5 p-3 text-sm text-lenovo-navy">
              <p className="font-semibold">
                Imported {result.imported} teams
                {result.removed > 0 ? `, removed ${result.removed} no longer in the file` : ""}.
              </p>
              {result.warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-lenovo-muted">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={submitting}
            className="touch-target w-full rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
          >
            {submitting ? "Importing..." : "Replace team data"}
          </button>
          <p className="text-xs text-lenovo-muted">
            Teams are matched by Table Number. Existing scores for a table
            number are kept when that table number still appears in the new
            file; tables removed from the file are deleted along with their
            scores. Group assignments (1-4) are recalculated from the new
            table numbers, in ascending order.
          </p>
        </div>
      </main>
    </div>
  );
}
