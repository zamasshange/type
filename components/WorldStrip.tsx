"use client";

import { useEffect, useState } from "react";
import { Flag } from "./Flag";
import { getCountry } from "@/lib/countries";
import { api, authHeader, type Summary } from "@/lib/api";
import { modeFromConfig } from "@/lib/modes";
import type { TestConfig } from "@/lib/types";
import { useStore } from "./StoreProvider";
import { useSession } from "./SessionProvider";

export function WorldStrip() {
  const { state } = useStore();
  const { config, setConfig } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const country = getCountry(state.profile.countryCode);
  const mode = modeFromConfig(config) ?? "time-60";

  useEffect(() => {
    const q = new URLSearchParams({ mode, country: state.profile.countryCode });
    void api<Summary>(`/api/summary?${q}`, {
      headers: authHeader(state.profile.token),
    })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [mode, state.profile.countryCode, state.profile.token]);

  return (
    <div className="world-strip">
      <div className="world-id">
        <Flag code={country.code} title={country.name} />
        <div>
          <strong>{country.name}</strong>
          <span>
            {summary?.countryRank ? `national #${summary.countryRank}` : "unranked nationally"}
            {summary?.continentRank ? ` · ${country.continent} #${summary.continentRank}` : ""}
            {summary?.worldRank ? ` · world #${summary.worldRank}` : ""}
          </span>
        </div>
      </div>
      <div className="world-meta">
        <span>
          {summary?.champName
            ? `nation #1 ${summary.champName} · ${summary.champWpm} wpm`
            : "be your nation's first"}
        </span>
        {summary?.nationsRank ? <span>nations cup #{summary.nationsRank}</span> : null}
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
