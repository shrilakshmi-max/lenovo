import Link from "next/link";
import { Team } from "@/lib/types";

export function TeamCard({
  team,
  graded,
  score,
  href,
}: {
  team: Team;
  graded: boolean;
  score?: number;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/teams/${team.table_number}`}
      className="group flex flex-col justify-between rounded-card border border-lenovo-line bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-lenovo-navy px-2.5 py-1 text-xs font-semibold text-white">
            Table {team.table_number}
          </span>
          {graded ? (
            <span className="rounded-full bg-lenovo-success/10 px-2.5 py-1 text-xs font-semibold text-lenovo-success">
              Graded - {score}/40
            </span>
          ) : (
            <span className="rounded-full bg-lenovo-red/10 px-2.5 py-1 text-xs font-semibold text-lenovo-red">
              Pending
            </span>
          )}
        </div>
        <h3 className="font-display text-base font-semibold leading-snug text-lenovo-ink">
          {team.team_name || "Unnamed team"}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-lenovo-muted">
          {team.project_title || "No project title on file"}
        </p>
      </div>
      {team.project_theme ? (
        <p className="mt-4 line-clamp-1 text-xs font-medium uppercase tracking-wide text-lenovo-purple">
          {team.project_theme}
        </p>
      ) : null}
    </Link>
  );
}
