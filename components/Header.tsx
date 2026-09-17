"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { clearEvaluator } from "@/lib/evaluators";

export function Header({ evaluatorName }: { evaluatorName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = evaluatorName
    ? [
        { href: "/teams", label: "My Teams" },
        { href: "/leaderboard", label: "Leaderboard" },
      ]
    : [{ href: "/leaderboard", label: "Leaderboard" }];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  function switchEvaluator() {
    clearEvaluator();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-lenovo-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
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
                  ? "bg-lenovo-red text-white"
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
                  Evaluator
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
        <div className="border-t border-white/10 bg-lenovo-navy-deep px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target flex items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-lenovo-red text-white"
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
                  Evaluator
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
