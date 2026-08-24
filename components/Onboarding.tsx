"use client";

import { useState } from "react";
import type { Gender } from "@/lib/types";
import { CountryPicker } from "./CountryPicker";
import { GoogleButton } from "./GoogleButton";
import { useStore } from "./StoreProvider";
import { useLive } from "@/hooks/useLive";

export function Onboarding() {
  const { state, ready, registerAccount, signInWithGoogleAccount, updateProfile, setToast } = useStore();
  const live = useLive();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(state.profile.countryCode || "US");
  const [gender, setGender] = useState<Gender | "">(state.profile.gender ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || state.profile.onboarded) return null;

  const google = async () => {
    if (!live.ready) {
      setError(live.error || "still connecting to the live board");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogleAccount({
        username: name.trim() || undefined,
        countryCode: country,
        gender: gender || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const username = name.trim();
    if (!username) {
      setError("pick a name, or Continue with Google to keep your rank on every device");
      return;
    }
    if (gender !== "female" && gender !== "male") {
      setError("say whether you type as female or male — it stays on your live profile");
      return;
    }
    if (!live.ready) {
      setError(live.error || "still connecting to the live board");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await registerAccount(username, country, gender);
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
      gender: gender || undefined,
      onboarded: true,
      createdAt: Date.now(),
    });
    setToast("watching the live board — Continue with Google to keep a rank");
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
          Continue with Google so your board spot, rating, and scores follow you to another
          phone. A name-only join stays on this device until you link Google.
        </p>
        <GoogleButton busy={busy || !live.ready} onClick={() => void google()} />
        <p className="onboard-or">or join with a name</p>
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
        <p className="field-label">you type as</p>
        <div className="chip-row gender-row">
          <button
            type="button"
            className={`chip ${gender === "female" ? "on" : ""}`}
            onClick={() => setGender("female")}
          >
            female
          </button>
          <button
            type="button"
            className={`chip ${gender === "male" ? "on" : ""}`}
            onClick={() => setGender("male")}
          >
            male
          </button>
        </div>
        <p className="field-label">your flag</p>
        <CountryPicker value={country} onChange={setCountry} />
        {error && <p className="hint">{error}</p>}
        {!live.ready && !live.error && <p className="hint">connecting to Firebase…</p>}
        {live.error && <p className="hint">{live.error}</p>}
        <button type="submit" className="primary-btn" disabled={busy || !live.ready}>
          {busy ? "writing you to the live board…" : live.ready ? "join this device" : "waiting for Firebase…"}
        </button>
        <button type="button" className="text-btn" disabled={busy} onClick={browse}>
          just watch the board
        </button>
      </form>
    </div>
  );
}
