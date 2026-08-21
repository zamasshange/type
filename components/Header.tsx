"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";
import { rankTitle } from "@/lib/modes";

export function Header({ onCommand }: { onCommand: () => void }) {
  const path = usePathname();
  const { state } = useStore();
  const rating = state.profile.rating ?? 1000;

  return (
    <header className="site-header">
      <div className="header-left">
        <Link href="/" className="logo-link" aria-label="Typehaven home">
          <Logo />
        </Link>
        <nav className="header-links">
          <Link href="/" className={path === "/" ? "active" : ""}>
            test
          </Link>
          <Link href="/arena" className={path === "/arena" ? "active" : ""}>
            arena
          </Link>
          <Link href="/leaderboard" className={path === "/leaderboard" ? "active" : ""}>
            boards
          </Link>
          <Link href="/profile" className={path === "/profile" ? "active" : ""}>
            you
          </Link>
        </nav>
      </div>
      <nav className="header-nav">
        <button type="button" className="icon-btn" onClick={onCommand} title="Command line (Esc)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h10M4 17h16" />
          </svg>
        </button>
        <Link href="/about" className={`icon-btn ${path === "/about" ? "active" : ""}`} title="About">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 11v6M12 8h.01" />
          </svg>
        </Link>
        {state.profile.onboarded && (
          <Link href="/profile" className="user-chip" title={rankTitle(rating)}>
            <Flag code={state.profile.countryCode} title={state.profile.countryCode} />
            <span>{state.profile.username}</span>
            <em>{rating}</em>
          </Link>
        )}
      </nav>
    </header>
  );
}
