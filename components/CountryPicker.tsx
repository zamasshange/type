"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { Flag } from "./Flag";

export function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = getCountry(value);
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

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (code: string) => {
    onChange(code);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={`country-picker ${open ? "open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="country-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Flag code={selected.code} title={selected.name} />
        <span className="country-toggle-name">{selected.name}</span>
        <span className="country-toggle-hint">{open ? "close" : "change"}</span>
      </button>
      {open && (
        <div className="country-menu">
          <input
            className="country-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (filtered[0]) pick(filtered[0].code);
            }}
            placeholder="search countries — russia, south africa, gb…"
            aria-label="Search countries"
            autoComplete="off"
          />
          <div className="flag-grid" role="listbox">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                className={value === c.code ? "on" : ""}
                onClick={() => pick(c.code)}
                title={c.name}
              >
                <Flag code={c.code} title={c.name} />
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="hint">no country matches that search</p>}
          </div>
        </div>
      )}
    </div>
  );
}
