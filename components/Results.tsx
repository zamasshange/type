"use client";

import type { TestResult } from "@/lib/types";
import { formatDuration, pbKey } from "@/lib/stats";
import { Flag } from "./Flag";
import { getCountry } from "@/lib/countries";
import { useStore } from "./StoreProvider";

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
      <CompareStrip />
      <div className="results-actions">
        <button type="button" className="primary-btn" onClick={onNext}>
          next test
        </button>
        <p className="hint">tab or enter to restart</p>
      </div>
    </section>
  );
}

function CompareStrip() {
  const { compare, state } = useStore();
  const country = getCountry(state.profile.countryCode);
  if (!compare) {
    return (
      <p className="hint">
        ranked tests (time 15/60, words 25/50, daily) upload to the world board
      </p>
    );
  }
  return (
    <div className="compare-strip">
      <div>
        <span>world</span>
        <strong>{compare.worldRank ? `#${compare.worldRank}` : "—"}</strong>
      </div>
      <div>
        <span>{country.continent}</span>
        <strong>{compare.continentRank ? `#${compare.continentRank}` : "—"}</strong>
      </div>
      <div>
        <span className="flag-strong">
          <Flag code={country.code} title={country.name} /> {country.name}
        </span>
        <strong>{compare.countryRank ? `#${compare.countryRank}` : "—"}</strong>
      </div>
      <div>
        <span>rating</span>
        <strong>
          {compare.rating}{" "}
          <em className={compare.delta >= 0 ? "up" : "down"}>
            {compare.delta >= 0 ? "+" : ""}
            {compare.delta}
          </em>
        </strong>
      </div>
      {compare.champName && (
        <p className="hint">
          nation #1 is {compare.champName} at {compare.champWpm} wpm
        </p>
      )}
    </div>
  );
}
