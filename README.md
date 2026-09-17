# LEAP Hackathon 2026 - Judging App

Next.js 14 (App Router) + Supabase app for evaluators to score teams against
the rubric and see a live leaderboard, built for Lenovo LEAP Hackathon 2026,
Lucknow.

## What's included

- **Team database import** (`/admin`, linked from an "Admin" button on the
  welcome page): upload the team-list CSV (same column layout as the source
  sheet) to reset the database. Every import **deletes all existing teams
  and scores first**, then loads the new file - there's no merge/preserve
  behavior. A separate "Clear all data" action on the same page wipes
  everything without needing a replacement file. Both require the admin
  passcode and a confirmation prompt before running.
- **Automatic grouping**: teams are sorted by table number ascending and
  split into 4 even groups on every import (`lib/csvImport.ts`).
- **Evaluator selection that persists on-device** (`localStorage`, not a
  cookie/account) - each of the 8 named evaluators sees only their group's
  teams from then on, on that device, until they tap "Switch".
- **Rubric-based scoring** (`/teams/[tableNumber]`): Theme Alignment,
  Innovation, Technical Implementation, Scalability, each 1-10, with the
  full rubric text available in a "View rubric" panel. Submitting writes
  straight to Supabase; re-opening a team you already scored preloads your
  previous numbers so you can edit them.
- **Live leaderboard** (`/leaderboard`): ranks teams by average total score
  across all evaluators who have scored them, top 10 highlighted, refreshes
  every 15 seconds.

## Evaluator groups

| Group | Evaluators |
|---|---|
| 1 | Amit, Saurabh |
| 2 | Neha, Nishant |
| 3 | Priyanshi, Yash |
| 4 | Amanpreet, Ayush |

Defined in `lib/evaluators.ts` - edit that file if names change.

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

### 3. Add the Lenovo logo

Done - `public/lenovo-logo.png` is the official logo and `components/Logo.tsx`
renders it in the header. See [`public/README-ASSETS.txt`](public/README-ASSETS.txt)
if you need to swap it for a different file later.

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
