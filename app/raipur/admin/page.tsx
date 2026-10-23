"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { useRaipurEvaluator } from "@/lib/useRaipurEvaluator";
import { RAIPUR_EVALUATOR_GROUPS } from "@/lib/raipur";
import { supabase } from "@/lib/supabaseClient";

interface ImportResult {
  imported: number;
  warnings: string[];
}

interface ClearResult {
  removed: number;
}

interface TeamRow {
  team_id: string;
  team_name: string | null;
  table_number: number | null;
  location: string | null;
  group_number: number;
}

interface TeamEdit {
  // Either a plain table number or a text location ("Lab 1") typed into
  // the same cell - whichever the admin's last edit resolved to.
  field: string;
  groupNumber: number;
}

export default function RaipurAdminPage() {
  const evaluatorName = useRaipurEvaluator(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rosterFileInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearResult, setClearResult] = useState<ClearResult | null>(null);

  const [rosterFileName, setRosterFileName] = useState<string | null>(null);
  const [rosterCsvText, setRosterCsvText] = useState<string | null>(null);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterResult, setRosterResult] = useState<ImportResult | null>(null);

  const [rosterClearing, setRosterClearing] = useState(false);
  const [rosterClearError, setRosterClearError] = useState<string | null>(null);
  const [rosterClearResult, setRosterClearResult] = useState<ClearResult | null>(null);

  const [teams, setTeams] = useState<TeamRow[] | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, TeamEdit>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [rowSaved, setRowSaved] = useState<Record<string, boolean>>({});

  function fieldForTeam(t: TeamRow): string {
    return t.table_number != null ? String(t.table_number) : t.location ?? "";
  }

  async function loadTeams() {
    setTeamsLoading(true);
    setTeamsError(null);
    const { data, error } = await supabase
      .from("raipur_teams")
      .select("team_id, team_name, table_number, location, group_number")
      .order("team_id", { ascending: true });

    if (error) {
      setTeamsError(error.message);
      setTeamsLoading(false);
      return;
    }
    const rows = (data as TeamRow[]) ?? [];
    setTeams(rows);
    setEdits(
      rows.reduce<Record<string, TeamEdit>>((acc, t) => {
        acc[t.team_id] = { field: fieldForTeam(t), groupNumber: t.group_number };
        return acc;
      }, {})
    );
    setTeamsLoading(false);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.team_id.toLowerCase().includes(q) ||
        (t.team_name ?? "").toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  async function saveTeamRow(teamId: string) {
    const draft = edits[teamId];
    if (!draft) return;

    if (!password) {
      setRowErrors((prev) => ({ ...prev, [teamId]: "Enter the admin passcode first." }));
      return;
    }
    const trimmed = draft.field.trim();
    if (!trimmed) {
      setRowErrors((prev) => ({ ...prev, [teamId]: "Enter a table number or a location." }));
      return;
    }
    const isNumeric = /^\d+$/.test(trimmed);
    const tableNumber = isNumeric ? Number(trimmed) : null;
    const location = isNumeric ? null : trimmed;

    setSavingTeamId(teamId);
    setRowErrors((prev) => ({ ...prev, [teamId]: "" }));
    setRowSaved((prev) => ({ ...prev, [teamId]: false }));

    try {
      const res = await fetch("/api/raipur/teams/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          teamId,
          tableNumber,
          location,
          groupNumber: draft.groupNumber,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [teamId]: body.error || "Save failed." }));
        return;
      }
      setTeams((prev) =>
        prev
          ? prev.map((t) =>
              t.team_id === teamId
                ? { ...t, table_number: tableNumber, location, group_number: draft.groupNumber }
                : t
            )
          : prev
      );
      setRowSaved((prev) => ({ ...prev, [teamId]: true }));
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [teamId]: err instanceof Error ? err.message : "Save failed.",
      }));
    } finally {
      setSavingTeamId(null);
    }
  }

  async function deleteTeamRow(teamId: string) {
    if (!password) {
      setRowErrors((prev) => ({ ...prev, [teamId]: "Enter the admin passcode first." }));
      return;
    }
    if (
      !window.confirm(
        `Delete team ${teamId}? This removes the team and all of its scores, and lets it be registered again from the desk. There is no undo.`
      )
    ) {
      return;
    }

    setDeletingTeamId(teamId);
    setRowErrors((prev) => ({ ...prev, [teamId]: "" }));

    try {
      const res = await fetch("/api/raipur/teams/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, teamId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [teamId]: body.error || "Delete failed." }));
        return;
      }
      setTeams((prev) => (prev ? prev.filter((t) => t.team_id !== teamId) : prev));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [teamId]: err instanceof Error ? err.message : "Delete failed.",
      }));
    } finally {
      setDeletingTeamId(null);
    }
  }

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

  function onRosterFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setRosterResult(null);
    setRosterError(null);
    if (!file) {
      setRosterFileName(null);
      setRosterCsvText(null);
      return;
    }
    setRosterFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRosterCsvText(reader.result as string);
    reader.readAsText(file);
  }

  async function submitRosterImport() {
    if (!rosterCsvText) {
      setRosterError("Choose a CSV file first.");
      return;
    }
    setRosterImporting(true);
    setRosterError(null);
    setRosterResult(null);

    try {
      const res = await fetch("/api/raipur/roster/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, csv: rosterCsvText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setRosterError(body.error || "Import failed.");
        return;
      }
      setRosterResult(body);
      setRosterCsvText(null);
      setRosterFileName(null);
      if (rosterFileInputRef.current) rosterFileInputRef.current.value = "";
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setRosterImporting(false);
    }
  }

  async function submitRosterClear() {
    if (!password) {
      setRosterClearError("Enter the admin passcode first.");
      return;
    }
    if (
      !window.confirm(
        "This permanently deletes the entire pre-registration roster (both registered and not-yet-registered entries). Teams already registered stay registered in raipur_teams - this only clears the lookup list. There is no undo. Continue?"
      )
    ) {
      return;
    }

    setRosterClearing(true);
    setRosterClearError(null);
    setRosterClearResult(null);

    try {
      const res = await fetch("/api/raipur/roster/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setRosterClearError(body.error || "Clearing the roster failed.");
        return;
      }
      setRosterClearResult(body);
    } catch (err) {
      setRosterClearError(err instanceof Error ? err.message : "Clearing the roster failed.");
    } finally {
      setRosterClearing(false);
    }
  }

  async function submitImport() {
    if (!csvText) {
      setImportError("Choose a CSV file first.");
      return;
    }
    if (
      !window.confirm(
        "This deletes every existing Raipur team and score, then loads the new file. This cannot be undone. Continue?"
      )
    ) {
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch("/api/raipur/import", {
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
        "This permanently deletes every Raipur team and every Raipur score. There is no undo. Continue?"
      )
    ) {
      return;
    }

    setClearing(true);
    setClearError(null);
    setClearResult(null);

    try {
      const res = await fetch("/api/raipur/clear", {
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
      <Header evaluatorName={evaluatorName} mode="raipur" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
          Organizer only - Raipur
        </p>
        <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
          Manage Raipur team data
        </h1>
        <p className="mt-1 text-sm text-lenovo-muted">
          This only affects the Raipur hackathon's data - it never touches
          the UP or Pune team lists or scores.
        </p>

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
            Used to authorize the actions below.
          </p>
        </div>

        <div className="mt-4 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-lenovo-ink">
            Import pre-registration roster
          </h2>
          <p className="mt-1 text-sm text-lenovo-muted">
            Upload the team roster before check-in starts, so the{" "}
            <a href="/raipur/register" className="font-medium text-lenovo-red hover:underline">
              registration desk
            </a>{" "}
            can look teams up by Team ID. Same columns as the team list, but
            with no Table Number column: Team ID, Team Name, Team Leader
            Name, Team Member 2, Team Leader Email, Team Leader Contact,
            Attendees, Project Title, Project Theme, Link, Pitch Night
            Marks.
          </p>

          <div className="mt-4">
            <input
              ref={rosterFileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onRosterFileSelected}
              className="block w-full text-sm text-lenovo-muted file:mr-3 file:touch-target file:rounded-full file:border-0 file:bg-lenovo-purple file:px-4 file:text-sm file:font-medium file:text-white hover:file:bg-lenovo-purple-dark"
            />
            {rosterFileName ? (
              <p className="mt-1 text-xs text-lenovo-muted">Selected: {rosterFileName}</p>
            ) : null}
          </div>

          {rosterError ? (
            <p className="mt-3 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
              {rosterError}
            </p>
          ) : null}

          {rosterResult ? (
            <div className="mt-3 rounded-card border border-lenovo-success/30 bg-lenovo-success/5 p-3 text-sm text-lenovo-success">
              <p className="font-semibold">
                Loaded {rosterResult.imported} teams into the roster.
              </p>
              {rosterResult.warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-lenovo-muted">
                  {rosterResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            onClick={submitRosterImport}
            disabled={rosterImporting}
            className="touch-target mt-4 w-full rounded-full bg-lenovo-purple px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-purple-dark disabled:opacity-60"
          >
            {rosterImporting ? "Importing..." : "Import roster"}
          </button>
          <p className="mt-2 text-xs text-lenovo-muted">
            Safe to re-upload with corrections - re-importing updates a
            team's details by Team ID without affecting whether they've
            already registered.
          </p>

          {rosterClearError ? (
            <p className="mt-3 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
              {rosterClearError}
            </p>
          ) : null}

          {rosterClearResult ? (
            <p className="mt-3 rounded-card border border-lenovo-success/30 bg-lenovo-success/5 p-3 text-sm text-lenovo-success">
              Removed {rosterClearResult.removed} roster entries.
            </p>
          ) : null}

          <button
            onClick={submitRosterClear}
            disabled={rosterClearing}
            className="touch-target mt-3 w-full rounded-full border-2 border-lenovo-maroon px-6 py-3.5 text-base font-semibold text-lenovo-maroon transition-colors hover:bg-lenovo-maroon hover:text-white disabled:opacity-60"
          >
            {rosterClearing ? "Clearing..." : "Clear roster"}
          </button>
          <p className="mt-2 text-xs text-lenovo-muted">
            Deletes the whole pending-roster list. Does not touch
            raipur_teams/raipur_scores - teams already registered stay
            registered, they just won't be re-checkable by Team ID unless
            re-imported. Re-importing the roster after this will let an
            already-registered Team ID be looked up again, so only clear
            once check-in is fully done, or right before a fresh roster
            upload.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-card border border-lenovo-line bg-white p-5 shadow-card">
            <h2 className="font-display text-base font-semibold text-lenovo-ink">
              Replace Raipur team data
            </h2>
            <p className="mt-1 text-sm text-lenovo-muted">
              For loading a complete team list that already has table
              numbers assigned (bypassing the registration desk). Same
              column order as the original sheet: Table Number, Team ID,
              Team Name, Team Leader Name, Team Member 2, Team Leader
              Email, Team Leader Contact, Attendees, Project Title, Project
              Theme, Link, Pitch Night Marks. Rows are matched by Team ID
              (not Table Number), since two one-person teams can share a
              table.
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
                  Imported {importResult.imported} teams. All previous
                  Raipur teams and scores were removed first.
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
              Deletes every existing Raipur team and score, then loads the
              file. Group assignments (1-5) are recalculated from the new
              table numbers, in ascending order.
            </p>
          </div>

          <div className="flex flex-col rounded-card border border-lenovo-maroon/30 bg-white p-5 shadow-card">
            <h2 className="font-display text-base font-semibold text-lenovo-maroon">
              Clear all Raipur data
            </h2>
            <p className="mt-1 text-sm text-lenovo-muted">
              Permanently deletes every Raipur team and every Raipur score,
              without loading a replacement file. Does not touch the
              roster.
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

        <div className="mt-4 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-lenovo-ink">
                Edit a team's table &amp; evaluator group
              </h2>
              <p className="mt-1 text-sm text-lenovo-muted">
                Correct one team at a time after the registration desk has
                assigned it. The table/location cell accepts either a plain
                number (e.g. <code>7</code>) or a text location (e.g.{" "}
                <code>Lab 1</code>).
              </p>
            </div>
            <button
              onClick={loadTeams}
              disabled={teamsLoading}
              className="touch-target rounded-full border border-lenovo-line px-4 text-sm font-medium text-lenovo-muted hover:border-lenovo-red hover:text-lenovo-red disabled:opacity-60"
            >
              {teamsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <input
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            placeholder="Filter by Team ID or team name..."
            className="touch-target mt-4 w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
          />

          {teamsError ? (
            <p className="mt-3 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
              Could not load teams: {teamsError}
            </p>
          ) : null}

          {!teams && teamsLoading ? (
            <p className="mt-3 text-sm text-lenovo-muted">Loading teams...</p>
          ) : null}

          {teams && teams.length === 0 ? (
            <p className="mt-3 text-sm text-lenovo-muted">
              No teams have been registered yet.
            </p>
          ) : null}

          {teams && teams.length > 0 ? (
            <div className="mt-4 -mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-lenovo-line text-xs uppercase tracking-wide text-lenovo-muted">
                    <th className="whitespace-nowrap py-2 pr-3 font-semibold">Team ID</th>
                    <th className="py-2 pr-3 font-semibold">Team name</th>
                    <th className="whitespace-nowrap py-2 pr-3 font-semibold">Table / location</th>
                    <th className="whitespace-nowrap py-2 pr-3 font-semibold">Evaluator group</th>
                    <th className="whitespace-nowrap py-2 pr-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((t) => {
                    const draft = edits[t.team_id] ?? {
                      field: fieldForTeam(t),
                      groupNumber: t.group_number,
                    };
                    const dirty =
                      draft.field !== fieldForTeam(t) || draft.groupNumber !== t.group_number;
                    return (
                      <tr key={t.team_id} className="border-b border-lenovo-line">
                        <td className="whitespace-nowrap py-2 pr-3 font-medium text-lenovo-ink">
                          {t.team_id}
                        </td>
                        <td className="py-2 pr-3 text-lenovo-muted">
                          {t.team_name || "Unnamed team"}
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            value={draft.field}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [t.team_id]: { ...draft, field: e.target.value },
                              }))
                            }
                            className="touch-target w-28 rounded-lg border border-lenovo-line px-2 text-sm focus:border-lenovo-red focus:outline-none"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={draft.groupNumber}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [t.team_id]: { ...draft, groupNumber: Number(e.target.value) },
                              }))
                            }
                            className="touch-target rounded-lg border border-lenovo-line bg-white px-2 text-sm focus:border-lenovo-red focus:outline-none"
                          >
                            {RAIPUR_EVALUATOR_GROUPS.map((g) => (
                              <option key={g.groupNumber} value={g.groupNumber}>
                                {g.label} - {g.evaluators.join(" & ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveTeamRow(t.team_id)}
                              disabled={!dirty || savingTeamId === t.team_id}
                              className="touch-target rounded-full bg-lenovo-red px-4 text-sm font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-40"
                            >
                              {savingTeamId === t.team_id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => deleteTeamRow(t.team_id)}
                              disabled={deletingTeamId === t.team_id}
                              className="touch-target rounded-full border-2 border-lenovo-maroon px-4 text-sm font-semibold text-lenovo-maroon transition-colors hover:bg-lenovo-maroon hover:text-white disabled:opacity-40"
                            >
                              {deletingTeamId === t.team_id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                          {rowErrors[t.team_id] ? (
                            <p className="mt-1 text-xs text-lenovo-maroon">{rowErrors[t.team_id]}</p>
                          ) : rowSaved[t.team_id] && !dirty ? (
                            <p className="mt-1 text-xs text-lenovo-success">Saved</p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
