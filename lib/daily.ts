import { QUOTES, quoteToWords } from "./quotes";
import { hashString, mulberry32 } from "./generate";

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallenge(date = new Date()) {
  const key = todayKey(date);
  const rng = mulberry32(hashString(`typehaven-daily-${key}`));
  const quote = QUOTES[Math.floor(rng() * QUOTES.length)];
  return {
    key,
    quote,
    words: quoteToWords(quote),
    time: 60 as const,
  };
}
