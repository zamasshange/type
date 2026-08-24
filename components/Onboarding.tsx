"use client";

import { useState } from "react";
import type { Gender } from "@/lib/types";
import { CountryPicker } from "./CountryPicker";
import { GoogleButton } from "./GoogleButton";
import { useStore } from "./StoreProvider";

export function Onboarding() {
  const { state, ready, registerAccount, signInWithGoogleAccount, updateProfile, setToast } = useStore();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(state.profile.countryCode || "ZA");
  const [gender, setGender] = useState<Gender | "">(state.profile.gender ?? "");
  const [busy, setBusy] = useState<"google" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready || state.profile.onboarded) return null;

  const google = async () => {
    setBusy("google");
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
      setBusy(null);
    }
  };

  const submit = async () => {
    const username = name.trim();
    if (!username) {
      setError("pick a name, or Continue with Google");
      return;
    }
    if (gender !== "female" && gender !== "male") {
      setError("choose female or male");
      return;
    }
    setBusy("join");
    setError(null);
    try {
      await registerAccount(username, country, gender);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not join the live board");
    } finally {
      setBusy(null);
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
    setToast("watching — log in on you to keep a rank");
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
        <header className="onboard-head">
          <p className="eyebrow">the world typing arena</p>
          <h2>typehaven</h2>
        </header>
        <p className="lede">Google keeps your board spot when you switch phones.</p>
        <GoogleButton busy={busy === "google"} onClick={() => void google()} />
        <p className="onboard-or">or this device</p>
        <div className="onboard-fields">
          <label>
            username
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              placeholder="your name"
              maxLength={24}
              autoComplete="nickname"
              enterKeyHint="done"
            />
          </label>
          <div>
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
          </div>
        </div>
        <CountryPicker value={country} onChange={setCountry} />
        {error && <p className="hint">{error}</p>}
        <div className="onboard-actions">
          <button type="submit" className="primary-btn" disabled={Boolean(busy)}>
            {busy === "join" ? "joining…" : "join this device"}
          </button>
          <button type="button" className="text-btn" disabled={Boolean(busy)} onClick={browse}>
            just watch
          </button>
        </div>
      </form>
    </div>
  );
}
