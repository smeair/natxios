async function call(path, options = {}) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong.');
    err.status = res.status;
    err.fields = data.fields;
    throw err;
  }
  return data;
}

const qs = (params) => new URLSearchParams(params).toString();

export const adminAuthConfig = () => call('/auth-config');
export const adminLogin = (email, password, code) =>
  call('/login', { method: 'POST', body: JSON.stringify(code ? { email, password, code } : { email, password }) });
export const adminLogoutEverywhere = () => call('/logout-everywhere', { method: 'POST', body: '{}' });
export const adminSignIns = () => call('/sign-ins');
export const adminLogout = () => call('/logout', { method: 'POST', body: '{}' });
export const adminMe = () => call('/me');
export const adminOverview = (days = 30) => call(`/overview?${qs({ days })}`);
export const adminHealth = () => call('/health');
export const adminSubscribers = (params) => call(`/subscribers?${qs(params)}`);
export const adminMessages = (params) => call(`/messages?${qs(params)}`);
export const adminMessageRead = (id) => call(`/messages/${encodeURIComponent(id)}/read`, { method: 'POST', body: '{}' });
export const adminMessageDelete = (id) => call(`/messages/${encodeURIComponent(id)}/delete`, { method: 'POST', body: '{}' });
export const adminErrors = (limit = 100) => call(`/errors?${qs({ limit })}`);
export const subscribersCsvUrl = (params) => `/api/admin/subscribers.csv?${qs(params)}`;
