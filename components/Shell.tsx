"use client";

import { useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Onboarding } from "./Onboarding";
import { CommandLine } from "./CommandLine";
import { useSession } from "./SessionProvider";
import { useStore } from "./StoreProvider";

export function Shell({ children }: { children: React.ReactNode }) {
  const { commandOpen, setCommandOpen, config, setConfig, restart, practice, daily } = useSession();
  const { toast } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  return (
    <div className="app-shell">
      <Header onCommand={() => setCommandOpen(true)} />
      <main className="app-main">{children}</main>
      <Footer />
      <Onboarding />
      <CommandLine
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        config={config}
        onConfig={setConfig}
        onRestart={restart}
        onPractice={practice}
        onDaily={daily}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
