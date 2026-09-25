"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { clearEvaluator } from "@/lib/evaluators";
import { clearRound2Evaluator } from "@/lib/round2";
import { clearPuneEvaluator } from "@/lib/pune";

export type HeaderMode = "round1" | "round2" | "pune";

interface ModeConfig {
  homeHref: string;
  teamsHref: string;
  teamsLabel: string;
  leaderboardHref: string;
  leaderboardLabel: string;
  evaluatorLabel: string;
  clearEvaluator: () => void;
}

const MODE_CONFIG: Record<HeaderMode, ModeConfig> = {
  round1: {
    homeHref: "/up",
    teamsHref: "/teams",
    teamsLabel: "My Teams",
    leaderboardHref: "/leaderboard",
    leaderboardLabel: "Leaderboard",
    evaluatorLabel: "Evaluator",
    clearEvaluator,
  },
  round2: {
    homeHref: "/round2",
    teamsHref: "/round2/teams",
    teamsLabel: "Round 2 Teams",
    leaderboardHref: "/round2/leaderboard",
    leaderboardLabel: "Round 2 Leaderboard",
    evaluatorLabel: "Round 2 Evaluator",
    clearEvaluator: clearRound2Evaluator,
  },
  pune: {
    homeHref: "/pune",
    teamsHref: "/pune/teams",
    teamsLabel: "My Teams",
    leaderboardHref: "/pune/leaderboard",
    leaderboardLabel: "Leaderboard",
    evaluatorLabel: "Evaluator",
    clearEvaluator: clearPuneEvaluator,
  },
};

export function Header({
  evaluatorName,
  mode = "round1",
}: {
  evaluatorName?: string | null;
  mode?: HeaderMode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = MODE_CONFIG[mode];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = evaluatorName
    ? [
        { href: config.teamsHref, label: config.teamsLabel },
        { href: config.leaderboardHref, label: config.leaderboardLabel },
      ]
    : [{ href: config.leaderboardHref, label: config.leaderboardLabel }];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  function switchEvaluator() {
    config.clearEvaluator();
    router.push(config.homeHref);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-lenovo-red">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={config.homeHref} className="shrink-0">
          <Logo variant="light" />
        </Link>

        {/* Desktop / tablet nav */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`touch-target flex items-center rounded-full px-4 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-white text-lenovo-red"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {evaluatorName ? (
            <>
              <div className="ml-1 hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:flex">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {config.evaluatorLabel}
                </span>
                <span className="text-sm font-semibold text-white">
                  {evaluatorName}
                </span>
              </div>
              <button
                onClick={switchEvaluator}
                className="touch-target rounded-full px-3 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
              >
                Switch
              </button>
            </>
          ) : null}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="touch-target flex items-center justify-center rounded-full text-white sm:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 block h-0.5 w-5 bg-white transition-transform ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-white transition-opacity ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 block h-0.5 w-5 bg-white transition-transform ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen ? (
        <div className="border-t border-white/10 bg-lenovo-red-dark px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target flex items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-white text-lenovo-red"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {evaluatorName ? (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2.5">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  {config.evaluatorLabel}
                </p>
                <p className="text-sm font-semibold text-white">{evaluatorName}</p>
              </div>
              <button
                onClick={switchEvaluator}
                className="touch-target rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20"
              >
                Switch
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
