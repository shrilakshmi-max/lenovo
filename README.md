# LEAP Hackathon - Judging App

Next.js 14 (App Router) + Supabase app for evaluators to score teams against
the rubric and see a live leaderboard, built for the Lenovo LEAP Hackathon.

The app now hosts two independent hackathons. **`/` (the root URL) is Pune -
the current, active event.** UP (Lucknow) still runs exactly as before, just
moved to `/up` and no longer linked from the main UI, since that event is
over. See [Pune](#pune-a-separate-hackathon) and [UP](#up-lucknow---hidden-from-the-ui)
below for details on each.

## What's included

- **Team database import** (`/admin` for UP, `/pune/admin` for Pune): upload
  the team-list CSV (same column layout as the source sheet) to reset that
  event's database. Every import **deletes all existing teams and scores
  for that event first**, then loads the new file - there's no
  merge/preserve behavior. A separate "Clear all data" action on the same
  page wipes everything without needing a replacement file. Both require
  the admin passcode and a confirmation prompt before running. On UP,
  either action also wipes round 2 (the `round2_qualified` flags and
  `round2_scores`), since it deletes the `teams` rows they depend on.
- **Automatic grouping**: teams are sorted by table number ascending and
  split into 4 even groups on every import (`lib/csvImport.ts`).
- **Evaluator selection that persists on-device** (`localStorage`, not a
  cookie/account) - each named evaluator sees only their group's teams from
  then on, on that device, until they tap "Switch".
- **Rubric-based scoring** (`/teams/[tableNumber]` for UP,
  `/pune/teams/[tableNumber]` for Pune): Theme Alignment, Innovation,
  Technical Implementation, Scalability, each 1-10, with the full rubric
  text available in a "View rubric" panel. Submitting writes straight to
  Supabase; re-opening a team you already scored preloads your previous
  numbers so you can edit them.
- **Live leaderboard** (`/leaderboard` for UP, `/pune/leaderboard` for
  Pune): ranks teams by average total score across all evaluators who have
  scored them, top 10 highlighted, refreshes every 15 seconds.
- **Round 2** (`/round2`, UP only, not linked anywhere in the UI - see
  below): a separate scoring round for the top 20 teams from the UP
  leaderboard, with its own 3-evaluator pool (Arvind, Utkarsh, Amit) and
  the same rubric. Wasn't used in Lucknow; the code is dormant but intact
  in case a future event wants it.
- **Pune** (`/`, the default page): a second, fully
  independent hackathon in the same app - separate teams, scores,
  evaluators, and admin import, sharing nothing with UP's data. See below.

## UP (Lucknow) - hidden from the UI

UP's welcome page moved from `/` to **`/up`** when Pune became the default,
since the Lucknow event is over. Nothing else about it changed - `/teams`,
`/teams/[tableNumber]`, `/leaderboard`, and `/admin` are all exactly where
they were, still reading/writing the same `teams`/`scores` tables. `/up`
just isn't linked from anywhere in the UI anymore; bookmark it directly if
you need it (e.g. to re-check UP's leaderboard, or re-run `/admin`).

| Group | Evaluators |
|---|---|
| 1 | Amit, Saurabh |
| 2 | Neha, Nishant |
| 3 | Priyanshi, Yash/Utkarsh |
| 4 | Amanpreet, Ayush |

Defined in `lib/evaluators.ts` - edit that file if names change.

## Round 2

Round 2 lives at `/round2` and is a second, independent scoring pass over
the top 20 teams from the round 1 leaderboard, judged by a separate pool of
3 evaluators - Arvind, Utkarsh, and Amit (`lib/round2.ts`) - each of whom
sees and scores **all 20 teams** (no groups, unlike round 1).

**Starting round 2** requires the admin passcode and can only be done
**once**: an organizer opens `/round2`, enters the passcode, and taps
"Begin Round 2". That calls `/api/round2/begin`, which takes the top 20
table numbers from the `leaderboard` view (by average total score, ties
broken by table number) and flags them `teams.round2_qualified = true`. If
any team is already flagged, the endpoint refuses - there is no re-run or
reset path built in, since re-selecting after some round 2 scores exist
would silently strand those scores against teams no longer in the top 20.
If you do need to restart round 2, manually run
`update teams set round2_qualified = false` and `delete from round2_scores`
in the Supabase SQL editor first.

Because this is a one-time, hard-to-undo action, run it only once round 1
judging is actually finished - whatever the leaderboard shows at the
moment you click "Begin Round 2" is what gets locked in.

Once round 2 has begun, every device visiting `/round2` goes straight to
the evaluator picker (no passcode needed for that) - the passcode is only
required to trigger the initial selection. `/round2/teams`,
`/round2/teams/[tableNumber]`, and `/round2/leaderboard` mirror the round 1
pages but read/write the separate `round2_scores` table and
`round2_leaderboard` view, and only ever show the same 20 teams to all 3
evaluators.

If you're setting this up on an already-deployed database (not a fresh
Supabase project), run
[`supabase/migrations/002_round2.sql`](supabase/migrations/002_round2.sql)
once in the SQL editor first - `supabase/schema.sql` already includes
these pieces for new installs.

## Pune (a separate hackathon)

`/pune` is a second, fully independent hackathon running in this same app,
for when a different event needs the same tool. It does **not** share any
data with UP - separate tables (`pune_teams`, `pune_scores`), a separate
evaluator pool, and its own admin import/clear flow at `/pune/admin`.
Nothing about importing, clearing, or scoring Pune data can affect the UP
`teams`/`scores`/`round2_scores` tables, and vice versa.

Pune uses the same rubric and the same 4-groups-of-2 structure as UP, with
its own 8 evaluators (`lib/pune.ts`):

| Group | Evaluators |
|---|---|
| 1 | Poulamee, Amit |
| 2 | Yogesh, Rushikesh |
| 3 | Mayuresh, Tushar |
| 4 | Pramay, Utkarsh |

It reuses the same `ADMIN_PASSWORD` as UP's `/admin`. Importing a CSV at
`/pune/admin` works exactly like UP's `/admin`: same column format, full
wipe-and-replace of `pune_teams`/`pune_scores` only, group assignments
recalculated from the new table numbers.

If you're setting this up on an already-deployed database, run these once
in the SQL editor, in order - `supabase/schema.sql` already includes all of
this for new installs, and none of it alters `teams`, `scores`, or
`round2_scores`:

1. [`supabase/migrations/003_pune.sql`](supabase/migrations/003_pune.sql) - `pune_teams`, `pune_scores`, `pune_leaderboard`
2. [`supabase/migrations/004_pune_roster.sql`](supabase/migrations/004_pune_roster.sql) - the pre-registration roster table
3. [`supabase/migrations/005_pune_register_function.sql`](supabase/migrations/005_pune_register_function.sql) - the atomic registration function
4. [`supabase/migrations/006_score_comments.sql`](supabase/migrations/006_score_comments.sql) - optional evaluator comments (all three scoring tables)
5. [`supabase/migrations/007_pune_spot_registration.sql`](supabase/migrations/007_pune_spot_registration.sql) - spot/walk-in team registration (see below)

### Registration desk (`/pune/register`)

Desk volunteers look a team up by Team ID (searched against `pune_roster`,
loaded ahead of time via the roster import on `/pune/admin`) and press
Register to get an assigned table number, evaluator group, and a reminder
of which theme placard to hand them - no passcode needed, since this is
meant for fast, repeated use during check-in.

**Spot registration**: if a team never made it onto the roster, "Can't
find them? Add a new team" opens a short form (leader name and project
theme are the only required fields) and registers them on the spot. A
unique Team ID is generated automatically in the form `W001`, `W002`, ...
(the `W` prefix keeps these unambiguously distinct from the roster's own
IDs). Under the hood this creates both the `pune_roster` row (already
marked registered, for the same audit trail as normal registrations) and
the `pune_teams` row in one step.

