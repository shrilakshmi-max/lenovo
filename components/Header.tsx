"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { clearEvaluator } from "@/lib/evaluators";

export function Header({ evaluatorName }: { evaluatorName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItem = (href: string, label: string) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`touch-target flex items-center rounded-full px-4 text-sm font-medium transition-colors ${
          active
            ? "bg-lenovo-red text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-lenovo-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo variant="light" />
        </Link>

        {evaluatorName ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItem("/teams", "My Teams")}
            {navItem("/leaderboard", "Leaderboard")}
            <div className="ml-1 hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:flex">
              <span className="text-xs uppercase tracking-wide text-white/60">
                Evaluator
              </span>
              <span className="text-sm font-semibold text-white">
                {evaluatorName}
              </span>
            </div>
            <button
              onClick={() => {
                clearEvaluator();
                router.push("/");
              }}
              className="touch-target rounded-full px-3 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
            >
              Switch
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-1">
            {navItem("/leaderboard", "Leaderboard")}
          </nav>
        )}
      </div>
    </header>
  );
}
