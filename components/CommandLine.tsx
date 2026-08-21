"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { THEMES } from "@/lib/themes";
import { COUNTRIES } from "@/lib/countries";
import { useStore } from "./StoreProvider";
import type { TestConfig } from "@/lib/types";

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandLine(props: {
  open: boolean;
  onClose: () => void;
  config: TestConfig;
  onConfig: (next: TestConfig) => void;
  onRestart: () => void;
  onPractice: () => void;
  onDaily: () => void;
}) {
  if (!props.open) return null;
  return <CommandPalette {...props} />;
}

function CommandPalette({
  onClose,
  config,
  onConfig,
  onRestart,
  onPractice,
  onDaily,
}: {
  onClose: () => void;
  config: TestConfig;
  onConfig: (next: TestConfig) => void;
  onRestart: () => void;
  onPractice: () => void;
  onDaily: () => void;
}) {
  const { state, updateSettings, updateProfile, resetLocal, setToast } = useStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: "restart", group: "test", label: "restart test", run: onRestart },
      { id: "practice", group: "test", label: "practice missed words", run: onPractice },
      { id: "daily", group: "test", label: "start daily challenge", run: onDaily },
      {
        id: "punc",
        group: "test",
        label: `punctuation ${config.punctuation ? "off" : "on"}`,
        run: () => onConfig({ ...config, punctuation: !config.punctuation }),
      },
      {
        id: "num",
        group: "test",
        label: `numbers ${config.numbers ? "off" : "on"}`,
        run: () => onConfig({ ...config, numbers: !config.numbers }),
      },
      ...(["time", "words", "quote", "zen"] as const).map((mode) => ({
        id: `mode-${mode}`,
        group: "test",
        label: `mode ${mode}`,
        run: () => onConfig({ ...config, mode }),
      })),
      {
        id: "sound",
        group: "settings",
        label: `sound ${state.settings.sound ? "off" : "on"}`,
        run: () => updateSettings({ sound: !state.settings.sound }),
      },
      {
        id: "caret",
        group: "settings",
        label: `smooth caret ${state.settings.smoothCaret ? "off" : "on"}`,
        run: () => updateSettings({ smoothCaret: !state.settings.smoothCaret }),
      },
      {
        id: "livewpm",
        group: "settings",
        label: `live wpm ${state.settings.liveWpm ? "off" : "on"}`,
        run: () => updateSettings({ liveWpm: !state.settings.liveWpm }),
      },
      {
        id: "liveacc",
        group: "settings",
        label: `live accuracy ${state.settings.liveAcc ? "off" : "on"}`,
        run: () => updateSettings({ liveAcc: !state.settings.liveAcc }),
      },
      {
        id: "pace",
        group: "settings",
        label: `pace caret ${state.settings.paceCaret ? "off" : "on"}`,
        run: () => updateSettings({ paceCaret: !state.settings.paceCaret }),
      },
      {
        id: "timer",
        group: "settings",
        label: `timer ${state.settings.showTimer ? "off" : "on"}`,
        run: () => updateSettings({ showTimer: !state.settings.showTimer }),
      },
      {
        id: "reset",
        group: "danger",
        label: "clear local records",
        hint: "cannot be undone",
        run: () => {
          if (window.confirm("Clear all local scores and records?")) resetLocal();
        },
      },
      ...THEMES.map((t) => ({
        id: `theme-${t.id}`,
        group: "theme",
        label: `theme ${t.name}`,
        run: () => updateSettings({ theme: t.id }),
      })),
      ...COUNTRIES.map((c) => ({
        id: `country-${c.code}`,
        group: "profile",
        label: `country ${c.name}`,
        run: () => {
          updateProfile({ countryCode: c.code });
          setToast(`country set to ${c.name}`);
        },
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return list.filter((c) => c.group !== "profile").slice(0, 40);
    return list.filter((c) => c.label.toLowerCase().includes(q) || c.group.includes(q));
  }, [config, onConfig, onDaily, onPractice, onRestart, query, resetLocal, setToast, state.settings, updateProfile, updateSettings]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const run = (cmd: Command) => {
    cmd.run();
    onClose();
  };

  return (
    <div className="overlay-root" onClick={onClose}>
      <div
        className="command-line"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command line"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder="type a command..."
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(commands.length - 1, i + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && commands[index]) run(commands[index]);
          }}
        />
        <ul>
          {commands.slice(0, 12).map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === index ? "active" : ""}
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(c)}
              >
                <span className="cmd-group">{c.group}</span>
                <span>{c.label}</span>
                {c.hint && <span className="cmd-hint">{c.hint}</span>}
              </button>
            </li>
          ))}
          {commands.length === 0 && <li className="empty">no matching commands</li>}
        </ul>
      </div>
    </div>
  );
}
