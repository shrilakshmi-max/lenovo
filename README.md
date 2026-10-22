# LEAP Hackathon - Judging App

Next.js 14 (App Router) + Supabase app for evaluators to score teams against
the rubric and see a live leaderboard, built for the Lenovo LEAP Hackathon.

The app now hosts three independent hackathons. **`/` (the root URL) is
Raipur - the current, active event.** UP (Lucknow) and Pune still run
exactly as before, just moved off the root URL and no longer linked from
the main UI, since those events are over. See
[Raipur](#raipur-a-separate-hackathon-with-shared-tables),
[Pune](#pune-a-separate-hackathon), and
[UP](#up-lucknow---hidden-from-the-ui) below for details on each.

## What's included

- **Team database import** (`/admin` for UP, `/pune/admin` for Pune,
  `/raipur/admin` for Raipur): upload the team-list CSV (same column
  layout as the source sheet) to reset that event's database. Every import
  **deletes all existing teams and scores for that event first**, then
  loads the new file - there's no merge/preserve behavior. A separate
  "Clear all data" action on the same page wipes everything without
  needing a replacement file. Both require the admin passcode and a
  confirmation prompt before running. On UP, either action also wipes
  round 2 (the `round2_qualified` flags and `round2_scores`), since it
  deletes the `teams` rows they depend on.
- **Automatic grouping**: teams are sorted by table number ascending and
  split into even groups on every bulk import (4 for UP/Pune, 5 for
  Raipur - `lib/csvImport.ts` / `lib/raipurCsvImport.ts`).
- **Evaluator selection that persists on-device** (`localStorage`, not a
  cookie/account) - each named evaluator sees only their group's teams from
  then on, on that device, until they tap "Switch".
- **Rubric-based scoring** (`/teams/[tableNumber]` for UP,
  `/pune/teams/[tableNumber]` for Pune, `/raipur/teams/[teamId]` for
  Raipur): Theme Alignment, Innovation, Technical Implementation,
  Scalability, each 1-10, with the full rubric text available in a "View
  rubric" panel and an optional comment field. Submitting writes straight
  to Supabase; re-opening a team you already scored preloads your previous
  numbers so you can edit them.
- **Live leaderboard** (`/leaderboard`, `/pune/leaderboard`,
  `/raipur/leaderboard`): ranks teams by average total score across all
  evaluators who have scored them, top 10 highlighted, refreshes every 15
  seconds.
- **Results export** (`/export`, linked from the homepage): downloads a
  CSV per hackathon - rank, team name, students, project name, project
  theme, project link.
- **Round 2** (`/round2`, UP only, not linked anywhere in the UI - see
  below): a separate scoring round for the top 20 teams from the UP
  leaderboard, with its own 3-evaluator pool (Arvind, Utkarsh, Amit) and
  the same rubric. Wasn't used in Lucknow; the code is dormant but intact
  in case a future event wants it.
- **Pune** (`/pune`, hidden from the UI once Raipur became the default - see
  below): a second, fully independent hackathon - separate teams, scores,
  evaluators, and admin import, sharing nothing with UP's or Raipur's data.
- **Raipur** (`/`, the default page): a third, fully independent hackathon,
  with one structural difference from UP/Pune - two one-person teams can
  share a table number, so Team ID (not table number) is the unique
  identity for scoring. See below.

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

## Raipur (a separate hackathon, with shared tables)

`/` is now Raipur, a third fully independent hackathon in this same app -
its own tables (`raipur_teams`, `raipur_scores`, `raipur_roster`), its own
10-evaluator pool, and its own admin import/clear flow at `/raipur/admin`.
Nothing about importing, clearing, or scoring Raipur data can affect UP's or
Pune's tables, and vice versa.

Raipur uses the same rubric as UP/Pune but a 5-groups-of-2 evaluator
structure (`lib/raipur.ts`):

| Group | Evaluators | Table block |
|---|---|---|
| 1 | Amit, Rajat | 1, 11, 21, 31, 41, ... |
| 2 | Pramay, Rajkamal | 2, 12, 22, 32, 42, ... |
| 3 | Rushikesh, Sudhi | 3, 13, 23, 33, 43, ... |
| 4 | Ankush, Tushar | 4, 14, 24, 34, 44, ... |
| 5 | Pratima, Priyanshi | 5, 15, 25, 35, 45, ... |

**Table assignment differs from UP/Pune.** Each group owns a dedicated
block of 10 table numbers (group *g* gets `(g-1)*10 + 1` through
`(g-1)*10 + 10`). Within a group's block, a 2-person team always takes the
next unused table number. A 1-person team instead first looks for another
1-person team *already seated alone* at a table in the same group's block
(`is_solo = true`, no second occupant yet) and joins them there, so **two
solo teams can share one table number** - only once that pairing happens
does the next solo team get a fresh table. Once a group's block of 10 is
full, additional teams overflow into shared numbering starting at 51,
assigned round-robin across all 5 groups with no solo/duo distinction (same
pattern as Pune's >72 overflow).

Because table numbers are no longer unique, **Team ID is the unique key**
for `raipur_teams` and everywhere scoring happens - `/raipur/teams/[teamId]`
(not `[tableNumber]`), `ScoreForm`'s `matchColumn="team_id"`, and the
leaderboard view all key off Team ID. Table number is kept purely as a
seating/display field. The team-detail page flags this for evaluators when
a team is solo ("This table may be shared with another one-person team -
check the Team ID below before scoring").

If you're setting this up on an already-deployed database, run these once
in the SQL editor, in order - `supabase/schema.sql` already includes all of
this for new installs, and none of it alters UP's or Pune's tables:

1. [`supabase/migrations/011_raipur.sql`](supabase/migrations/011_raipur.sql) - `raipur_roster`, `raipur_teams`, `raipur_scores`, `raipur_leaderboard`
2. [`supabase/migrations/012_raipur_register_functions.sql`](supabase/migrations/012_raipur_register_functions.sql) - `assign_raipur_table`, `register_raipur_team`, `register_new_raipur_team`

### Registration desk (`/raipur/register`)

Works exactly like Pune's registration desk: look a team up by Team ID
(from `raipur_roster`, loaded via the roster import on `/raipur/admin`) and
press Register to get an assigned table number, evaluator group, and theme
placard reminder - no passcode needed. Spot/walk-in registration works the
same way too (auto-generated `W001`, `W002`, ... IDs), and the confirmation
card additionally calls out when a team is solo and may be sharing its
table. Both paths share the same advisory lock
(`register_raipur_team` / `register_new_raipur_team`, both calling
`assign_raipur_table`), so concurrent desks can never collide on a table
number, a solo pairing, or the round-robin group count.

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
- Pune and Raipur mirror this with their own `pune_*`/`raipur_*` tables and
  views. Raipur's `raipur_teams` differs in one way: **Team ID (`team_id`),
  not table number, is the primary key** - `table_number` is a plain
  non-unique column, since two 1-person teams can share a table.

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
