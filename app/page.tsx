import Link from "next/link";
import { Header } from "@/components/Header";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header mode="pune" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
            Lenovo LEAP Hackathon - Pune
          </p>
          <h1 className="font-display text-2xl font-semibold text-lenovo-ink sm:text-3xl">
            What would you like to do?
          </h1>
        </div>

        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <Link
            href="/pune/register"
            className="group flex flex-col justify-between rounded-card border border-lenovo-line bg-white p-8 shadow-card transition-transform hover:-translate-y-1"
          >
            <div>
              <span className="inline-flex items-center rounded-full bg-lenovo-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lenovo-purple">
                Registration desk
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold text-lenovo-ink">
                Register
              </h2>
              <p className="mt-2 text-sm text-lenovo-muted">
                Check a team in by their Team ID and assign them a table
                number.
              </p>
            </div>
            <span className="mt-8 inline-flex touch-target items-center justify-center rounded-full bg-lenovo-purple px-6 text-sm font-semibold text-white transition-colors group-hover:bg-lenovo-purple-dark">
              Open registration
            </span>
          </Link>

          <Link
            href="/pune"
            className="group flex flex-col justify-between rounded-card border border-lenovo-line bg-white p-8 shadow-card transition-transform hover:-translate-y-1"
          >
            <div>
              <span className="inline-flex items-center rounded-full bg-lenovo-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lenovo-red">
                Judging
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold text-lenovo-ink">
                Evaluate
              </h2>
              <p className="mt-2 text-sm text-lenovo-muted">
                Select your name and score the teams assigned to you.
              </p>
            </div>
            <span className="mt-8 inline-flex touch-target items-center justify-center rounded-full bg-lenovo-red px-6 text-sm font-semibold text-white transition-colors group-hover:bg-lenovo-red-dark">
              Start judging
            </span>
          </Link>
        </div>

        <Link
          href="/pune/admin"
          className="touch-target mt-10 flex items-center rounded-full border border-lenovo-line px-5 text-sm font-medium text-lenovo-muted transition-colors hover:border-lenovo-red hover:text-lenovo-red"
        >
          Admin
        </Link>
      </main>
    </div>
  );
}
