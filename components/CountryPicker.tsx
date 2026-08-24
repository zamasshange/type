"use client";

import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "./Flag";

export function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="country-picker">
      <input
        className="country-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search countries — russia, south africa, gb…"
        aria-label="Search countries"
      />
      <div className="flag-grid">
        {filtered.map((c) => (
          <button
            key={c.code}
            type="button"
            className={value === c.code ? "on" : ""}
            onClick={() => onChange(c.code)}
            title={c.name}
          >
            <Flag code={c.code} title={c.name} />
            <span>{c.name}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="hint">no country matches that search</p>}
      </div>
    </div>
  );
}
