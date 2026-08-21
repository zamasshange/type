"use client";

import { THEMES } from "@/lib/themes";
import { useStore } from "./StoreProvider";

export function Footer() {
  const { state, updateSettings } = useStore();
  const theme = THEMES.find((t) => t.id === state.settings.theme) ?? THEMES[0];

  return (
    <footer className="site-footer">
      <div className="footer-row">
        <span>tab + enter · restart</span>
        <span>esc · commands</span>
      </div>
      <div className="footer-row">
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            const i = THEMES.findIndex((t) => t.id === theme.id);
            updateSettings({ theme: THEMES[(i + 1) % THEMES.length].id });
          }}
          title="Cycle theme"
        >
          {theme.name}
        </button>
        <span>typehaven 0.2</span>
      </div>
    </footer>
  );
}
