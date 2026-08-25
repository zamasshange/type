"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PROFILE, DEFAULT_STATE, type AppState, type Profile, type Settings, type TestResult } from "@/lib/types";
import { applyResult, loadState, saveState } from "@/lib/storage";
import { applyTheme } from "@/lib/themes";
import { newlyUnlocked } from "@/lib/achievements";
import type { ServerCompare } from "@/lib/api";
import type { DbUser } from "@/lib/cloud-types";
import { mergeProgress, mergeResultLists, packProgress, resultsFromBoard } from "@/lib/progress";
import {
  completeGoogleRedirect,
  getLiveState,
  loadCloudProgress,
  publishLiveResult,
  registerLiveUser,
  saveCloudProgress,
  signInWithGoogle,
  signOutGoogle,
  startLive,
  watchGoogleAuth,
  type GoogleJoinHints,
} from "@/lib/live";

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
  signInWithGoogleAccount: (hints?: GoogleJoinHints) => Promise<void>;
  signOutAccount: () => Promise<void>;
  resetLocal: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function profileFromDb(data: DbUser): Partial<Profile> {
  return {
    username: data.username,
    countryCode: data.countryCode,
    gender: data.gender,
    userId: data.id,
    token: data.token,
    rating: data.rating,
    googleUid: data.googleUid,
    email: data.email,
    photoURL: data.photoURL,
    onboarded: true,
    createdAt: data.createdAt,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [compare, setCompare] = useState<ServerCompare | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const hydratedFor = useRef<string | null>(null);
  const hydrating = useRef<string | null>(null);

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

  const applyCloudUser = useCallback((data: DbUser) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...profileFromDb(data) } }));
  }, []);

  const hydrateCloudAccount = useCallback(async (user: DbUser) => {
    if (hydratedFor.current === user.id || hydrating.current === user.id) {
      applyCloudUser(user);
      return;
    }
    hydrating.current = user.id;
    try {
      const current = stateRef.current;
      const switching = Boolean(current.profile.userId && current.profile.userId !== user.id);
      const cloud = await loadCloudProgress(user.id).catch(() => null);
      const board = resultsFromBoard(user.id, getLiveState().results);
      const base = switching
        ? {
            ...structuredClone(DEFAULT_STATE),
            settings: current.settings,
          }
        : current;
      const merged = mergeProgress(
        {
          ...base,
          results: mergeResultLists(base.results, board),
          profile: { ...base.profile, ...profileFromDb(user) },
        },
        cloud,
      );
      setState((s) => ({
        ...s,
        ...merged,
        profile: { ...s.profile, ...profileFromDb(user) },
        settings: merged.settings,
      }));
      hydratedFor.current = user.id;
      const packed = packProgress({
        ...current,
        ...merged,
        profile: { ...current.profile, ...profileFromDb(user) },
        settings: merged.settings,
      });
      void saveCloudProgress(user.id, packed).catch(() => undefined);
    } finally {
      if (hydrating.current === user.id) hydrating.current = null;
    }
  }, [applyCloudUser]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const registerAccount = useCallback(async (username: string, countryCode: string, gender?: Profile["gender"]) => {
    const data = await registerLiveUser(username, countryCode, gender);
    applyCloudUser(data);
  }, [applyCloudUser]);

  const signInWithGoogleAccount = useCallback(async (hints?: GoogleJoinHints) => {
    const profile = stateRef.current.profile;
    const session = await signInWithGoogle({
      username: hints?.username || (profile.username !== "guest" ? profile.username : undefined),
      countryCode: hints?.countryCode || profile.countryCode,
      gender: hints?.gender ?? profile.gender,
      localToken: hints?.localToken ?? profile.token,
    });
    if (!session) {
      setToast("continuing with Google…");
      return;
    }
    await hydrateCloudAccount(session.user);
    setToast(
      session.restored
        ? `welcome back, ${session.user.username}`
        : "Google is now your live identity — your rank follows this account",
    );
  }, [applyCloudUser, hydrateCloudAccount]);

  const signOutAccount = useCallback(async () => {
    hydratedFor.current = null;
    hydrating.current = null;
    await signOutGoogle();
    setState((s) => ({
      ...s,
      profile: {
        ...DEFAULT_PROFILE,
        onboarded: true,
        countryCode: s.profile.countryCode || "ZA",
        createdAt: Date.now(),
      },
    }));
    setCompare(null);
    setToast("signed out — Continue with Google on you to return");
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const stop = watchGoogleAuth((user) => {
      if (!user || cancelled) return;
      const current = stateRef.current.profile;
      if (hydratedFor.current === user.id) {
        if (current.rating !== user.rating || current.photoURL !== user.photoURL || current.email !== user.email) {
          applyCloudUser(user);
        }
        return;
      }
      void hydrateCloudAccount(user);
    });
    void completeGoogleRedirect()
      .then((session) => {
        if (cancelled || !session) return;
        void hydrateCloudAccount(session.user);
        setToast(
          session.restored
            ? `welcome back, ${session.user.username}`
            : "Google is now your live identity — your rank follows this account",
        );
      })
      .catch((err) => {
        if (!cancelled) setToast(err instanceof Error ? err.message : "Google sign-in failed");
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [applyCloudUser, hydrateCloudAccount, ready]);

  useEffect(() => {
    if (!ready) return;
    if (!state.profile.onboarded || state.profile.token || state.profile.googleUid) return;
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
  }, [ready, registerAccount, state.profile.onboarded, state.profile.token, state.profile.googleUid, state.profile.username, state.profile.countryCode, state.profile.gender]);

  useEffect(() => {
    const userId = state.profile.userId;
    if (!ready || !userId || !state.profile.googleUid) return;
    if (hydratedFor.current !== userId) return;
    const timer = window.setTimeout(() => {
      void saveCloudProgress(userId, packProgress(stateRef.current)).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    ready,
    state.results,
    state.pbs,
    state.achievements,
    state.missedWords,
    state.dailyCompleted,
    state.profile.userId,
    state.profile.googleUid,
  ]);

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
    void signOutGoogle();
    hydratedFor.current = null;
    hydrating.current = null;
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
      signInWithGoogleAccount,
      signOutAccount,
      resetLocal,
    }),
    [
      state,
      ready,
      toast,
      compare,
      updateProfile,
      updateSettings,
      recordResult,
      registerAccount,
      signInWithGoogleAccount,
      signOutAccount,
      resetLocal,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
