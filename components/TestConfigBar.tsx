"use client";

import type { TestConfig, TestMode, TimeDuration, WordCount } from "@/lib/types";

const times: TimeDuration[] = [15, 30, 60, 120];
const counts: WordCount[] = [10, 25, 50, 100];
const modes: { id: TestMode; label: string }[] = [
  { id: "time", label: "time" },
  { id: "words", label: "words" },
  { id: "quote", label: "quote" },
  { id: "zen", label: "zen" },
  { id: "daily", label: "daily" },
];

export function TestConfigBar({
  config,
  onChange,
  hidden,
}: {
  config: TestConfig;
  onChange: (next: TestConfig) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  const showValues = config.mode === "time" || config.mode === "words";

  return (
    <div className="config-bar">
      <div className="config-group">
        <button
          type="button"
          className={config.punctuation ? "on" : ""}
          onClick={() => onChange({ ...config, punctuation: !config.punctuation })}
        >
          @ punctuation
        </button>
        <button
          type="button"
          className={config.numbers ? "on" : ""}
          onClick={() => onChange({ ...config, numbers: !config.numbers })}
        >
          # numbers
        </button>
      </div>
      <span className="config-sep" />
      <div className="config-group">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={config.mode === m.id ? "on" : ""}
            onClick={() => onChange({ ...config, mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>
      {showValues && (
        <>
          <span className="config-sep" />
          <div className="config-group">
            {config.mode === "time"
              ? times.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={config.time === t ? "on" : ""}
                    onClick={() => onChange({ ...config, time: t })}
                  >
                    {t}
                  </button>
                ))
              : counts.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={config.words === w ? "on" : ""}
                    onClick={() => onChange({ ...config, words: w })}
                  >
                    {w}
                  </button>
                ))}
          </div>
        </>
      )}
    </div>
  );
}
