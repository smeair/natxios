/*
 * The browser only keeps an anonymous player id. The question order and the position in
 * the bank are chosen and stored by the server, so they can't be tampered with.
 */
const KEY = 'natxios-quiz';
let memory = null;

function newId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getPlayerId() {
  try {
    const data = JSON.parse(window.localStorage.getItem(KEY));
    if (data && /^[A-Za-z0-9_-]{8,40}$/.test(data.player || '')) return data.player;
  } catch {
    /* storage blocked or corrupt */
  }
  if (!memory) memory = newId();
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ player: memory }));
  } catch {
    /* keep it in memory for this visit */
  }
  return memory;
}
