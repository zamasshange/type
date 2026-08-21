"use client";

import { useEffect, useState } from "react";
import { Flag } from "./Flag";
import { api, type FeedItem, type NationRow } from "@/lib/api";
import { getCountry } from "@/lib/countries";
import { useStore } from "./StoreProvider";

export function ArenaView() {
  const { state } = useStore();
  const [nations, setNations] = useState<NationRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const mine = getCountry(state.profile.countryCode);

  useEffect(() => {
    void api<{ nations: NationRow[] }>("/api/nations?mode=time-60")
      .then((d) => setNations(d.nations))
      .catch(() => setNations([]));
    void api<{ feed: FeedItem[] }>("/api/feed")
      .then((d) => setFeed(d.feed))
      .catch(() => setFeed([]));
  }, []);

  const continents = [...new Set(nations.map((n) => n.continent))];
  const myNation = nations.find((n) => n.code === mine.code);

  return (
    <div className="page-panel">
      <header className="page-head">
        <h1>arena</h1>
        <p>
          Nations Cup · average of each country&apos;s top 5 on time 60. This is the layer
          Monkeytype never built: flags, countries, and a live world field.
        </p>
      </header>

      <div className="stat-cards">
        <div>
          <span>your flag</span>
          <strong className="flag-strong">
            <Flag code={mine.code} title={mine.name} /> {mine.name}
          </strong>
        </div>
        <div>
          <span>nations cup</span>
          <strong>{myNation ? `#${myNation.rank}` : "—"}</strong>
        </div>
        <div>
          <span>nation avg</span>
          <strong>{myNation ? myNation.avgWpm : "—"}</strong>
        </div>
        <div>
          <span>your rating</span>
          <strong>{state.profile.rating ?? 1000}</strong>
        </div>
      </div>

      <h2>nations cup</h2>
      <div className="nation-list">
        {nations.slice(0, 24).map((n) => (
          <div key={n.code} className={`nation-row ${n.code === mine.code ? "you" : ""}`}>
            <span className="num">#{n.rank}</span>
            <Flag code={n.code} title={n.name} />
            <span className="nation-name">{n.name}</span>
            <span className="muted">{n.continent}</span>
            <strong>{n.avgWpm}</strong>
            <span className="muted">{n.testers} typists</span>
          </div>
        ))}
      </div>

      <h2>continents</h2>
      <div className="continent-grid">
        {continents.map((c) => {
          const lead = nations.find((n) => n.continent === c);
          return (
            <div key={c} className="pb-card">
              <span>{c}</span>
              {lead ? (
                <>
                  <strong className="flag-strong">
                    <Flag code={lead.code} title={lead.name} /> {lead.avgWpm}
                  </strong>
                  <em>{lead.name} leads</em>
                </>
              ) : (
                <strong>—</strong>
              )}
            </div>
          );
        })}
      </div>

      <h2>world tape</h2>
      <ul className="feed">
        {feed.map((item) => (
          <li key={item.id}>
            <Flag code={item.countryCode} title={item.countryCode} />
            <strong>{item.name}</strong>
            <span className="num">{item.wpm}</span>
            <span>wpm</span>
            <span className="muted">{item.mode.replace("-", " ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
