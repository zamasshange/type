"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";

export function Onboarding() {
  const { state, ready, registerAccount, updateProfile, setToast } = useStore();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(state.profile.countryCode || "US");
  const [busy, setBusy] = useState(false);

  if (!ready || state.profile.onboarded) return null;

  const submit = async (skip: boolean) => {
    setBusy(true);
    try {
      await registerAccount(skip ? "guest" : name.trim() || "guest", country);
    } catch {
      updateProfile({
        username: name.trim() || "guest",
        countryCode: country,
        onboarded: true,
        createdAt: Date.now(),
      });
      setToast("playing offline until the server is back");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay-root">
      <form
        className="onboard"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        <p className="eyebrow">the world typing arena</p>
        <h2>typehaven</h2>
        <p className="lede">
          Race your nation, your continent, and the world. Pick a name and the flag you
          type for — scores save to the Typehaven board, not just this browser.
        </p>
        <label>
          username
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="your name"
            autoFocus
            maxLength={16}
          />
        </label>
        <p className="field-label">your flag</p>
        <div className="flag-grid">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={country === c.code ? "on" : ""}
              onClick={() => setCountry(c.code)}
              title={c.name}
            >
              <Flag code={c.code} title={c.name} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "joining the board…" : "join the arena"}
        </button>
        <button type="button" className="text-btn" disabled={busy} onClick={() => void submit(true)}>
          skip for now
        </button>
      </form>
    </div>
  );
}
