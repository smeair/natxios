import { useCallback, useEffect, useRef, useState } from 'react';
import { getFormToken, sendContact } from '../lib/api.js';
import {
  CONTACT_SUBJECTS, suggestEmail, validateContactName, validateEmail, validateMessage, validateSubject,
} from '../lib/validation.js';
import { Link } from '../lib/router.jsx';

const INITIAL = { name: '', email: '', subject: '', message: '', website: '' };
const MAX = 4000;
const RULES = {
  name: (f) => validateContactName(f.name),
  email: (f) => validateEmail(f.email),
  subject: (f) => validateSubject(f.subject),
  message: (f) => validateMessage(f.message),
};
const IDS = { name: 'ct-name', email: 'ct-email', subject: 'ct-subject', message: 'ct-message' };

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [suggestion, setSuggestion] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const tokenRef = useRef(null);

  useEffect(() => {
    document.title = 'Contact | Natxios';
  }, []);

  const loadToken = useCallback(async () => {
    try {
      tokenRef.current = await getFormToken();
    } catch {
      tokenRef.current = null;
    }
  }, []);
  useEffect(() => { loadToken(); }, [loadToken]);

  const check = (name, f) => setErrors((e) => ({ ...e, [name]: RULES[name]?.(f) || undefined }));

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name]) check(name, next);
    if (name === 'email') setSuggestion('');
  };

  const onBlur = (e) => {
    const { name } = e.target;
    if (!RULES[name] || !form[name]) return;
    setTouched((t) => ({ ...t, [name]: true }));
    check(name, form);
    if (name === 'email' && !validateEmail(form.email)) setSuggestion(suggestEmail(form.email));
  };

  const focusFirst = (found) => {
    const first = Object.keys(IDS).find((k) => found[k]);
    if (first) document.getElementById(IDS[first])?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.type === 'loading') return;
    const found = {};
    for (const [k, rule] of Object.entries(RULES)) {
      const m = rule(form);
      if (m) found[k] = m;
    }
    setErrors(found);
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.keys(found).length) return focusFirst(found);

    setStatus({ type: 'loading', message: '' });
    try {
      if (!tokenRef.current) await loadToken();
      const res = await sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
        website: form.website,
        formToken: tokenRef.current || '',
      });
      setForm(INITIAL);
      setTouched({});
      setErrors({});
      setStatus({ type: 'success', message: res.message });
    } catch (err) {
      if (Array.isArray(err.fields)) {
        const fromServer = {};
        for (const f of err.fields) if (IDS[f.field] && !fromServer[f.field]) fromServer[f.field] = f.message;
        setErrors(fromServer);
        focusFirst(fromServer);
      }
      setStatus({ type: 'error', message: err.message });
    } finally {
      tokenRef.current = null; // single use: always fetch a fresh token
      loadToken();
    }
  };

  const describedBy = (k, extra) => [errors[k] && `${IDS[k]}-err`, extra].filter(Boolean).join(' ') || undefined;

  return (
    <section className="contact" aria-labelledby="contact-title">
      <div className="contact__intro">
        <h1 id="contact-title" className="page-head__title">Get in touch</h1>
        <p className="page-head__lead">
          Spotted a fact that needs correcting, want to work with us, or just want to say hello? Send us a message
          and we'll reply by email.
        </p>
      </div>

      {status.type === 'success' ? (
        <div className="contact__card contact__done" role="status">
          <h2>Message sent</h2>
          <p>{status.message}</p>
          <button type="button" className="btn btn--ghost" onClick={() => setStatus({ type: 'idle', message: '' })}>Send another message</button>
        </div>
      ) : (
        <form className="contact__card form" onSubmit={onSubmit} noValidate>
          {/* Honeypot: hidden from people and screen readers, bots fill it in */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="ct-website">Website</label>
            <input id="ct-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={onChange} />
          </div>

          <div className="contact__row">
            <div className="field">
              <label htmlFor="ct-name">Your name <span className="required" aria-hidden="true">*</span></label>
              <input id="ct-name" name="name" type="text" autoComplete="name" maxLength={80} required
                value={form.name} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.name} aria-describedby={describedBy('name')} />
              {errors.name && <p id="ct-name-err" className="field__error">{errors.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="ct-email">Your email <span className="required" aria-hidden="true">*</span></label>
              <input id="ct-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required
                spellCheck={false} autoCapitalize="off"
                value={form.email} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.email}
                aria-describedby={describedBy('email', suggestion && 'ct-email-hint')} />
              {errors.email && <p id="ct-email-err" className="field__error">{errors.email}</p>}
              {suggestion && (
                <p id="ct-email-hint" className="field__hint">
                  Did you mean{' '}
                  <button type="button" className="field__suggest" onClick={() => { const n = { ...form, email: suggestion }; setForm(n); setSuggestion(''); check('email', n); }}>{suggestion}</button>?
                </p>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="ct-subject">Subject <span className="required" aria-hidden="true">*</span></label>
            <select id="ct-subject" name="subject" required value={form.subject}
              onChange={(e) => { onChange(e); setTouched((t) => ({ ...t, subject: true })); check('subject', { ...form, subject: e.target.value }); }}
              aria-invalid={!!errors.subject} aria-describedby={describedBy('subject')}>
              <option value="" disabled>Choose a subject</option>
              {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.subject && <p id="ct-subject-err" className="field__error">{errors.subject}</p>}
          </div>

          <div className="field">
            <label htmlFor="ct-message">Message <span className="required" aria-hidden="true">*</span></label>
            <textarea id="ct-message" name="message" rows={7} maxLength={MAX} required
              value={form.message} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.message}
              aria-describedby={describedBy('message', 'ct-message-count')} />
            <div className="field__meta">
              {errors.message ? <p id="ct-message-err" className="field__error">{errors.message}</p> : <span />}
              <span id="ct-message-count" className={`field__count${form.message.length > MAX * 0.9 ? ' is-near' : ''}`}>
                {form.message.length.toLocaleString()} / {MAX.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="form__legal">
            We only use your details to reply to you. See our <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <button type="submit" className="btn btn--primary btn--block" disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Sending…' : 'Send message'}
          </button>
          <p className={`form__status form__status--${status.type}`} role="status" aria-live="polite">
            {status.type === 'error' ? status.message : ''}
          </p>
        </form>
      )}
    </section>
  );
}
