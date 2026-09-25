"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { useEvaluator } from "@/lib/useEvaluator";

interface ImportResult {
  imported: number;
  warnings: string[];
}

interface ClearResult {
  removed: number;
}

export default function AdminPage() {
  const evaluatorName = useEvaluator(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearResult, setClearResult] = useState<ClearResult | null>(null);

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImportResult(null);
    setImportError(null);
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

  async function submitImport() {
    if (!csvText) {
      setImportError("Choose a CSV file first.");
      return;
    }
    if (
      !window.confirm(
        "This deletes every existing team and score, then loads the new file. This cannot be undone. Continue?"
      )
    ) {
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, csv: csvText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setImportError(body.error || "Import failed.");
        return;
      }
      setImportResult(body);
      setCsvText(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function submitClear() {
    if (!password) {
      setClearError("Enter the admin passcode first.");
      return;
    }
    if (
      !window.confirm(
        "This permanently deletes every team and every score. There is no undo. Continue?"
      )
    ) {
      return;
    }

    setClearing(true);
    setClearError(null);
    setClearResult(null);

    try {
      const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setClearError(body.error || "Clearing data failed.");
        return;
      }
      setClearResult(body);
    } catch (err) {
      setClearError(err instanceof Error ? err.message : "Clearing data failed.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header evaluatorName={evaluatorName} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
          Organizer only
        </p>
        <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
          Manage team data
        </h1>

        <div className="mt-6 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
          <label className="mb-1 block text-sm font-medium text-lenovo-ink">
            Admin passcode
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="touch-target w-full max-w-xs rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
            placeholder="Enter passcode"
          />
          <p className="mt-2 text-xs text-lenovo-muted">
            Used to authorize both actions below.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-card border border-lenovo-line bg-white p-5 shadow-card">
            <h2 className="font-display text-base font-semibold text-lenovo-ink">
              Replace team data
            </h2>
            <p className="mt-1 text-sm text-lenovo-muted">
              Upload a CSV in the same column order as the original sheet:
              Table Number, Team ID, Team Name, Team Leader Name, Team
              Member 2, Team Leader Email, Team Leader Contact, Attendees,
              Project Title, Project Theme, Link, Pitch Night Marks.
            </p>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileSelected}
                className="block w-full text-sm text-lenovo-muted file:mr-3 file:touch-target file:rounded-full file:border-0 file:bg-lenovo-red file:px-4 file:text-sm file:font-medium file:text-white hover:file:bg-lenovo-red-dark"
              />
              {fileName ? (
                <p className="mt-1 text-xs text-lenovo-muted">Selected: {fileName}</p>
              ) : null}
            </div>

            {importError ? (
              <p className="mt-3 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
                {importError}
              </p>
            ) : null}

            {importResult ? (
              <div className="mt-3 rounded-card border border-lenovo-success/30 bg-lenovo-success/5 p-3 text-sm text-lenovo-success">
                <p className="font-semibold">
                  Imported {importResult.imported} teams. All previous teams
                  and scores were removed first.
                </p>
                {importResult.warnings.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-lenovo-muted">
                    {importResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={submitImport}
              disabled={importing}
              className="touch-target mt-4 w-full rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
            >
              {importing ? "Importing..." : "Delete all and import CSV"}
            </button>
            <p className="mt-2 text-xs text-lenovo-muted">
              Deletes every existing team and score, then loads the file.
              Group assignments (1-4) are recalculated from the new table
              numbers, in ascending order.
            </p>
          </div>

          <div className="flex flex-col rounded-card border border-lenovo-maroon/30 bg-white p-5 shadow-card">
            <h2 className="font-display text-base font-semibold text-lenovo-maroon">
              Clear all data
            </h2>
            <p className="mt-1 text-sm text-lenovo-muted">
              Permanently deletes every team and every score, without
              loading a replacement file. Use this to reset before a fresh
              CSV import, or to wipe the event data afterward.
            </p>

            {clearError ? (
              <p className="mt-3 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
                {clearError}
              </p>
            ) : null}

            {clearResult ? (
              <p className="mt-3 rounded-card border border-lenovo-success/30 bg-lenovo-success/5 p-3 text-sm text-lenovo-success">
                Removed {clearResult.removed} teams and all of their scores.
              </p>
            ) : null}

            <button
              onClick={submitClear}
              disabled={clearing}
              className="touch-target mt-auto w-full rounded-full border-2 border-lenovo-maroon px-6 py-3.5 text-base font-semibold text-lenovo-maroon transition-colors hover:bg-lenovo-maroon hover:text-white disabled:opacity-60"
            >
              {clearing ? "Clearing..." : "Delete all data"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
