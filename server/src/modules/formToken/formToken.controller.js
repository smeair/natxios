import { issueFormToken } from './formToken.service.js';

export function issue(_req, res) {
  res.json({ token: issueFormToken() });
}
