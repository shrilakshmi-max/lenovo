"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { PUNE_THEMES } from "@/lib/themes";

interface RosterEntry {
  team_id: string;
  team_name: string | null;
  leader_name: string | null;
  member2_name: string | null;
  leader_email: string | null;
  leader_contact: string | null;
  attendees: string | null;
  project_title: string | null;
  project_theme: string | null;
  project_link: string | null;
  pitch_night_marks: number | null;
}

interface Confirmation {
  teamId: string;
  tableNumber: number;
  groupNumber: number;
  projectTheme: string | null;
}

interface NewTeamForm {
  teamName: string;
  leaderName: string;
  member2Name: string;
  leaderEmail: string;
  leaderContact: string;
  projectTitle: string;
  projectTheme: string;
  projectLink: string;
}

const EMPTY_NEW_TEAM: NewTeamForm = {
  teamName: "",
  leaderName: "",
  member2Name: "",
  leaderEmail: "",
  leaderContact: "",
  projectTitle: "",
  projectTheme: "",
  projectLink: "",
};

export default function PuneRegisterPage() {
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<RosterEntry | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeam, setNewTeam] = useState<NewTeamForm>(EMPTY_NEW_TEAM);
  const [newTeamSubmitting, setNewTeamSubmitting] = useState(false);
  const [newTeamError, setNewTeamError] = useState<string | null>(null);

  async function loadRoster() {
    const { data, error } = await supabase
      .from("pune_roster")
      .select(
        "team_id, team_name, leader_name, member2_name, leader_email, leader_contact, attendees, project_title, project_theme, project_link, pitch_night_marks"
      )
      .eq("registered", false)
      .order("team_id", { ascending: true });

    if (error) {
      setLoadError(error.message);
      return;
    }
    setRoster((data as RosterEntry[]) ?? []);
  }

  useEffect(() => {
    loadRoster();
  }, []);

  const matches = useMemo(() => {
    if (!roster) return [];
    const q = query.trim().toLowerCase();
    if (!q) return roster.slice(0, 8);
    return roster
      .filter((r) => r.team_id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [roster, query]);

  function selectTeam(entry: RosterEntry) {
    setSelected(entry);
    setQuery(entry.team_id);
    setDropdownOpen(false);
    setSubmitError(null);
    setConfirmation(null);
    setEditingName(false);
    setNameError(null);
  }

  function resetForm() {
    setSelected(null);
    setQuery("");
    setSubmitError(null);
    setConfirmation(null);
    setEditingName(false);
    setNameError(null);
    setShowNewTeamForm(false);
    setNewTeam(EMPTY_NEW_TEAM);
    setNewTeamError(null);
  }

  function openNewTeamForm() {
    setSelected(null);
    setQuery("");
    setDropdownOpen(false);
    setSubmitError(null);
    setConfirmation(null);
    setNewTeam(EMPTY_NEW_TEAM);
    setNewTeamError(null);
    setShowNewTeamForm(true);
  }

  function startEditName() {
    if (!selected) return;
    setNameDraft(selected.team_name ?? "");
    setNameError(null);
    setEditingName(true);
  }

  async function saveName() {
    if (!selected) return;
    if (!nameDraft.trim()) {
      setNameError("Team name can't be empty.");
      return;
    }
    setSavingName(true);
    setNameError(null);

    try {
      const res = await fetch("/api/pune/roster/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selected.team_id, teamName: nameDraft }),
      });
      const body = await res.json();
      if (!res.ok) {
        setNameError(body.error || "Could not save the name.");
        return;
      }
      const updatedName = body.team_name as string;
      setSelected((prev) => (prev ? { ...prev, team_name: updatedName } : prev));
      setRoster((prev) =>
        prev
          ? prev.map((r) =>
              r.team_id === selected.team_id ? { ...r, team_name: updatedName } : r
            )
          : prev
      );
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save the name.");
    } finally {
      setSavingName(false);
    }
  }

  async function submitRegister() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);

    try {
      const res = await fetch("/api/pune/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selected.team_id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSubmitError(body.error || "Registration failed.");
        return;
      }
      setConfirmation({
        teamId: selected.team_id,
        tableNumber: body.tableNumber,
        groupNumber: body.groupNumber,
        projectTheme: selected.project_theme,
      });
      await loadRoster();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewTeam() {
    if (!newTeam.leaderName.trim()) {
      setNewTeamError("Team leader name is required.");
      return;
    }
    if (!newTeam.projectTheme) {
      setNewTeamError("Pick a project theme.");
      return;
    }
    setNewTeamSubmitting(true);
    setNewTeamError(null);

    try {
      const res = await fetch("/api/pune/register-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: newTeam.teamName,
          leaderName: newTeam.leaderName,
          member2Name: newTeam.member2Name,
          leaderEmail: newTeam.leaderEmail,
          leaderContact: newTeam.leaderContact,
          projectTitle: newTeam.projectTitle,
          projectTheme: newTeam.projectTheme,
          projectLink: newTeam.projectLink,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setNewTeamError(body.error || "Registration failed.");
        return;
      }
      setShowNewTeamForm(false);
      setConfirmation({
        teamId: body.teamId,
        tableNumber: body.tableNumber,
        groupNumber: body.groupNumber,
        projectTheme: newTeam.projectTheme,
      });
      setNewTeam(EMPTY_NEW_TEAM);
      await loadRoster();
    } catch (err) {
      setNewTeamError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setNewTeamSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header mode="pune" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
          Registration desk - Pune
        </p>
        <h1 className="font-display text-2xl font-semibold text-lenovo-ink">
          Register a team
        </h1>
        <p className="mt-1 text-sm text-lenovo-muted">
          Ask the team for their Team ID, find it below, confirm the details
          match, then press Register to assign them a table.
        </p>

        {loadError ? (
          <p className="mt-4 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-4 text-sm text-lenovo-maroon">
            Could not load the roster: {loadError}
          </p>
        ) : null}

        {confirmation ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-card border border-lenovo-success bg-lenovo-success p-6 text-center shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Registered - send them to
              </p>
              <p className="mt-1 font-display text-5xl font-bold text-white">
                Table {confirmation.tableNumber}
              </p>
              <p className="mt-2 text-sm text-white/80">
                Evaluator group {confirmation.groupNumber}
              </p>
            </div>

            <div className="rounded-card border border-lenovo-red bg-lenovo-red p-6 text-center shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Give them the theme placard for
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {confirmation.teamId}
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {confirmation.projectTheme || "No theme on file"}
              </p>
            </div>

            <button
              onClick={resetForm}
              className="touch-target w-full rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark"
            >
              Register next team
            </button>
          </div>
        ) : showNewTeamForm ? (
          <div className="mt-6 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-lenovo-ink">
                Add a new team
              </h2>
              <button
                onClick={resetForm}
                className="text-xs font-medium text-lenovo-muted hover:text-lenovo-red"
              >
                Go back
              </button>
            </div>
            <p className="mb-4 text-sm text-lenovo-muted">
              For a team that never made it onto the roster. A unique Team ID
              is generated automatically.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Team leader name <span className="text-lenovo-maroon">*</span>
                </label>
                <input
                  value={newTeam.leaderName}
                  onChange={(e) => setNewTeam((t) => ({ ...t, leaderName: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Team member 2 <span className="font-normal text-lenovo-muted">(leave blank if solo)</span>
                </label>
                <input
                  value={newTeam.member2Name}
                  onChange={(e) => setNewTeam((t) => ({ ...t, member2Name: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Team name <span className="font-normal text-lenovo-muted">(optional)</span>
                </label>
                <input
                  value={newTeam.teamName}
                  onChange={(e) => setNewTeam((t) => ({ ...t, teamName: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                    Leader email <span className="font-normal text-lenovo-muted">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newTeam.leaderEmail}
                    onChange={(e) => setNewTeam((t) => ({ ...t, leaderEmail: e.target.value }))}
                    className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                    Leader contact <span className="font-normal text-lenovo-muted">(optional)</span>
                  </label>
                  <input
                    value={newTeam.leaderContact}
                    onChange={(e) => setNewTeam((t) => ({ ...t, leaderContact: e.target.value }))}
                    className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Project title <span className="font-normal text-lenovo-muted">(optional)</span>
                </label>
                <input
                  value={newTeam.projectTitle}
                  onChange={(e) => setNewTeam((t) => ({ ...t, projectTitle: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Project theme <span className="text-lenovo-maroon">*</span>
                </label>
                <select
                  value={newTeam.projectTheme}
                  onChange={(e) => setNewTeam((t) => ({ ...t, projectTheme: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line bg-white px-3 text-base focus:border-lenovo-red focus:outline-none"
                >
                  <option value="">Select a theme...</option>
                  {PUNE_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                  Project link <span className="font-normal text-lenovo-muted">(optional)</span>
                </label>
                <input
                  value={newTeam.projectLink}
                  onChange={(e) => setNewTeam((t) => ({ ...t, projectLink: e.target.value }))}
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                />
              </div>
            </div>

            {newTeamError ? (
              <p className="mt-4 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
                {newTeamError}
              </p>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                onClick={resetForm}
                disabled={newTeamSubmitting}
                className="touch-target rounded-full border-2 border-lenovo-line px-5 text-base font-semibold text-lenovo-muted transition-colors hover:border-lenovo-red hover:text-lenovo-red disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={submitNewTeam}
                disabled={newTeamSubmitting}
                className="touch-target flex-1 rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
              >
                {newTeamSubmitting ? "Registering..." : "Add team and register"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
              <label className="mb-1 block text-sm font-medium text-lenovo-ink">
                Team ID
              </label>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelected(null);
                    setDropdownOpen(true);
                    setSubmitError(null);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                  placeholder="Start typing the Team ID..."
                  className="touch-target w-full rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                  autoComplete="off"
                />
                {dropdownOpen && !selected && roster ? (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-lenovo-line bg-white shadow-card">
                    {matches.length === 0 ? (
                      <p className="px-3 py-2.5 text-sm text-lenovo-muted">
                        No unregistered team matches "{query}".
                      </p>
                    ) : (
                      matches.map((entry) => (
                        <button
                          key={entry.team_id}
                          type="button"
                          onMouseDown={() => selectTeam(entry)}
                          className="flex w-full flex-col items-start px-3 py-2.5 text-left hover:bg-lenovo-paper"
                        >
                          <span className="text-sm font-semibold text-lenovo-ink">
                            {entry.team_id}
                          </span>
                          <span className="text-xs text-lenovo-muted">
                            {entry.team_name || entry.leader_name || "Unnamed team"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              {roster ? (
                <p className="mt-2 text-xs text-lenovo-muted">
                  {roster.length} team{roster.length === 1 ? "" : "s"} not yet
                  registered.
                </p>
              ) : (
                <p className="mt-2 text-xs text-lenovo-muted">Loading roster...</p>
              )}
              <button
                onClick={openNewTeamForm}
                className="mt-3 text-sm font-medium text-lenovo-red hover:underline"
              >
                Can't find them? Add a new team
              </button>
            </div>

            {selected ? (
              <div className="mt-4 rounded-card border border-lenovo-line bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-lenovo-red px-2.5 py-1 text-xs font-semibold text-white">
                    {selected.team_id}
                  </span>
                  <button
                    onClick={resetForm}
                    className="text-xs font-medium text-lenovo-muted hover:text-lenovo-red"
                  >
                    Go back
                  </button>
                </div>

                {editingName ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Enter team name"
                        autoFocus
                        className="touch-target flex-1 rounded-lg border border-lenovo-line px-3 text-base focus:border-lenovo-red focus:outline-none"
                      />
                      <button
                        onClick={saveName}
                        disabled={savingName}
                        className="touch-target rounded-full bg-lenovo-red px-4 text-sm font-semibold text-white hover:bg-lenovo-red-dark disabled:opacity-60"
                      >
                        {savingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        disabled={savingName}
                        className="touch-target rounded-full px-3 text-sm font-medium text-lenovo-muted hover:text-lenovo-red"
                      >
                        Cancel
                      </button>
                    </div>
                    {nameError ? (
                      <p className="mt-1 text-xs text-lenovo-maroon">{nameError}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-lenovo-ink">
                      {selected.team_name || "Unnamed team"}
                    </h2>
                    <button
                      onClick={startEditName}
                      className="text-xs font-medium text-lenovo-red hover:underline"
                    >
                      {selected.team_name ? "Edit name" : "Add name"}
                    </button>
                  </div>
                )}
                <p className="mt-1 text-sm text-lenovo-muted">{selected.project_title}</p>
                {selected.project_theme ? (
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-lenovo-purple">
                    {selected.project_theme}
                  </p>
                ) : null}

                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-lenovo-line pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-lenovo-muted">Team leader</dt>
                    <dd className="font-medium text-lenovo-ink">{selected.leader_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-lenovo-muted">Team member 2</dt>
                    <dd className="font-medium text-lenovo-ink">{selected.member2_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-lenovo-muted">Leader email</dt>
                    <dd className="break-all font-medium text-lenovo-ink">{selected.leader_email || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-lenovo-muted">Leader contact</dt>
                    <dd className="font-medium text-lenovo-ink">{selected.leader_contact || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-lenovo-muted">Attending</dt>
                    <dd className="font-medium text-lenovo-ink">{selected.attendees || "-"}</dd>
                  </div>
                </dl>

                {submitError ? (
                  <p className="mt-4 rounded-card border border-lenovo-maroon/30 bg-lenovo-maroon/5 p-3 text-sm text-lenovo-maroon">
                    {submitError}
                  </p>
                ) : null}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={resetForm}
                    disabled={submitting}
                    className="touch-target rounded-full border-2 border-lenovo-line px-5 text-base font-semibold text-lenovo-muted transition-colors hover:border-lenovo-red hover:text-lenovo-red disabled:opacity-60"
                  >
                    Go back
                  </button>
                  <button
                    onClick={submitRegister}
                    disabled={submitting}
                    className="touch-target flex-1 rounded-full bg-lenovo-red px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark disabled:opacity-60"
                  >
                    {submitting ? "Registering..." : "Register"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
