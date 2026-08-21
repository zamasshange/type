"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_STATE, type AppState, type Profile, type Settings, type TestResult } from "@/lib/types";
import { applyResult, loadState, saveState } from "@/lib/storage";
import { applyTheme } from "@/lib/themes";
import { newlyUnlocked } from "@/lib/achievements";
import type { ServerCompare } from "@/lib/api";
import { publishLiveResult, registerLiveUser, startLive } from "@/lib/live";

interface StoreValue {
  state: AppState;
  ready: boolean;
  toast: string | null;
  compare: ServerCompare | null;
  setToast: (msg: string | null) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  recordResult: (result: TestResult) => TestResult;
  registerAccount: (username: string, countryCode: string, gender?: Profile["gender"]) => Promise<void>;
  resetLocal: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [compare, setCompare] = useState<ServerCompare | null>(null);

  useEffect(() => {
    const loaded = loadState();
    if (!loaded.profile.createdAt) {
      loaded.profile.createdAt = Date.now();
    }
    applyTheme(loaded.settings.theme);
    const id = window.requestAnimationFrame(() => {
      setState(loaded);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState(state);
    applyTheme(state.settings.theme);
  }, [ready, state]);

  useEffect(() => {
    if (!ready) return;
    void startLive();
  }, [ready]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const registerAccount = useCallback(async (username: string, countryCode: string, gender?: Profile["gender"]) => {
    const data = await registerLiveUser(username, countryCode, gender);
    updateProfile({
      username: data.username,
      countryCode: data.countryCode,
      gender: data.gender,
      userId: data.id,
      token: data.token,
      rating: data.rating,
      onboarded: true,
      createdAt: data.createdAt,
    });
  }, [updateProfile]);

  useEffect(() => {
    if (!ready) return;
    if (!state.profile.onboarded || state.profile.token) return;
    if (state.profile.username === "guest") return;
    let cancelled = false;
    const tryJoin = () => {
      void registerAccount(state.profile.username, state.profile.countryCode, state.profile.gender).catch(() => {
        if (!cancelled) window.setTimeout(tryJoin, 4000);
      });
    };
    tryJoin();
    return () => {
      cancelled = true;
    };
  }, [ready, registerAccount, state.profile.onboarded, state.profile.token, state.profile.username, state.profile.countryCode]);

  const recordResult = useCallback((result: TestResult) => {
    let saved = result;
    let token = "";
    setState((s) => {
      token = s.profile.token ?? "";
      const prev = s.achievements;
      const next = applyResult(s, result);
      saved = next.results[0];
      const unlocked = newlyUnlocked(prev, next.achievements);
      if (saved.isPb) setToast(`new personal best · ${saved.wpm} wpm`);
      else if (unlocked[0]) setToast(`achievement · ${unlocked[0].name}`);
      return next;
    });
    if (token) {
      void publishLiveResult(token, {
        wpm: saved.wpm,
        rawWpm: saved.rawWpm,
        accuracy: saved.accuracy,
        consistency: saved.consistency,
        burst: saved.burst,
        timeMs: saved.timeMs,
        config: saved.config,
        isDaily: saved.isDaily,
      })
        .then((data) => {
          setCompare(data);
          if (data.rating) {
            setState((s) => ({
              ...s,
              profile: { ...s.profile, rating: data.rating },
            }));
          }
          if (data.worldRank) {
            setToast(`world #${data.worldRank} · ${data.delta >= 0 ? "+" : ""}${data.delta} rating`);
          } else {
            setToast("saved to the live board");
          }
        })
        .catch(() => {
          setToast("could not reach the world board");
        });
    }
    return saved;
  }, []);

  const resetLocal = useCallback(() => {
    const fresh = structuredClone(DEFAULT_STATE);
    fresh.profile.createdAt = Date.now();
    setState(fresh);
    setCompare(null);
    setToast("local data cleared");
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      toast,
      compare,
      setToast,
      updateProfile,
      updateSettings,
      recordResult,
      registerAccount,
      resetLocal,
    }),
    [state, ready, toast, compare, updateProfile, updateSettings, recordResult, registerAccount, resetLocal],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
