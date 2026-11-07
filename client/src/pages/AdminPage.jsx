import { useCallback, useEffect, useState } from 'react';
import {
  adminAuthConfig, adminErrors, adminHealth, adminLogin, adminLogout, adminLogoutEverywhere, adminMe, adminOverview,
  adminSignIns, adminSubscribers, subscribersCsvUrl, adminMessages, adminMessageRead, adminMessageDelete,
} from '../lib/adminApi.js';
import BarChart from '../components/admin/BarChart.jsx';
import Logo from '../components/Logo.jsx';
import { validateEmail } from '../lib/validation.js';

const TABS = ['Overview', 'Messages', 'Mailing list', 'Errors', 'Health', 'Security'];
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '0%');
const when = (iso) => (iso ? new Date(iso).toLocaleString() : '');

function Login({ onDone }) {
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    adminAuthConfig().then((c) => setTwoFactor(!!c.twoFactor)).catch(() => {});
  }, []);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ busy: false, message: '' });

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) found.email = emailErr;
    if (!form.password) found.password = 'Enter your password.';
    if (twoFactor && !/^\d{6}$/.test(form.code)) found.code = 'Enter the 6 digit code from your authenticator app.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus({ busy: true, message: '' });
    try {
      await adminLogin(form.email.trim(), form.password, twoFactor ? form.code : undefined);
      onDone();
    } catch (err) {
      setStatus({ busy: false, message: err.message });
      setForm((f) => ({ ...f, password: '', code: '' }));
    }
  };

  return (
    <main className="admin admin--login">
      <form className="admin-login" onSubmit={submit} noValidate>
        <Logo />
        <h1 className="admin-login__title">Admin sign in</h1>
        <div className="field">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" autoComplete="username" value={form.email} maxLength={254}
            onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
          {errors.email && <p className="field__error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={form.password} maxLength={200}
            onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} />
          {errors.password && <p className="field__error">{errors.password}</p>}
        </div>
        {twoFactor && (
          <div className="field">
            <label htmlFor="admin-code">Authenticator code</label>
            <input id="admin-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.code} />
            {errors.code && <p className="field__error">{errors.code}</p>}
          </div>
        )}
        <button type="submit" className="btn btn--primary btn--block" disabled={status.busy}>
          {status.busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="form__status form__status--error" role="alert">{status.message}</p>
      </form>
    </main>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{fmt(value)}</p>
      {sub && <p className="stat__sub">{sub}</p>}
    </div>
  );
}

function Overview({ data }) {
  const { series, topPages } = data.metrics;
  const today = series[series.length - 1];
  const sum = (k) => series.reduce((a, d) => a + d[k], 0);
  return (
    <>
      <section className="stats">
        <Stat label="Visitors today" value={today.visitors} sub={`${fmt(sum('visitors'))} in ${series.length} days`} />
        <Stat label="Page views today" value={today.pageviews} sub={`${fmt(sum('pageviews'))} in ${series.length} days`} />
        <Stat label="Quiz rounds today" value={today.quiz_rounds} sub={`${pct(today.quiz_correct, today.quiz_answers)} answers correct`} />
        <Stat label="New subscribers today" value={today.signups}
          sub={data.subscribers.available ? `${fmt(data.subscribers.total)} on the list` : 'Database not connected'} />
        <Stat label="Messages today" value={today.contact_messages} sub="From the contact form" />
        <Stat label="Blocked today" value={today.rate_limited + today.bans} sub={`${fmt(today.bans)} IPs banned`} />
        <Stat label="Errors (24h)" value={data.health.errorsLast24h} sub={data.health.errorsLast24h ? 'See the Errors tab' : 'All quiet'} />
      </section>
      <section className="admin-panel">
        <BarChart title="Visitors per day" data={series} valueKey="visitors" unit="visitors" />
      </section>
      <section className="admin-panel admin-panel--split">
        <BarChart title="Quiz rounds per day" data={series} valueKey="quiz_rounds" unit="rounds" />
        <div>
          <h2 className="admin-panel__title">Top pages today</h2>
          {topPages.length ? (
            <table className="admin-table">
              <thead><tr><th>Page</th><th>Views</th></tr></thead>
              <tbody>{topPages.map((p) => <tr key={p.page}><td>{p.page}</td><td>{fmt(p.views)}</td></tr>)}</tbody>
            </table>
          ) : <p className="admin-empty">No page views yet today.</p>}
        </div>
      </section>
    </>
  );
}

