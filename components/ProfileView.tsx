"use client";

import { ACHIEVEMENTS } from "@/lib/achievements";
import { activityMap, formatDuration, formatPbLabel, streakFromResults } from "@/lib/stats";
import { getCountry } from "@/lib/countries";
import { useStore } from "@/components/StoreProvider";
import { Flag } from "@/components/Flag";
import { rankTitle } from "@/lib/modes";
import { api, authHeader } from "@/lib/api";

function Heatmap({ results }: { results: import("@/lib/types").TestResult[] }) {
  const days = activityMap(results, 119);
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="heatmap" aria-label="Typing activity">
      {days.map((d) => (
        <span
          key={d.date}
          title={`${d.date} · ${d.count} test${d.count === 1 ? "" : "s"}`}
          style={{ opacity: d.count === 0 ? 0.18 : 0.35 + (d.count / max) * 0.65 }}
        />
      ))}
    </div>
  );
}

export function ProfileView() {
  const { state, updateProfile } = useStore();
  const country = getCountry(state.profile.countryCode);
  const { results, pbs, achievements } = state;
  const tests = results.length;
  const timeTyped = results.reduce((a, r) => a + r.timeMs, 0);
  const avgWpm = tests ? results.slice(0, 10).reduce((a, r) => a + r.wpm, 0) / Math.min(10, tests) : 0;
  const avgAcc = tests ? results.slice(0, 10).reduce((a, r) => a + r.accuracy, 0) / Math.min(10, tests) : 0;
  const best = results.reduce((m, r) => Math.max(m, r.wpm), 0);
  const streak = streakFromResults(results);
  const pbList = Object.entries(pbs).sort((a, b) => b[1].wpm - a[1].wpm);

  return (
    <div className="page-panel">
      <header className="page-head">
        <h1>
          <input
            className="name-edit"
            value={state.profile.username}
            onChange={(e) => updateProfile({ username: e.target.value.slice(0, 16) || "guest" })}
            onBlur={() => {
              if (!state.profile.token) return;
              void api("/api/users", {
                method: "PATCH",
                headers: authHeader(state.profile.token),
                body: JSON.stringify({ username: state.profile.username }),
              }).catch(() => undefined);
            }}
            aria-label="Username"
          />
        </h1>
        <p className="profile-flagline">
          <Flag code={country.code} title={country.name} /> {country.name} · {country.continent} ·{" "}
          {rankTitle(state.profile.rating ?? 1000)} · {state.profile.rating ?? 1000} rating · joined{" "}
          {state.profile.createdAt ? new Date(state.profile.createdAt).toLocaleDateString() : "today"}
        </p>
      </header>

      <div className="stat-cards">
        <div>
          <span>tests</span>
          <strong>{tests}</strong>
        </div>
        <div>
          <span>time typed</span>
          <strong>{formatDuration(timeTyped)}</strong>
        </div>
        <div>
          <span>best</span>
          <strong>{best ? best.toFixed(0) : "—"}</strong>
        </div>
        <div>
          <span>avg wpm</span>
          <strong>{avgWpm ? avgWpm.toFixed(0) : "—"}</strong>
        </div>
        <div>
          <span>avg acc</span>
          <strong>{avgAcc ? `${avgAcc.toFixed(0)}%` : "—"}</strong>
        </div>
        <div>
          <span>streak</span>
          <strong>{streak}d</strong>
        </div>
      </div>

      <h2>activity</h2>
      <Heatmap results={results} />

      <h2>personal records</h2>
      {pbList.length === 0 ? (
        <p className="hint">finish a test to start collecting records</p>
      ) : (
        <div className="pb-grid">
          {pbList.map(([key, r]) => (
            <div key={key} className="pb-card">
              <span>{formatPbLabel(key)}</span>
              <strong>{r.wpm}</strong>
              <em>{r.accuracy}% acc</em>
            </div>
          ))}
        </div>
      )}

      <h2>insights</h2>
      <div className="insights">
        <p>
          missed words ·{" "}
          {state.missedWords.length
            ? state.missedWords.slice(0, 18).join(" · ")
            : "none yet — keep accuracy high"}
        </p>
      </div>

      <h2>achievements</h2>
      <div className="achieve-grid">
        {ACHIEVEMENTS.map((a) => {
          const on = achievements.includes(a.id);
          return (
            <div key={a.id} className={`achieve ${on ? "on" : ""}`}>
              <strong>{a.name}</strong>
              <span>{a.description}</span>
            </div>
          );
        })}
      </div>

      <h2>recent</h2>
      <ul className="history">
        {results.slice(0, 12).map((r) => (
          <li key={r.id}>
            <span className="num">{r.wpm}</span>
            <span>wpm</span>
            <span>{r.accuracy}%</span>
            <span className="muted">{pbKeySafe(r)}</span>
            <span className="muted">{new Date(r.timestamp).toLocaleString()}</span>
          </li>
        ))}
        {results.length === 0 && <li className="muted">no tests yet</li>}
      </ul>
    </div>
  );
}

function pbKeySafe(r: { config: import("@/lib/types").TestConfig }) {
  const { mode, time, words } = r.config;
  if (mode === "time") return `time ${time}`;
  if (mode === "words") return `words ${words}`;
  return mode;
}
