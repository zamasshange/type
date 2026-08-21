"use client";

import { useLayoutEffect, useRef } from "react";

function letterClass(expected: string, typed: string, i: number, submitted: boolean) {
  if (i < typed.length) return typed[i] === expected ? "correct" : "incorrect";
  if (submitted && i >= typed.length) return "missed";
  return "pending";
}

export function WordStream({
  words,
  typed,
  wordIndex,
  currentTyped,
  focused,
  smooth,
  paceIndex,
}: {
  words: string[];
  typed: string[];
  wordIndex: number;
  currentTyped: string;
  focused: boolean;
  smooth: boolean;
  paceIndex: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const paceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const current = wrap?.querySelector<HTMLElement>("[data-current='true']");
    if (!wrap || !current) return;
    const line = current.offsetHeight + 12;
    if (current.offsetTop - wrap.scrollTop >= line * 2) {
      wrap.scrollTop = current.offsetTop - line;
    }
    if (wordIndex === 0) wrap.scrollTop = 0;
  }, [wordIndex, currentTyped]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const caret = caretRef.current;
    const target = wrap?.querySelector<HTMLElement>("[data-caret='true']");
    if (!wrap || !caret || !target) return;
    const wr = wrap.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    caret.style.transform = `translate(${tr.left - wr.left}px, ${tr.top - wr.top}px)`;
    caret.style.height = `${tr.height}px`;
  }, [wordIndex, currentTyped, words, focused]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const pace = paceRef.current;
    const target = wrap?.querySelector<HTMLElement>("[data-pace='true']");
    if (!wrap || !pace) return;
    if (!target) {
      pace.style.opacity = "0";
      return;
    }
    const wr = wrap.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    pace.style.opacity = "0.55";
    pace.style.transform = `translate(${tr.left - wr.left}px, ${tr.top - wr.top}px)`;
    pace.style.height = `${tr.height}px`;
  }, [paceIndex, words, wordIndex, currentTyped]);

  const starts: number[] = [];
  let acc = 0;
  for (const word of words) {
    starts.push(acc);
    acc += word.length + 1;
  }

  return (
    <div ref={wrapRef} className={`words-wrap ${focused ? "" : "unfocused"}`}>
      <div className="words">
        {words.map((word, wi) => {
          const isCurrent = wi === wordIndex;
          const submitted = wi < wordIndex;
          const typedWord = isCurrent ? currentTyped : (typed[wi] ?? "");
          const extra = typedWord.length > word.length ? typedWord.slice(word.length) : "";
          const start = starts[wi] ?? 0;
          return (
            <span
              key={`${wi}-${word}`}
              className={`word ${isCurrent ? "current" : ""}`}
              data-current={isCurrent || undefined}
            >
              {word.split("").map((ch, li) => {
                const global = start + li;
                const isCaret =
                  isCurrent &&
                  li === Math.min(typedWord.length, word.length) &&
                  typedWord.length <= word.length;
                const isPace = paceIndex >= 0 && global === Math.floor(paceIndex);
                return (
                  <span
                    key={li}
                    className={letterClass(ch, typedWord, li, submitted)}
                    data-caret={isCaret || undefined}
                    data-pace={isPace || undefined}
                  >
                    {ch}
                  </span>
                );
              })}
              {extra.split("").map((ch, i) => (
                <span key={`e${i}`} className="extra">
                  {ch}
                </span>
              ))}
              {isCurrent && typedWord.length >= word.length && (
                <span className="caret-end" data-caret="true" />
              )}
            </span>
          );
        })}
      </div>
      <div ref={caretRef} className={`caret ${smooth ? "smooth" : ""} ${focused ? "" : "hidden"}`} />
      <div ref={paceRef} className="pace-caret" />
    </div>
  );
}