function MailingList() {
  const [query, setQuery] = useState({ search: '', status: 'all', page: 1 });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      adminSubscribers(query).then((d) => alive && setData(d)).catch((e) => alive && setError(e.message));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  if (error) return <p className="admin-empty">{error}</p>;
  if (!data) return <p className="admin-empty">Loading…</p>;
  if (!data.available) return <p className="admin-empty">The database is not connected, so subscribers can't be shown. Set MONGODB_URI in server/.env.</p>;

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <input type="search" placeholder="Search email or name" value={query.search} maxLength={100}
          onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} aria-label="Search subscribers" />
        <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <a className="btn btn--ghost btn--sm" href={subscribersCsvUrl({ search: query.search, status: query.status })}>Export CSV</a>
      </div>
      <p className="admin-count">{fmt(data.total)} subscribers</p>
      <table className="admin-table">
        <thead><tr><th>Email</th><th>Name</th><th>Status</th><th>Joined</th></tr></thead>
        <tbody>
          {data.items.map((s) => (
            <tr key={s.email}><td>{s.email}</td><td>{s.name || ''}</td><td><span className={`pill pill--${s.status}`}>{s.status}</span></td><td>{when(s.createdAt)}</td></tr>
          ))}
        </tbody>
      </table>
      {data.pages > 1 && (
        <div className="admin-pager">
          <button type="button" className="btn btn--ghost btn--sm" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={query.page >= data.pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
        </div>
      )}
    </section>
  );
}

