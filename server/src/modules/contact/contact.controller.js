import * as service from './contact.service.js';

export async function submit(req, res) {
  await service.submit(req.valid.body, { ip: req.ip, userAgent: req.get('user-agent') });
  res.status(201).json({ message: "Thanks, your message is on its way. We'll reply by email." });
}
