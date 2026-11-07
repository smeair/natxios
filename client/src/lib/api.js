async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.fields = data.fields;
    err.code = data.code;
    err.resetAt = data.resetAt;
    throw err;
  }
  return data;
}

export const getFormToken = () => request('/form-token').then((d) => d.token);

export const subscribe = (payload) =>
  request('/newsletter', { method: 'POST', body: JSON.stringify(payload) });

export const getFactOfDay = () => request('/facts/today');

export const sendContact = (payload) => request('/contact', { method: 'POST', body: JSON.stringify(payload) });

const qs = (params) => new URLSearchParams(params).toString();

export const getQuizStatus = (player) => request(`/quiz/status?${qs({ player })}`);

export const getQuiz = (player) => request('/quiz/round', { method: 'POST', body: JSON.stringify({ player }) });

export const checkAnswer = (roundToken, questionId, optionId) =>
  request('/quiz/answer', { method: 'POST', body: JSON.stringify({ roundToken, questionId, optionId }) });
