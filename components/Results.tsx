"use client";

import { useMemo } from "react";
import type { TestResult } from "@/lib/types";
import { formatDuration, pbKey } from "@/lib/stats";
import { Flag } from "./Flag";
import { getCountry } from "@/lib/countries";
import { useStore } from "./StoreProvider";
import { useLive } from "@/hooks/useLive";
import { modeFromConfig, ordinal, rankTitle } from "@/lib/modes";
import { nationsCupFrom, rankedBoardFrom } from "@/lib/board-live";
import type { DbResult } from "@/lib/cloud-types";

export function WpmChart({ result }: { result: TestResult }) {
  const pts = result.wpmHistory;
  if (pts.length < 2) return null;
  const w = 640;
  const h = 160;
  const max = Math.max(10, ...pts.map((p) => Math.max(p.wpm, p.raw)));
  const path = (key: "wpm" | "raw") =>
    pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p[key] / max) * (h - 12) - 6;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg className="wpm-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="WPM over time">
      <path d={path("raw")} className="raw-line" />
      <path d={path("wpm")} className="wpm-line" />
    </svg>
  );
}

export function Results({
  result,
  onNext,
  isPb,
}: {
  result: TestResult;
  onNext: () => void;
  isPb?: boolean;
}) {
  const stats = [
    { label: "wpm", value: result.wpm.toFixed(result.wpm % 1 ? 1 : 0), big: true },
    { label: "acc", value: `${result.accuracy}%`, big: true },
    { label: "raw", value: result.rawWpm.toFixed(result.rawWpm % 1 ? 1 : 0) },
    { label: "consistency", value: `${Math.round(result.consistency)}%` },
    { label: "burst", value: Math.round(result.burst) },
    { label: "time", value: formatDuration(result.timeMs) },
    {
      label: "characters",
      value: `${result.correctChars}/${result.incorrectChars}/${result.extraChars}/${result.missedChars}`,
    },
    { label: "test type", value: pbKey(result.config).replace(/-/g, " ") },
  ];

  return (
    <section className="results">
      {isPb && <p className="pb-banner">personal best</p>}
      <div className="results-grid">
        <div className="results-main">
          {stats.slice(0, 2).map((s) => (
            <div key={s.label} className="stat big">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>
        <WpmChart result={result} />
      </div>
      <div className="results-meta">
        {stats.slice(2).map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>
      {result.quoteSource && (
        <p className="quote-source">source · {result.quoteSource}</p>
      )}
      {result.missedWords.length > 0 && (
        <p className="missed-line">
          missed · {result.missedWords.slice(0, 12).join(" · ")}
        </p>
      )}
      <FieldStandings result={result} />
      <div className="results-actions">
        <button type="button" className="primary-btn" onClick={onNext}>
          next test
        </button>
        <p className="hint">tab or enter to restart</p>
      </div>
    </section>
  );
}

function FieldStandings({ result }: { result: TestResult }) {
  const { compare, state } = useStore();
  const live = useLive();
  const country = getCountry(state.profile.countryCode);
  const mode = modeFromConfig(result.config, result.isDaily);

  const standings = useMemo(() => {
    if (!mode) return null;
    const userId = state.profile.userId;
    const results: DbResult[] = [...live.results];
    if (userId && !results.some((row) => row.userId === userId && row.mode === mode && Math.abs(row.timestamp - result.timestamp) < 5000)) {
      results.push({
        id: result.id,
        userId,
        wpm: result.wpm,
        rawWpm: result.rawWpm,
        accuracy: result.accuracy,
        consistency: result.consistency,
        burst: result.burst,
        timeMs: result.timeMs,
        mode,
        timestamp: result.timestamp,
        isDaily: Boolean(result.isDaily),
      });
    }
    const world = rankedBoardFrom(live.users, results, mode, "world", country.code);
    const continent = rankedBoardFrom(live.users, results, mode, "continent", country.code);
    const national = rankedBoardFrom(live.users, results, mode, "country", country.code);
    const you = userId ?? "";
    const worldRow = world.find((r) => r.id === you);
    const continentRow = continent.find((r) => r.id === you);
    const nationalRow = national.find((r) => r.id === you);
    const nation = nationsCupFrom(live.users, results, mode).find((n) => n.code === country.code);
    return {
      worldRank: worldRow?.rank ?? compare?.worldRank ?? null,
      worldField: world.length,
      continentRank: continentRow?.rank ?? compare?.continentRank ?? null,
      continentField: continent.length,
      countryRank: nationalRow?.rank ?? compare?.countryRank ?? null,
      countryField: national.length,
      nationsRank: nation?.rank ?? compare?.nationsRank ?? null,
    };
  }, [mode, live.users, live.results, result, state.profile.userId, country.code, compare]);

  const rating = compare?.rating ?? state.profile.rating ?? 1000;
  const delta = compare?.delta ?? 0;

  if (!mode) {
    return (
      <section className="field-standings">
        <p className="field-kicker">off the ranked field</p>
        <p className="hint">
          Quote and zen stay in your log. Time or words writes this run to the live board.
        </p>
      </section>
    );
  }

  if (!state.profile.token) {
    return (
      <section className="field-standings">
        <p className="field-kicker">not on the live board yet</p>
        <p className="hint">Join from profile so this score can land on other devices.</p>
      </section>
    );
  }

  return (
    <section className="field-standings">
      <p className="field-kicker">where this run sits</p>
      <div className="field-cards">
        <article className="field-card">
          <span className="field-mark">◎</span>
          <span className="field-scope">the world</span>
          <strong>{standings?.worldRank ? ordinal(standings.worldRank) : "on the map"}</strong>
          <em>
            {standings?.worldRank
              ? `of ${standings.worldField} on the planet`
              : "this score is heading out"}
          </em>
        </article>
        <article className="field-card">
          <span className="field-mark">◇</span>
          <span className="field-scope">{country.continent}</span>
          <strong>{standings?.continentRank ? ordinal(standings.continentRank) : "in the running"}</strong>
          <em>
            {standings?.continentRank
              ? `of ${standings.continentField} across ${country.continent}`
              : "continental cup is open"}
          </em>
        </article>
        <article className="field-card home">
          <span className="field-mark">
            <Flag code={country.code} title={country.name} />
          </span>
          <span className="field-scope">{country.name}</span>
          <strong>{standings?.countryRank ? `${ordinal(standings.countryRank)} at home` : "home soil"}</strong>
          <em>
            {standings?.countryRank
              ? `${standings.countryField} typist${standings.countryField === 1 ? "" : "s"} flying this flag`
              : "first mark for your flag"}
          </em>
        </article>
      </div>
      <p className="field-rating">
        {rankTitle(rating)} · {rating}{" "}
        <span className={delta >= 0 ? "up" : "down"}>
          {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}
          {delta}
        </span>
        {standings?.nationsRank ? ` · nations cup ${ordinal(standings.nationsRank)}` : ""}
      </p>
    </section>
  );
}
