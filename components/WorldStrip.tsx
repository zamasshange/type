"use client";

import { useMemo } from "react";
import { Flag } from "./Flag";
import { getCountry } from "@/lib/countries";
import { modeFromConfig } from "@/lib/modes";
import type { TestConfig } from "@/lib/types";
import { useStore } from "./StoreProvider";
import { useSession } from "./SessionProvider";
import { useLive } from "@/hooks/useLive";
import { summaryFromLive } from "@/lib/live";

export function WorldStrip() {
  const { state } = useStore();
  const { config, setConfig } = useSession();
  const live = useLive();
  const country = getCountry(state.profile.countryCode);
  const mode = modeFromConfig(config) ?? "time-60";
  const summary = useMemo(
    () => summaryFromLive(live.users, live.results, state.profile.userId, state.profile.countryCode, mode),
    [live.users, live.results, state.profile.userId, state.profile.countryCode, mode],
  );

  return (
    <div className="world-strip">
      <div className="world-id">
        <Flag code={country.code} title={country.name} />
        <div>
          <strong>{country.name}</strong>
          <span>
            {summary.countryRank ? `national #${summary.countryRank}` : "unranked nationally"}
            {summary.continentRank ? ` · ${country.continent} #${summary.continentRank}` : ""}
            {summary.worldRank ? ` · world #${summary.worldRank}` : ""}
          </span>
        </div>
      </div>
      <div className="world-meta">
        <span>
          {summary.champName
            ? `nation #1 ${summary.champName} · ${summary.champWpm} wpm`
            : live.ready
              ? "be your nation's first"
              : "connecting live board…"}
        </span>
        {summary.nationsRank ? <span>nations cup #{summary.nationsRank}</span> : null}
        <span className={`live-pill ${live.ready ? "on" : ""}`}>{live.ready ? "live" : "…"}</span>
        <button
          type="button"
          className="text-btn"
          onClick={() => setConfig({ ...config, mode: "daily", time: 60 } satisfies TestConfig)}
        >
          daily cup
        </button>
      </div>
    </div>
  );
}
