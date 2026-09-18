import { LeaderboardRow } from "@/lib/types";
import { groupForGroupNumber } from "@/lib/evaluators";

export function LeaderboardTable({
  rows,
  showEvaluatorTeam = true,
}: {
  rows: LeaderboardRow[];
  showEvaluatorTeam?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-lenovo-line bg-white shadow-card">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-lenovo-navy text-white">
            <th className="whitespace-nowrap px-4 py-3 font-semibold">Rank</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold">Table</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">Project</th>
            {showEvaluatorTeam ? (
              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                Evaluator team
              </th>
            ) : null}
            <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
              Avg. score
            </th>
            <th className="hidden whitespace-nowrap px-4 py-3 text-right font-semibold sm:table-cell">
              Scored by
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rank = index + 1;
            const topTen = rank <= 10 && row.average_total !== null;
            const evaluatorGroup = showEvaluatorTeam
              ? groupForGroupNumber(row.group_number ?? -1)
              : undefined;
            return (
              <tr
                key={row.table_number}
                className={
                  topTen
                    ? "border-b border-lenovo-line bg-lenovo-red/[0.06]"
                    : "border-b border-lenovo-line"
                }
              >
                <td className="px-4 py-3 font-display font-semibold">
                  <span
                    className={
                      topTen
                        ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-lenovo-red text-xs text-white"
                        : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-lenovo-paper text-xs text-lenovo-muted"
                    }
                  >
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-3 text-lenovo-muted">{row.table_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-lenovo-ink">
                    {row.team_name || "Unnamed team"}
                  </p>
                  <p className="text-xs text-lenovo-muted sm:hidden">
                    {row.project_title}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-lenovo-muted sm:table-cell">
                  {row.project_title}
                </td>
                {showEvaluatorTeam ? (
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-lenovo-navy/10 px-2.5 py-1 text-xs font-semibold text-lenovo-navy">
                      Team {row.group_number}
                    </span>
                    {evaluatorGroup ? (
                      <p className="mt-1 text-xs text-lenovo-muted">
                        {evaluatorGroup.evaluators.join(" & ")}
                      </p>
                    ) : null}
                  </td>
                ) : null}
                <td className="px-4 py-3 text-right font-display font-semibold text-lenovo-ink">
                  {row.average_total !== null ? `${row.average_total} / 40` : "-"}
                </td>
                <td className="hidden px-4 py-3 text-right text-lenovo-muted sm:table-cell">
                  {row.evaluations_count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
