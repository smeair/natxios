import { getToday } from './facts.service.js';

export async function today(req, res) {
  const data = await getToday();
  // Same for everyone until midnight UTC, so browsers and CDNs may cache it until then.
  const secondsLeft = Math.max(60, Math.floor((new Date(data.nextAt).getTime() - Date.now()) / 1000));
  res.set('Cache-Control', `public, max-age=${secondsLeft}, s-maxage=${secondsLeft}`);
  res.json(data);
}
