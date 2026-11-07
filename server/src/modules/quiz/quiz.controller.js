import * as service from './quiz.service.js';
import { getAllowance, useRound } from './quiz.gate.js';
import { issueRoundToken } from './roundToken.js';
import { track } from '../metrics/metrics.service.js';

export async function status(req, res) {
  res.json(await getAllowance(req.valid.query.player, req.ip));
}

export async function round(req, res) {
  const { player } = req.valid.body;
  const allowance = await useRound(player, req.ip);
  const questions = await service.getRound(player);
  const roundToken = issueRoundToken(player, questions.map((q) => q.id));
  track('quiz_rounds', req);
  res.json({ questions, roundToken, allowance });
}

export async function answer(req, res) {
  const result = await service.checkAnswer(req.valid.body);
  track('quiz_answers', req);
  if (result.correct) track('quiz_correct', req);
  res.json(result);
}
