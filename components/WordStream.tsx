"use client";

import { useLayoutEffect, useRef } from "react";

function letterClass(expected: string, typed: string, i: number, submitted: boolean) {
  if (i < typed.length) return typed[i] === expected ? "correct" : "incorrect";
  if (submitted && i >= typed.length) return "missed";
  return "pending";
}

function place(el: HTMLElement, target: HTMLElement, root: HTMLElement) {
  const rr = root.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  el.style.transform = `translate(${tr.left - rr.left}px, ${tr.top - rr.top}px)`;
  el.style.height = `${tr.height}px`;
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
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const paceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const root = wordsRef.current;
    const current = wrap?.querySelector<HTMLElement>("[data-current='true']");
    if (!wrap || !root || !current) return;

    const styles = getComputedStyle(wrap);
    const line = Number.parseFloat(styles.getPropertyValue("--line")) || current.offsetHeight;
    const gap = Number.parseFloat(styles.getPropertyValue("--row-gap")) || 8;
    const stride = line + gap;

    if (wordIndex === 0) {
      wrap.scrollTop = 0;
    } else {
      const top = current.offsetTop;
      if (top - wrap.scrollTop >= stride * 2 - 1) {
        wrap.scrollTop = top - stride;
      } else if (top < wrap.scrollTop) {
        wrap.scrollTop = Math.max(0, top);
      }
    }

    const caret = caretRef.current;
    const caretTarget = root.querySelector<HTMLElement>("[data-caret='true']");
    if (caret && caretTarget) place(caret, caretTarget, root);

    const pace = paceRef.current;
    const paceTarget = root.querySelector<HTMLElement>("[data-pace='true']");
    if (pace) {
      if (!paceTarget) {
        pace.style.opacity = "0";
      } else {
        pace.style.opacity = "0.55";
        place(pace, paceTarget, root);
      }
    }
  }, [wordIndex, currentTyped, words, focused, paceIndex]);

  const starts: number[] = [];
  let acc = 0;
  for (const word of words) {
    starts.push(acc);
    acc += word.length + 1;
  }

  return (
    <div ref={wrapRef} className={`words-wrap ${focused ? "" : "unfocused"}`}>
      <div ref={wordsRef} className="words">
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
        <div ref={caretRef} className={`caret ${smooth ? "smooth" : ""} ${focused ? "" : "hidden"}`} />
        <div ref={paceRef} className="pace-caret" />
      </div>
    </div>
  );
}
