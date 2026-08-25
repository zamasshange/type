"use client";

import { useMemo, useState } from "react";
import { getCountry } from "@/lib/countries";
import type { LeaderboardScope } from "@/lib/types";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";
import { formatDate } from "@/lib/stats";
import { rankTitle, type BoardMode } from "@/lib/modes";
import { useLive } from "@/hooks/useLive";
import { rankedBoardFrom } from "@/lib/board-live";

const times = [15, 30, 60, 120] as const;
const counts = [10, 25, 50, 100] as const;

function familyOf(mode: BoardMode): "time" | "words" | "daily" {
  if (mode === "daily") return "daily";
  if (mode.startsWith("words-")) return "words";
  return "time";
}

function modeOf(family: "time" | "words" | "daily", value: number): BoardMode {
  if (family === "daily") return "daily";
  if (family === "words") {
    if (value === 10 || value === 25 || value === 50 || value === 100) return `words-${value}`;
    return "words-25";
  }
  if (value === 15 || value === 30 || value === 60 || value === 120) return `time-${value}`;
  return "time-30";
}

function valueOf(mode: BoardMode) {
  if (mode === "daily") return 0;
  const n = Number(mode.split("-")[1]);
  return Number.isFinite(n) ? n : 30;
}

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
    return mine?.mode ?? "time-30";
  }, [live.results, state.profile.userId]);
  const mode = modePick ?? latestMode;
  const family = familyOf(mode);
  const value = valueOf(mode);
  const rows = useMemo(
    () => rankedBoardFrom(live.users, live.results, mode, scope, country.code),
    [live.users, live.results, mode, scope, country.code],
  );

  const youRow = rows.find((r) => r.id === state.profile.userId || r.name === state.profile.username);
  const youRank = youRow ? rows.indexOf(youRow) + 1 : 0;
  const lenses: { id: LeaderboardScope; label: string }[] = [
    { id: "world", label: "world" },
    { id: "continent", label: country.continent.toLowerCase() },
    { id: "country", label: country.name.toLowerCase() },
  ];

  return (
    <div className="page-panel boards-page">
      <header className="page-head">
        <h1>overall</h1>
        <p>
          <Flag code={country.code} title={country.name} />{" "}
          {live.ready ? "live · real typists" : "connecting…"}
          {youRank > 0
            ? youRow?.wpm
              ? ` · you #${youRank}`
              : " · unranked until you finish a test"
            : " · join to appear"}
        </p>
      </header>

      <div className="board-lenses">
        {lenses.map((s) => (
          <button
            key={s.id}
            type="button"
            className={scope === s.id ? "on" : ""}
            onClick={() => setScope(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="config-bar board-config">
        <div className="config-group">
          {(["time", "words", "daily"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={family === id ? "on" : ""}
              onClick={() => {
                if (family === id) return;
                setModePick(modeOf(id, id === "words" ? 25 : 30));
              }}
            >
              {id}
            </button>
          ))}
        </div>
        {family !== "daily" && (
          <>
            <span className="config-sep" />
            <div className="config-group">
              {(family === "time" ? times : counts).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={value === n ? "on" : ""}
                  onClick={() => setModePick(modeOf(family, n))}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  no runs on this board yet
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const you = row.id === state.profile.userId || row.name === state.profile.username;
              return (
                <tr key={row.id} className={you ? "you" : ""}>
                  <td>{row.wpm > 0 ? row.rank : "—"}</td>
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
                  <td>{row.accuracy > 0 ? `${Math.round(row.accuracy)}%` : "new"}</td>
                  <td className="board-rating">
                    <span className="num">{row.rating}</span>
                    <span className="rank-title">{rankTitle(row.rating)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows[0] ? <p className="board-note muted-xs">updated {formatDate(rows[0].timestamp)}</p> : null}
    </div>
  );
}