function Messages() {
  const [query, setQuery] = useState({ search: '', status: 'all', page: 1 });
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    adminMessages(query).then(setData).catch((e) => setError(e.message));
  }, [query]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const view = async (m) => {
    setOpen(open === m.id ? null : m.id);
    if (m.status === 'new') {
      await adminMessageRead(m.id).catch(() => {});
      load();
    }
  };
  const remove = async (m) => {
    await adminMessageDelete(m.id).catch(() => {});
    setOpen(null);
    load();
  };

  if (error) return <p className="admin-empty">{error}</p>;
  if (!data) return <p className="admin-empty">Loading…</p>;
  if (!data.available) return <p className="admin-empty">The database is not connected, so saved messages can't be shown. Messages are still emailed if SMTP is set up.</p>;

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <input type="search" placeholder="Search name, email or message" value={query.search} maxLength={100}
          onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} aria-label="Search messages" />
        <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} aria-label="Filter messages">
          <option value="all">All messages</option>
          <option value="new">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
      <p className="admin-count">{fmt(data.total)} messages, {fmt(data.unread)} unread</p>
      {data.items.length === 0 ? <p className="admin-empty">No messages yet.</p> : (
        <ul className="msg-list">
          {data.items.map((m) => (
            <li key={m.id} className={m.status === 'new' ? 'is-new' : ''}>
              <button type="button" className="msg-list__head" onClick={() => view(m)} aria-expanded={open === m.id}>
                <span className="msg-list__from">{m.name} <span>&lt;{m.email}&gt;</span></span>
                <span className="msg-list__subject">{m.subject}</span>
                <span className="msg-list__time">{when(m.createdAt)}</span>
              </button>
              {open === m.id && (
                <div className="msg-list__body">
                  <p className="msg-list__text">{m.message}</p>
                  <div className="admin-toolbar">
                    <a className="btn btn--primary btn--sm" href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply by email</a>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(m)}>Delete</button>
                    <span className="admin-note">{m.emailed ? 'Also sent to the inbox' : 'Not emailed (SMTP not set up or failed)'}</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.pages > 1 && (
        <div className="admin-pager">
          <button type="button" className="btn btn--ghost btn--sm" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={query.page >= data.pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
        </div>
      )}
    </section>
  );
}

function Errors() {
  const [items, setItems] = useState(null);
  const load = useCallback(() => adminErrors(100).then((d) => setItems(d.items)).catch(() => setItems([])), []);
  useEffect(() => { load(); }, [load]);
  if (!items) return <p className="admin-empty">Loading…</p>;
  return (
    <section className="admin-panel">
      <div className="admin-toolbar"><button type="button" className="btn btn--ghost btn--sm" onClick={load}>Refresh</button></div>
      {items.length === 0 ? <p className="admin-empty">No errors logged. All quiet.</p> : (
        <ul className="error-list">
          {items.map((e, i) => (
            <li key={`${e.time}-${i}`}>
              <details>
                <summary>
                  <span className="error-list__time">{when(e.time)}</span>
                  <span className="error-list__msg">{e.message}</span>
                  {e.path && <span className="error-list__path">{e.method} {e.path} · {e.status}</span>}
                </summary>
                {e.stack && <pre>{e.stack}</pre>}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Health() {
  const [h, setH] = useState(null);
  const load = useCallback(() => adminHealth().then(setH).catch(() => setH(null)), []);
  useEffect(() => { load(); }, [load]);
  if (!h) return <p className="admin-empty">Loading…</p>;
  const mins = Math.floor(h.uptimeSeconds / 60);
  const rows = [
    ['Status', h.status],
    ['Database', h.checks.database],
    ['Redis', h.checks.redis],
    ['Question bank', `${fmt(h.checks.questionBank)} questions`],
    ['Errors in last 24h', fmt(h.errorsLast24h)],
    ['Uptime', mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`],
    ['Memory', `${h.memoryMb.rss} MB (heap ${h.memoryMb.heapUsed} MB)`],
    ['Node', h.node],
    ['Environment', h.environment],
    ['Version', h.version],
  ];
  return (
    <section className="admin-panel">
      <div className="admin-toolbar"><button type="button" className="btn btn--ghost btn--sm" onClick={load}>Refresh</button></div>
      <table className="admin-table admin-table--kv">
        <tbody>{rows.map(([k, v]) => (
          <tr key={k}><th>{k}</th><td><span className={`pill pill--${/down/.test(v) ? 'bad' : /connected|ok/.test(v) ? 'good' : 'neutral'}`}>{v}</span></td></tr>
        ))}</tbody>
      </table>
    </section>
  );
}

function Security({ onSignedOut, twoFactor }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { adminSignIns().then((d) => setItems(d.items)).catch(() => setItems([])); }, []);
  const everywhere = async () => {
    setBusy(true);
    await adminLogoutEverywhere().catch(() => {});
    onSignedOut();
  };
  return (
    <>
      <section className="admin-panel">
        <h2 className="admin-panel__title">Sessions</h2>
        <p className="admin-note">
          Two-factor login is <strong>{twoFactor ? 'on' : 'off'}</strong>.
          {!twoFactor && ' Turn it on with npm run admin:2fa in the server folder (required in production).'}
        </p>
        <button type="button" className="btn btn--ghost btn--sm" onClick={everywhere} disabled={busy}>Sign out everywhere</button>
        <p className="admin-note">Ends every admin session on every device, including this one.</p>
      </section>
      <section className="admin-panel">
        <h2 className="admin-panel__title">Recent sign-ins</h2>
        {!items ? <p className="admin-empty">Loading…</p> : items.length === 0 ? <p className="admin-empty">No sign-ins recorded yet.</p> : (
          <table className="admin-table">
            <thead><tr><th>Time</th><th>Result</th><th>Network</th><th>Device</th></tr></thead>
            <tbody>{items.map((s, i) => (
              <tr key={`${s.time}-${i}`}>
                <td>{when(s.time)}</td>
                <td><span className={`pill pill--${s.ok ? 'good' : 'bad'}`}>{s.ok ? 'Signed in' : `Failed${s.reason ? `: ${s.reason}` : ''}`}</span></td>
                <td><code>{s.network}</code></td>
                <td className="admin-table__device">{s.device}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState('checking'); // checking | out | in
  const [email, setEmail] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    document.title = 'Admin | Natxios';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const check = useCallback(() => {
    adminMe().then((d) => { setEmail(d.email); setTwoFactor(!!d.twoFactor); setAuth('in'); }).catch(() => setAuth('out'));
  }, []);
  useEffect(() => { check(); }, [check]);

  useEffect(() => {
    if (auth !== 'in' || tab !== 'Overview') return;
    adminOverview(30).then(setOverview).catch((e) => { if (e.status === 401) setAuth('out'); });
  }, [auth, tab]);

  if (auth === 'checking') return <main className="admin"><p className="admin-empty">Loading…</p></main>;
  if (auth === 'out') return <Login onDone={check} />;

  const logout = async () => {
    await adminLogout().catch(() => {});
    setAuth('out');
    setOverview(null);
  };

  return (
    <main className="admin">
      <header className="admin-head">
        <Logo />
        <span className="admin-head__badge">Admin</span>
        <nav className="admin-tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t} type="button" className={`admin-tab${tab === t ? ' is-active' : ''}`} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
        <div className="admin-head__user">
          <span>{email}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>Sign out</button>
        </div>
      </header>
      {tab === 'Overview' && (overview ? <Overview data={overview} /> : <p className="admin-empty">Loading…</p>)}
      {tab === 'Messages' && <Messages />}
      {tab === 'Mailing list' && <MailingList />}
      {tab === 'Errors' && <Errors />}
      {tab === 'Health' && <Health />}
      {tab === 'Security' && <Security twoFactor={twoFactor} onSignedOut={() => { setAuth('out'); setOverview(null); }} />}
    </main>
  );
}
