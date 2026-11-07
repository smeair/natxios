import Subscriber from './subscriber.model.js';
import { isDBReady } from '../../config/db.js';
import { verifyFormToken } from '../formToken/formToken.service.js';
import { hashIp } from '../../common/utils/hash.js';
import { HttpError } from '../../common/utils/httpError.js';
import { track } from '../metrics/metrics.service.js';

/**
 * Subscribes an email. Returns quietly for bots (honeypot) and for existing
 * subscribers, so the response never reveals whether an email is on the list.
 */
export async function subscribe({ email, name, formToken, website }, { ip, userAgent }) {
  if (website) return; // honeypot tripped: pretend it worked, store nothing

  if (!(await verifyFormToken(formToken)).ok) {
    throw new HttpError(400, 'Your session expired. Please refresh and try again.');
  }
  if (!isDBReady()) {
    throw new HttpError(503, 'Newsletter sign-ups are temporarily unavailable. Please try again soon.');
  }

  try {
    const result = await Subscriber.updateOne(
      { email },
      {
        $setOnInsert: {
          email,
          name: name || undefined,
          status: 'pending',
          consentAt: new Date(),
          source: 'website',
          ipHash: hashIp(ip),
          userAgent: (userAgent || '').slice(0, 300),
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount) track('signups');
  } catch (err) {
    if (err?.code !== 11000) throw err; // duplicate from a concurrent upsert is fine
  }
}
