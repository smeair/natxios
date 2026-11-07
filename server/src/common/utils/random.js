import crypto from 'node:crypto';

/** Unbiased Fisher Yates shuffle using a cryptographic RNG. Returns a new array. */
export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = (items, n) => shuffle(items).slice(0, n);
