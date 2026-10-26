const SESSION_KEY = "femkes-book:sessie";

export function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
}
export function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

async function request(path, { session, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (session) {
    headers["X-User-Name"] = encodeURIComponent(session.name);
    headers["X-User-Pin"] = session.pin;
  }
  const res = await fetch(`/.netlify/functions/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Fout (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fetchBook = (session) => request("book", { session });
export const setViewing = (session, value) =>
  request("admin", { session, method: "POST", body: { action: "setViewing", value } });
export const saveBookText = (session, text) =>
  request("admin", { session, method: "POST", body: { action: "saveText", text } });
export const saveNotes = (session, userNotes, resolvedIds) =>
  request("admin", { session, method: "POST", body: { action: "saveNotes", userNotes, resolvedIds } });
export const seedNotes = (session, userNotes) =>
  request("admin", { session, method: "POST", body: { action: "seedNotes", userNotes } });
