import { useCallback, useEffect, useRef, useState } from 'react';
import { getFormToken, subscribe } from '../lib/api.js';
import useInView from '../hooks/useInView.js';
import { suggestEmail, validateConsent, validateEmail, validateName } from '../lib/validation.js';
import { Link } from '../lib/router.jsx';

const INITIAL = { name: '', email: '', consent: false, website: '' };
const RULES = {
  name: (f) => validateName(f.name),
  email: (f) => validateEmail(f.email),
  consent: (f) => validateConsent(f.consent),
};
const FIELD_IDS = { name: 'nl-name', email: 'nl-email', consent: 'nl-consent' };

export default function Newsletter() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [suggestion, setSuggestion] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const tokenRef = useRef(null);
  const [cardRef, cardIn] = useInView();

  const loadToken = useCallback(async () => {
    try {
      tokenRef.current = await getFormToken();
    } catch {
      tokenRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const checkField = (name, f) => setErrors((errs) => ({ ...errs, [name]: RULES[name]?.(f) || undefined }));

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...form, [name]: type === 'checkbox' ? checked : value };
    setForm(next);
    // Live feedback once a field has been visited (or for the checkbox straight away).
    if (touched[name] || type === 'checkbox') checkField(name, next);
    else setErrors((errs) => ({ ...errs, [name]: undefined }));
    if (name === 'email') setSuggestion('');
  };

  const onBlur = (e) => {
    const { name } = e.target;
    if (!RULES[name]) return;
    setTouched((t) => ({ ...t, [name]: true }));
    if (name === 'email' && !form.email.trim()) return; // don't nag about an empty field on blur
    checkField(name, form);
    if (name === 'email' && !validateEmail(form.email)) setSuggestion(suggestEmail(form.email));
  };

  const applySuggestion = () => {
    const next = { ...form, email: suggestion };
    setForm(next);
    setSuggestion('');
    checkField('email', next);
  };

  const validateAll = () => {
    const found = {};
    for (const [name, rule] of Object.entries(RULES)) {
      const msg = rule(form);
      if (msg) found[name] = msg;
    }
    return found;
  };

  const focusFirst = (found) => {
    const first = Object.keys(FIELD_IDS).find((k) => found[k]);
    if (first) document.getElementById(FIELD_IDS[first])?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.type === 'loading') return;

    const found = validateAll();
    setErrors(found);
    setTouched({ name: true, email: true, consent: true });
    if (Object.keys(found).length) {
      focusFirst(found);
      return;
    }

    setStatus({ type: 'loading', message: '' });
    try {
      if (!tokenRef.current) await loadToken();
      const res = await subscribe({
        name: form.name.trim(),
        email: form.email.trim(),
        consent: form.consent,
        website: form.website,
        formToken: tokenRef.current || '',
      });
      setForm(INITIAL);
      setTouched({});
      setErrors({});
      setSuggestion('');
      setStatus({ type: 'success', message: res.message });
    } catch (err) {
      // Show the server's field errors next to the matching fields.
      if (Array.isArray(err.fields) && err.fields.length) {
        const fromServer = {};
        for (const f of err.fields) if (FIELD_IDS[f.field] && !fromServer[f.field]) fromServer[f.field] = f.message;
        if (Object.keys(fromServer).length) {
          setErrors(fromServer);
          focusFirst(fromServer);
        }
      }
      setStatus({ type: 'error', message: err.message });
    } finally {
      // Tokens are single-use: always fetch a fresh one.
      tokenRef.current = null;
      loadToken();
    }
  };

  return (
    <section id="newsletter" className="section newsletter" aria-labelledby="newsletter-title">
      <div className="container">
        <div ref={cardRef} className={`newsletter__card reveal${cardIn ? ' is-in' : ''}`}>
          <div className="newsletter__copy">
            <h2 id="newsletter-title" className="section__title">One new fact, every week</h2>
            <p>
              The best things we find about animals, plus our newest videos, in one
              short email. Unsubscribe any time.
            </p>
          </div>

          <form className="form" onSubmit={onSubmit} noValidate>
            {/* Honeypot: hidden from people and screen readers, bots fill it in */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="nl-website">Website</label>
              <input
                id="nl-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label htmlFor="nl-name">First name <span className="optional">(optional)</span></label>
              <input
                id="nl-name"
                name="name"
                type="text"
                autoComplete="given-name"
                maxLength={60}
                autoCapitalize="words"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'nl-name-err' : undefined}
              />
              {errors.name && <p id="nl-name-err" className="field__error">{errors.name}</p>}
            </div>

            <div className="field">
              <label htmlFor="nl-email">Email address <span className="required" aria-hidden="true">*</span></label>
              <input
                id="nl-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                spellCheck={false}
                autoCapitalize="off"
                aria-invalid={!!errors.email}
                aria-describedby={[errors.email && 'nl-email-err', suggestion && 'nl-email-hint'].filter(Boolean).join(' ') || undefined}
              />
              {errors.email && <p id="nl-email-err" className="field__error">{errors.email}</p>}
              {suggestion && (
                <p id="nl-email-hint" className="field__hint">
                  Did you mean{' '}
                  <button type="button" className="field__suggest" onClick={applySuggestion}>{suggestion}</button>?
                </p>
              )}
            </div>

            <div className="field field--check">
              <input
                id="nl-consent"
                name="consent"
                type="checkbox"
                checked={form.consent}
                onChange={onChange}
                required
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? 'nl-consent-err' : undefined}
              />
              <label htmlFor="nl-consent">Yes, send me the Natxios newsletter. <span className="required" aria-hidden="true">*</span></label>
              {errors.consent && <p id="nl-consent-err" className="field__error">{errors.consent}</p>}
            </div>

            <p className="form__legal">
              We only use your email to send the newsletter. See our <Link to="/privacy">Privacy Policy</Link>.
            </p>

            <button type="submit" className="btn btn--primary btn--block" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>

            <p
              className={`form__status form__status--${status.type}`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
