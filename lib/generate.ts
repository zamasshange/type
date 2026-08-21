import { UNIQUE_WORDS } from "./words";
import { quoteToWords, randomQuote, type Quote } from "./quotes";
import type { TestConfig } from "./types";

function pickWord(pool: string[], last?: string) {
  let word = pool[Math.floor(Math.random() * pool.length)];
  if (word === last && pool.length > 1) {
    word = pool[Math.floor(Math.random() * pool.length)];
  }
  return word;
}

function punctuate(word: string, capitalize: boolean) {
  let nextCapital = false;
  let w = word;
  if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1);
  const r = Math.random();
  if (r < 0.08) {
    w += ".";
    nextCapital = true;
  } else if (r < 0.16) {
    w += ",";
  } else if (r < 0.19) {
    w += "!";
    nextCapital = true;
  } else if (r < 0.22) {
    w += "?";
    nextCapital = true;
  } else if (r < 0.26) {
    w += "'s";
  } else if (r < 0.29) {
    w = `"${w}"`;
  } else if (r < 0.32) {
    w += ";";
  } else if (r < 0.34) {
    w += ":";
  }
  return { word: w, capitalize: nextCapital };
}

export function generateWords(
  count: number,
  options: { punctuation?: boolean; numbers?: boolean; pool?: string[] } = {},
) {
  const pool = options.pool?.length ? options.pool : UNIQUE_WORDS;
  const words: string[] = [];
  let capitalize = Boolean(options.punctuation);
  let last = "";

  while (words.length < count) {
    if (options.numbers && Math.random() < 0.08) {
      words.push(String(Math.floor(Math.random() * 1000)));
      last = words[words.length - 1];
      continue;
    }
    let word = pickWord(pool, last);
    if (options.punctuation) {
      const p = punctuate(word, capitalize);
      word = p.word;
      capitalize = p.capitalize;
    }
    words.push(word);
    last = word;
  }
  return words;
}

export function wordsForConfig(
  config: TestConfig,
  extras?: { pool?: string[]; quote?: Quote },
) {
  if (config.mode === "quote" || config.mode === "daily") {
    const quote = extras?.quote ?? randomQuote();
    return { words: quoteToWords(quote), quote };
  }
  const count =
    config.mode === "words" || config.mode === "practice"
      ? config.words
      : config.mode === "zen"
        ? 80
        : Math.max(80, config.time * 4);
  return {
    words: generateWords(count, {
      punctuation: config.punctuation,
      numbers: config.numbers,
      pool: extras?.pool,
    }),
  };
}

export function appendWords(config: TestConfig, existing: string[], n = 40) {
  return existing.concat(
    generateWords(n, {
      punctuation: config.punctuation,
      numbers: config.numbers,
    }),
  );
}

export function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
