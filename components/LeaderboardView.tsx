"use client";

import { useEffect, useState } from "react";
import { BOARD_MODES, type BoardMode } from "@/lib/modes";
import { getCountry } from "@/lib/countries";
import type { LeaderboardScope } from "@/lib/types";
import { api, type BoardRow } from "@/lib/api";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";
import { formatDate } from "@/lib/stats";
import { rankTitle } from "@/lib/modes";

const scopes: { id: LeaderboardScope; label: string }[] = [
  { id: "world", label: "international" },
  { id: "continent", label: "continental" },
  { id: "country", label: "national" },
];

export function LeaderboardView() {
  const { state } = useStore();
  const [scope, setScope] = useState<LeaderboardScope>("world");
  const [mode, setMode] = useState<BoardMode>("time-60");
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const country = getCountry(state.profile.countryCode);

  useEffect(() => {
    const q = new URLSearchParams({ mode, scope, country: country.code });
    void api<{ rows: BoardRow[] }>(`/api/leaderboard?${q}`)
      .then((data) => {
        setError(null);
        setRows(data.rows);
      })
      .catch((e: Error) => setError(e.message));
  }, [mode, scope, country.code]);

  const youRank = rows.findIndex((r) => r.id === state.profile.userId || r.name === state.profile.username) + 1;
  const title =
    scope === "world" ? "world" : scope === "continent" ? country.continent : country.name;

  return (
    <div className="page-panel">
      <header className="page-head">
        <h1>live boards</h1>
        <p>
          <Flag code={country.code} title={country.name} /> {title} · saved on the Typehaven server
          {youRank > 0 ? ` · you are #${youRank}` : " · finish a ranked test to appear"}
        </p>
      </header>

      <div className="chip-row">
        {scopes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${scope === s.id ? "on" : ""}`}
            onClick={() => setScope(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {BOARD_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${mode === m.id ? "on" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && <p className="hint">board offline · {error}</p>}

      <div className="table-wrap">
        <table className="board">
          <thead>
            <tr>
              <th>#</th>
              <th>name</th>
              <th>wpm</th>
              <th>acc</th>
              <th>rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const you = row.id === state.profile.userId || row.name === state.profile.username;
              return (
                <tr key={row.id} className={you ? "you" : ""}>
                  <td>{row.rank}</td>
                  <td>
                    <span className="who">
                      <Flag code={row.countryCode} title={row.countryCode} />
                      {row.name}
                      {you ? <em>you</em> : null}
                    </span>
                  </td>
                  <td className="num">{row.wpm.toFixed(row.wpm % 1 ? 1 : 0)}</td>
                  <td>{row.accuracy.toFixed(1)}%</td>
                  <td className="muted">{rankTitle(row.rating)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Ranked modes: time 15, time 60, words 25, words 50, and the daily cup. Every finish is
        written to the server so national, continental, and world tables stay live.
      </p>
      <p className="hint muted-xs">{rows[0] ? `updated ${formatDate(rows[0].timestamp)}` : ""}</p>
    </div>
  );
}
