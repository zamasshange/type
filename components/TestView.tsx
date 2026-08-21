"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTypingTest } from "@/hooks/useTypingTest";
import { getDailyChallenge } from "@/lib/daily";
import { pbKey } from "@/lib/stats";
import { DEFAULT_CONFIG, type TestConfig } from "@/lib/types";
import { TestConfigBar } from "./TestConfigBar";
import { WordStream } from "./WordStream";
import { Results } from "./Results";
import { WorldStrip } from "./WorldStrip";
import { api, authHeader, type Summary } from "@/lib/api";
import { modeFromConfig } from "@/lib/modes";
import { useSession } from "./SessionProvider";
import { useStore } from "./StoreProvider";
import { enterTypingLayout, exitTypingLayout } from "@/lib/orientation";

export function TestView() {
  const { config, setConfig, register } = useSession();
  const { state, setToast } = useStore();
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    register({
      restart: () => setRunId((n) => n + 1),
      practice: () => {
        if (!state.missedWords.length) {
          setToast("no missed words yet");
          return;
        }
        setConfig((c) => (c.mode === "practice" ? c : { ...c, mode: "practice", words: 25 }));
        setRunId((n) => n + 1);
      },
      daily: () => {
        setConfig((c) => (c.mode === "daily" ? c : { ...DEFAULT_CONFIG, mode: "daily", time: 60 }));
        setRunId((n) => n + 1);
      },
    });
  }, [register, setConfig, setToast, state.missedWords.length]);

  return (
    <TypingPlayground
      key={`${runId}-${config.mode}-${config.time}-${config.words}-${config.punctuation}-${config.numbers}`}
      config={config}
      onConfig={setConfig}
      onRestart={() => setRunId((n) => n + 1)}
    />
  );
}

function TypingPlayground({
  config,
  onConfig,
  onRestart,
}: {
  config: TestConfig;
  onConfig: (next: TestConfig) => void;
  onRestart: () => void;
}) {
  const { state, recordResult } = useStore();
  const { setCommandOpen } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const daily = useMemo(() => getDailyChallenge(), []);
  const pool = config.mode === "practice" ? state.missedWords : undefined;
  const quote = config.mode === "daily" ? daily.quote : undefined;
  const [champ, setChamp] = useState<Pick<Summary, "champWpm" | "champName"> | null>(null);
  const [portrait, setPortrait] = useState(false);

  const engine = useTypingTest(
    config,
    {
      sound: state.settings.sound,
      pool,
      quote,
      onFinish: (result) => recordResult(result),
    },
    inputRef,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (engine.status === "finished") {
      void exitTypingLayout();
    }
  }, [engine.status]);

  useEffect(() => {
    const mode = modeFromConfig(config) ?? "time-60";
    const q = new URLSearchParams({ mode, country: state.profile.countryCode });
    void api<Summary>(`/api/summary?${q}`, { headers: authHeader(state.profile.token) })
      .then((d) => setChamp({ champWpm: d.champWpm, champName: d.champName }))
      .catch(() => setChamp(null));
  }, [config, state.profile.countryCode, state.profile.token]);

  useEffect(() => {
    if (engine.status !== "finished") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine.status, onRestart]);

  const pb = state.pbs[pbKey(config)];
  const paceWpm = pb?.wpm || champ?.champWpm || 0;
  const paceIndex =
    state.settings.paceCaret && paceWpm && engine.status === "running"
      ? (paceWpm * 5 * engine.elapsedMs) / 60000
      : -1;

  const running = engine.status === "running";
  const finished = engine.status === "finished" && engine.result;
  const dailyDone =
    state.dailyCompleted === daily.key && config.mode === "daily" && engine.status === "idle";

  return (
    <div className="test-view">
      {engine.status === "idle" && <WorldStrip />}
      <TestConfigBar config={config} onChange={onConfig} hidden={running || Boolean(finished)} />

      {config.mode === "daily" && engine.status !== "finished" && (
        <p className="daily-banner">
          daily challenge · {daily.quote.source}
          {dailyDone ? " · already completed today" : ""}
        </p>
      )}
      {config.mode === "practice" && engine.status !== "finished" && (
        <p className="daily-banner">practice · words you missed</p>
      )}

      <div className="live-row">
        {state.settings.showTimer && running && (config.mode === "time" || config.mode === "daily") && (
          <span>{Math.ceil(engine.remainingMs / 1000)}</span>
        )}
        {state.settings.showTimer && running && config.mode === "words" && (
          <span>
            {engine.wordIndex}/{config.words}
          </span>
        )}
        {state.settings.liveWpm && running && <span>{Math.round(engine.live.wpm)}</span>}
        {state.settings.liveAcc && running && <span>{Math.round(engine.live.acc)}%</span>}
        {config.mode === "zen" && running && (
          <button type="button" className="text-btn" onClick={engine.finishZen}>
            done
          </button>
        )}
      </div>

      {finished && engine.result ? (
        <Results
          result={engine.result}
          isPb={state.pbs[pbKey(engine.result.config)]?.id === engine.result.id}
          onNext={onRestart}
        />
      ) : (
        <div
          className="test-stage"
          onClick={() => {
            engine.setFocused(true);
            inputRef.current?.focus();
            void enterTypingLayout();
          }}
        >
          {portrait && engine.status !== "finished" && engine.focused && (
            <div className="rotate-gate">
              <strong>turn your phone</strong>
              <span>landscape gives you the wide field and bigger words</span>
            </div>
          )}
          {!engine.focused && (
            <div className="focus-overlay">tap here to type</div>
          )}
          <input
            ref={inputRef}
            className="hidden-input"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={engine.handleChange}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                onRestart();
                return;
              }
              if (e.key === "Escape") {
                setCommandOpen(true);
                return;
              }
              engine.handleKeyDown(e);
            }}
            onFocus={() => {
              engine.setFocused(true);
              void enterTypingLayout();
            }}
            onBlur={() => engine.setFocused(false)}
            aria-label="Type here"
          />
          <WordStream
            words={engine.words}
            typed={engine.typed}
            wordIndex={engine.wordIndex}
            currentTyped={engine.currentTyped}
            focused={engine.focused}
            smooth={state.settings.smoothCaret}
            paceIndex={paceIndex}
          />
        </div>
      )}

      {engine.status === "idle" && (
        <p className="hint center">
          {pb
            ? `pace caret is your ${pb.wpm} wpm best`
            : champ?.champName
              ? `pace caret is ${champ.champName}, your nation's #1 at ${champ.champWpm} wpm`
              : "type to begin · tab to restart"}
        </p>
      )}
    </div>
  );
}
