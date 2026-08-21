"use client";

import { useMemo, useState } from "react";
import { BOARD_MODES, type BoardMode } from "@/lib/modes";
import { getCountry } from "@/lib/countries";
import type { LeaderboardScope } from "@/lib/types";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";
import { formatDate } from "@/lib/stats";
import { rankTitle } from "@/lib/modes";
import { useLive } from "@/hooks/useLive";
import { rankedBoardFrom } from "@/lib/board-live";

const scopes: { id: LeaderboardScope; label: string }[] = [
  { id: "world", label: "international" },
  { id: "continent", label: "continental" },
  { id: "country", label: "national" },
];

export function LeaderboardView() {
  const { state } = useStore();
  const live = useLive();
  const [scope, setScope] = useState<LeaderboardScope>("world");
  const [modePick, setModePick] = useState<BoardMode | null>(null);
  const country = getCountry(state.profile.countryCode);
  const latestMode = useMemo(() => {
    const mine = live.results
      .filter((r) => r.userId === state.profile.userId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return mine?.mode ?? "time-60";
  }, [live.results, state.profile.userId]);
  const mode = modePick ?? latestMode;
  const rows = useMemo(
    () => rankedBoardFrom(live.users, live.results, mode, scope, country.code),
    [live.users, live.results, mode, scope, country.code],
  );

  const youRank = rows.findIndex((r) => r.id === state.profile.userId || r.name === state.profile.username) + 1;
  const title =
    scope === "world" ? "world" : scope === "continent" ? country.continent : country.name;

  return (
    <div className="page-panel">
      <header className="page-head">
        <h1>live boards</h1>
        <p>
          <Flag code={country.code} title={country.name} /> {title} ·{" "}
          {live.ready ? "live from Firebase · real typists only" : "connecting…"}
          {youRank > 0 ? ` · you are #${youRank}` : " · join and you appear here instantly"}
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
            onClick={() => setModePick(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {live.error && <p className="hint">board offline · {live.error}</p>}
      {!live.ready && !live.error && <p className="hint">loading live standings…</p>}

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
                      <span className="who-name">{row.name}</span>
                      {live.users.find((u) => u.id === row.id)?.gender === "female" ? (
                        <span className="gender-mark" title="female">
                          ♀
                        </span>
                      ) : live.users.find((u) => u.id === row.id)?.gender === "male" ? (
                        <span className="gender-mark" title="male">
                          ♂
                        </span>
                      ) : null}
                      {you ? <em>you</em> : null}
                    </span>
                  </td>
                  <td className="num">{row.wpm > 0 ? row.wpm.toFixed(row.wpm % 1 ? 1 : 0) : "new"}</td>
                  <td>{row.accuracy > 0 ? `${row.accuracy.toFixed(1)}%` : "new"}</td>
                  <td className="muted">{row.rating} · {rankTitle(row.rating)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Every timed and words test writes wpm, accuracy, and rating to Firebase. Open the same
        mode you raced (time 30 if you just ran 30 seconds) to see the numbers land.
      </p>
      <p className="hint muted-xs">{rows[0] ? `updated ${formatDate(rows[0].timestamp)}` : ""}</p>
    </div>
  );
}