Both registration paths - existing roster and spot/new - share the same
table-and-group assignment logic and the same advisory lock
(`register_pune_team` / `register_new_pune_team`, both calling the shared
`assign_pune_table` helper in
[`supabase/migrations/007_pune_spot_registration.sql`](supabase/migrations/007_pune_spot_registration.sql)),
so two desks registering teams - of either kind - at the same instant can
never collide on a table number or the round-robin group count.

## One-time setup

### 1. Create the Supabase project

1. Create a project at supabase.com.
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `teams` and `scores` tables, RLS policies, and a
   `leaderboard` view. Safe to re-run.
3. From **Project Settings -> API**, copy the Project URL, the `anon` public
   key, and the `service_role` key (keep the service role key secret).

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
```

`ADMIN_PASSWORD` is the passcode organizers enter on `/admin` (reachable via
the "Admin" button on the welcome page) to import or clear the team list.
It gates the API, not page visibility, so anyone with the URL can see the
form - only the passcode-holder can actually run either action. Keep it
out of evaluators' hands and change it from the default before the event.

### 3. Branding

No logo image is used - `components/Logo.tsx` renders "Lenovo" as styled
text (brand red) next to "LEAP HACKATHON". See
[`public/README-ASSETS.txt`](public/README-ASSETS.txt) if you want to
switch to an image logo later.

### 4. Install and run

Node.js 24 LTS is installed on this machine and `npm install` has already
been run (Next.js 16.3.5 - upgraded from the initial 14.x scaffold to clear
several known CVEs; `npm audit` reports 0 vulnerabilities). `npm run build`
and `npm run dev` both succeed and all routes respond, using placeholder
Supabase config, so the app compiles and serves cleanly - actual data
loading still needs your real Supabase project from step 1-2.

```
npm install
npm run dev
```

Then open http://localhost:3000, go to `/admin`, and import
`Final Team List Lenovo LEAP Hackathon 2026 Lucknow  - Sheet1.csv` (or an
updated version in the same column order) to seed the database.

### 5. Deploy to Vercel

1. Push this project to a Git repo and import it in Vercel, or run
   `vercel` from this folder.
2. Add the same four environment variables from `.env.local` in the Vercel
   project's Settings -> Environment Variables.
3. Deploy. Re-deploy (or just redo step 4 of setup) whenever the logo files
   or evaluator list change.

## CSV format

The importer reads columns by position, matching the source sheet:

1. Table Number
2. Team ID
3. Team Name
4. Team Leader Name
5. Team Member 2
6. Team Leader Email
7. Team Leader Contact
8. Attendees count/description
9. Project Title
10. Project Theme
11. Link (if any)
12. Pitch Night Marks (optional)

Any columns after that are ignored (the source sheet has stray pivot-table
data pasted past column 12 - safe to leave in place or remove). Rows without
a numeric Table Number are skipped.

## Design notes

- Colors: Lenovo red (`#E2231A`), navy (`#0A1F44`), maroon (`#6E1423`),
  purple (`#3B1F4F`) - see `tailwind.config.ts` under `theme.colors.lenovo`.
  Dark surfaces always pair with white/near-white text and vice versa.
