import Link from "next/link";
import { Header } from "@/components/Header";
import { PuneEvaluatorPicker } from "@/components/PuneEvaluatorPicker";

export default function PuneWelcomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header mode="pune" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-lenovo-red">
            Lenovo LEAP Hackathon - Pune
          </p>
          <h1 className="font-display text-2xl font-semibold text-lenovo-ink sm:text-3xl">
            Select your name to begin judging
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-lenovo-muted">
            Your selection is remembered on this device. Pick your name once
            and you will be taken straight to your assigned teams next time.
          </p>
        </div>
        <PuneEvaluatorPicker />

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
