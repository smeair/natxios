import crypto from 'node:crypto';
import { allItems } from './bank.repository.js';

/** A stable shuffled order of the bank for a given seed. Same seed, same order. */
const cache = new Map();
export function orderFor(seed) {
  let order = cache.get(seed);
  if (!order) {
    order = allItems()
      .map((q) => ({ q, k: crypto.createHmac('sha256', seed).update(q.id).digest('hex') }))
      .sort((a, b) => (a.k < b.k ? -1 : 1))
      .map((x) => x.q);
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    cache.set(seed, order);
  }
  return order;
}
