"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "./Flag";
import { useStore } from "./StoreProvider";
import { useLive } from "@/hooks/useLive";

export function Onboarding() {
  const { state, ready, registerAccount, updateProfile, setToast } = useStore();
  const live = useLive();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(state.profile.countryCode || "US");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || state.profile.onboarded) return null;

  const submit = async () => {
    const username = name.trim();
    if (!username) {
      setError("pick a name so other devices can find you");
      return;
    }
    if (!live.ready) {
      setError(live.error || "still connecting to the live board");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await registerAccount(username, country);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not join the live board");
    } finally {
      setBusy(false);
    }
  };

  const browse = () => {
    updateProfile({
      username: "guest",
      countryCode: country,
      onboarded: true,
      createdAt: Date.now(),
    });
    setToast("watching the live board — join with a name to appear on it");
  };

  return (
    <div className="overlay-root">
      <form
        className="onboard"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <p className="eyebrow">the world typing arena</p>
        <h2>typehaven</h2>
        <p className="lede">
          This name and flag are written to Firebase. Another phone opening Typehaven
          will see you on the live board — your country, rating, and scores.
        </p>
        <label>
          username
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="kanye west"
            autoFocus
            maxLength={24}
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
        {error && <p className="hint">{error}</p>}
        {!live.ready && !live.error && <p className="hint">connecting to Firebase…</p>}
        {live.error && <p className="hint">{live.error}</p>}
        <button type="submit" className="primary-btn" disabled={busy || !live.ready}>
          {busy ? "writing you to the live board…" : live.ready ? "join the arena" : "waiting for Firebase…"}
        </button>
        <button type="button" className="text-btn" disabled={busy} onClick={browse}>
          just watch the board
        </button>
      </form>
    </div>
  );
}
