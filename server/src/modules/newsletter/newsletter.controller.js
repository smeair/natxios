import * as service from './newsletter.service.js';

const SUCCESS = { message: "Thanks, you're subscribed. Look out for our next email." };

export async function signup(req, res) {
  await service.subscribe(req.valid.body, { ip: req.ip, userAgent: req.get('user-agent') });
  res.status(201).json(SUCCESS);
}
