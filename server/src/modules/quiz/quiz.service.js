import crypto from 'node:crypto';
import env from '../../config/env.js';
import { allItems } from '../bank/bank.repository.js';
import { orderFor } from '../bank/ordering.js';
import { shuffle } from '../../common/utils/random.js';
import { HttpError } from '../../common/utils/httpError.js';
import { kv } from '../../common/store/kv.js';
import { markAnswered, readRoundToken } from './roundToken.js';

export const QUESTIONS_PER_ROUND = env.QUIZ_QUESTIONS_PER_ROUND;
const PROGRESS_TTL_MS = 400 * 24 * 60 * 60 * 1000;

const hmac = (label, value, len) =>
  crypto.createHmac('sha256', env.QUIZ_SECRET).update(`${label}:${value}`).digest('base64url').slice(0, len);

/*
 * Question ids sent to the browser are opaque (an HMAC of the real id), so ids like
 * "blue-whale-largest-ever" can't give answers away. Option ids are an HMAC of question
 * and option text, so the browser can't tell which option is correct.
 */
const publicId = (id) => hmac('qid', id, 16);
const optionId = (id, text) => hmac(`opt:${id}`, text, 16);

let byPublicId = null;
function resolve(pid) {
  if (!byPublicId) byPublicId = new Map(allItems().map((q) => [publicId(q.id), q]));
  return byPublicId.get(pid) || null;
}

/*
 * Each player's position in the bank is chosen and stored by the SERVER (Redis or memory),
 * in a random order unique to that player. Clients can't pick the order or the position,
 * so several clients can't split the bank between them to copy it.
 */
const progressKey = (player) => `quiz:progress:${player}`;
const newSeed = () => crypto.randomBytes(16).toString('base64url');

async function loadProgress(player) {
  const raw = await kv.get(progressKey(player));
  if (raw) {
    try {
      const p = JSON.parse(raw);
      if (typeof p.seed === 'string' && Number.isInteger(p.pos)) return p;
    } catch {
      /* corrupt: start again */
    }
  }
  return { seed: newSeed(), pos: 0 };
}

/** The next round for this player, advancing their stored position. */
export async function getRound(player, count = QUESTIONS_PER_ROUND) {
  let { seed, pos } = await loadProgress(player);
  let order = orderFor(seed);
  if (pos + count > order.length) {
    // Seen the whole bank: start a new cycle in a fresh random order.
    seed = newSeed();
    pos = 0;
    order = orderFor(seed);
  }
  const picked = order.slice(pos, pos + count);
  await kv.set(progressKey(player), JSON.stringify({ seed, pos: pos + picked.length }), PROGRESS_TTL_MS);

  return picked.map((q) => ({
    id: publicId(q.id),
    topic: q.topic,
    question: q.question,
    options: shuffle([q.answer, ...q.wrong]).map((text) => ({ id: optionId(q.id, text), text })),
  }));
}

export async function checkAnswer({ roundToken, questionId, optionId: given }) {
  const round = readRoundToken(roundToken);
  if (!round || !round.q.includes(questionId)) {
    throw new HttpError(403, 'This round has expired. Start a new quiz.');
  }
  const q = resolve(questionId);
  if (!q) throw new HttpError(404, 'That question is no longer available. Start a new quiz.');
  if (!(await markAnswered(round.n, questionId))) {
    throw new HttpError(409, 'You have already answered this question.');
  }

  const correctId = optionId(q.id, q.answer);
  const a = Buffer.from(given);
  const b = Buffer.from(correctId);
  const correct = a.length === b.length && crypto.timingSafeEqual(a, b);

  return { correct, correctOptionId: correctId, answer: q.answer, detail: q.detail };
}