- Typography: Gotham is a licensed font and isn't bundled here; the app
  uses Poppins (`app/layout.tsx`) as a free geometric-sans stand-in. To use
  real Gotham, add the font files under `public/fonts` and swap the
  `next/font/google` Poppins import for a local `next/font/local` config
  pointing at those files - nothing else needs to change since every
  component reads the `font-sans` / `font-display` Tailwind classes.
- Layout is tuned for tablet widths (2-3 column team grids, 44px+ touch
  targets on every button) and scales down to phone and up to desktop.
- No emojis, no decorative icons - status is communicated with color and
  short text labels only (e.g. "Pending" / "Graded - 27/40").

## Data model

- `teams` - one row per table number (the primary key), replaced by CSV
  import.
- `scores` - one row per (table number, evaluator), unique constraint
  enforces one scorecard per evaluator per team; resubmitting updates it.
  `total` is a generated column (sum of the four rubric scores).
- `leaderboard` - a view averaging `scores.total` per team across whichever
  evaluators have scored it so far.

## Known limitations / things to verify once Supabase is connected

- Verified so far: `npm install`, `npm run build`, and `npm run dev` all
  succeed on this machine, and every route (`/`, `/teams`, `/teams/1`,
  `/leaderboard`, `/admin`) returns HTTP 200 with placeholder Supabase env
  values. That confirms the app compiles and renders its shell correctly -
  it does **not** confirm data loading, CSV import, score submission, or the
  leaderboard aggregation, since those need a real Supabase project (step
  1-2 above). Please click through the welcome -> teams -> grading ->
  leaderboard flow and the `/admin` import once that's connected, before the
  event.
- Score writes use the Supabase anon key directly from the browser (no
  server-side auth) since evaluator identity is just a cached name, not a
  login. This is fine for a private link used only during the event, but
  don't index or publicize the app URL.
