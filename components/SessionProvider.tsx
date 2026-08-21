"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CONFIG, type TestConfig } from "@/lib/types";

interface SessionValue {
  config: TestConfig;
  setConfig: (config: TestConfig | ((current: TestConfig) => TestConfig)) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  restart: () => void;
  practice: () => void;
  daily: () => void;
  register: (fns: { restart: () => void; practice: () => void; daily: () => void }) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);
  const [commandOpen, setCommandOpen] = useState(false);
  const fns = useRef({
    restart: () => {},
    practice: () => {},
    daily: () => {},
  });

  const register = useCallback((next: typeof fns.current) => {
    fns.current = next;
  }, []);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      commandOpen,
      setCommandOpen,
      restart: () => fns.current.restart(),
      practice: () => fns.current.practice(),
      daily: () => fns.current.daily(),
      register,
    }),
    [commandOpen, config, register],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
