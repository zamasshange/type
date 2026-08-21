"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Quote } from "@/lib/quotes";
import { appendWords, wordsForConfig } from "@/lib/generate";
import { computeLive, consistencyFromSeries, missedAndSlow, round1, uid } from "@/lib/stats";
import type { TestConfig, TestResult, WpmPoint } from "@/lib/types";
import { playClick, playFinish } from "@/lib/sound";

export type TestStatus = "idle" | "running" | "finished";

function emptyTyped(words: string[]) {
  return words.map(() => "");
}

export function useTypingTest(
  config: TestConfig,
  extras: {
    sound: boolean;
    pool?: string[];
    quote?: Quote;
    onFinish?: (result: TestResult) => void;
  },
  inputRef: React.RefObject<HTMLInputElement | null>,
) {
  const { sound, pool, quote, onFinish } = extras;
  const boot = useMemo(
    () => wordsForConfig(config, { pool, quote }),
    // Mount-only: parent remounts this hook when config/restart changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [words, setWords] = useState(boot.words);
  const [typed, setTyped] = useState(() => emptyTyped(boot.words));
  const [wordIndex, setWordIndex] = useState(0);
  const [status, setStatus] = useState<TestStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<WpmPoint[]>([]);
  const [focused, setFocused] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);

  const startRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const wordsRef = useRef(words);
  const typedRef = useRef(typed);
  const wordIndexRef = useRef(wordIndex);
  const historyRef = useRef(history);
  const errorsRef = useRef(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    statusRef.current = status;
    wordsRef.current = words;
    typedRef.current = typed;
    wordIndexRef.current = wordIndex;
    historyRef.current = history;
    onFinishRef.current = onFinish;
  });

  const currentTyped = typed[wordIndex] ?? "";

  const live = useMemo(
    () => computeLive(words, typed, wordIndex, Math.max(elapsedMs, status === "running" ? elapsedMs : 1)),
    [words, typed, wordIndex, elapsedMs, status],
  );

  const remainingMs = useMemo(() => {
    if (config.mode !== "time" && config.mode !== "daily") return 0;
    const total = (config.mode === "daily" ? 60 : config.time) * 1000;
    return Math.max(0, total - elapsedMs);
  }, [config.mode, config.time, elapsedMs]);

  const finish = useCallback(
    (overrideIndex?: number) => {
      if (statusRef.current === "finished") return;
      const now = Date.now();
      const started = startRef.current ?? now;
      const ms = Math.max(now - started, 1);
      const submitted = overrideIndex ?? wordIndexRef.current;
      const stats = computeLive(wordsRef.current, typedRef.current, submitted, ms);
      const series = historyRef.current;
      const { missed } = missedAndSlow(wordsRef.current, typedRef.current, submitted);
      const burst = series.reduce((m, p) => Math.max(m, p.wpm), 0);
      const next: TestResult = {
        id: uid(),
        timestamp: now,
        wpm: round1(stats.wpm),
        rawWpm: round1(stats.raw),
        accuracy: round1(stats.acc),
        consistency: round1(consistencyFromSeries(series)),
        burst: round1(burst),
        correctChars: stats.correct,
        incorrectChars: stats.incorrect,
        extraChars: stats.extra,
        missedChars: stats.missed,
        timeMs: ms,
        config,
        wpmHistory: series,
        missedWords: missed,
        slowWords: missed.slice(0, 8),
        quoteSource: boot.quote?.source,
        isDaily: config.mode === "daily",
      };
      setElapsedMs(ms);
      setStatus("finished");
      setResult(next);
      if (sound) playFinish();
      onFinishRef.current?.(next);
    },
    [boot.quote?.source, config, sound],
  );

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const started = startRef.current;
      if (!started) return;
      const ms = Date.now() - started;
      setElapsedMs(ms);
      const stats = computeLive(wordsRef.current, typedRef.current, wordIndexRef.current, ms);
      setHistory((h) => {
        const t = Math.floor(ms / 1000);
        if (h.length && h[h.length - 1].t === t) return h;
        return [...h, { t, wpm: stats.wpm, raw: stats.raw, errors: errorsRef.current }];
      });
      if (config.mode === "time" || config.mode === "daily") {
        const limit = (config.mode === "daily" ? 60 : config.time) * 1000;
        if (ms >= limit) finish();
      }
      if (
        (config.mode === "time" || config.mode === "zen") &&
        wordIndexRef.current > wordsRef.current.length - 30
      ) {
        setWords((w) => {
          const next = appendWords(config, w, 40);
          setTyped((t) => t.concat(emptyTyped(next.slice(w.length))));
          return next;
        });
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [status, config, finish]);

  const startIfNeeded = useCallback(() => {
    if (statusRef.current !== "idle") return;
    startRef.current = Date.now();
    setStatus("running");
  }, []);

  const submitWord = useCallback(
    (value: string) => {
      const index = wordIndexRef.current;
      const list = wordsRef.current;
      setTyped((t) => {
        const next = t.slice();
        next[index] = value;
        return next;
      });
      if (
        (config.mode === "words" || config.mode === "quote" || config.mode === "practice") &&
        index + 1 >= list.length
      ) {
        finish(index + 1);
        return;
      }
      setWordIndex((i) => i + 1);
      if (inputRef.current) inputRef.current.value = "";
    },
    [config.mode, finish, inputRef],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (statusRef.current === "finished") return;
      const raw = e.target.value;
      if (!raw) {
        setTyped((t) => {
          const next = t.slice();
          next[wordIndexRef.current] = "";
          return next;
        });
        return;
      }
      startIfNeeded();
      if (raw.includes(" ")) {
        const parts = raw.split(" ");
        const completed = parts[0] ?? "";
        const rest = parts.slice(1).join(" ");
        if (!completed && !raw.trim()) {
          e.target.value = "";
          return;
        }
        if (raw.endsWith(" ") || parts.length > 1) {
          submitWord(completed);
          if (inputRef.current) inputRef.current.value = rest;
          return;
        }
      }
      const word = wordsRef.current[wordIndexRef.current] ?? "";
      const prev = typedRef.current[wordIndexRef.current] ?? "";
      if (raw.length > prev.length) {
        const ch = raw[raw.length - 1];
        const expected = word[raw.length - 1];
        const ok = ch === expected;
        if (!ok) errorsRef.current += 1;
        if (sound) playClick(ok);
      }
      setTyped((t) => {
        const next = t.slice();
        next[wordIndexRef.current] = raw;
        return next;
      });
    },
    [inputRef, sound, startIfNeeded, submitWord],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Backspace") {
        e.preventDefault();
        if (inputRef.current) inputRef.current.value = "";
        setTyped((t) => {
          const next = t.slice();
          next[wordIndexRef.current] = "";
          return next;
        });
      }
    },
    [inputRef],
  );

  const finishZen = useCallback(() => finish(), [finish]);

  return {
    status,
    words,
    typed,
    wordIndex,
    currentTyped,
    elapsedMs,
    remainingMs,
    live,
    history,
    quote: boot.quote,
    focused,
    setFocused,
    finishZen,
    handleKeyDown,
    handleChange,
    result,
  };
}
