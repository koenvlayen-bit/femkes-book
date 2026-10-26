import { getStore } from "@netlify/blobs";

function store() {
  return getStore({ name: "femkes-book", consistency: "strong" });
}

export async function readMain() {
  try {
    const s = await store().get("settings", { type: "json" });
    if (!s) return { viewingEnabled: true, updatedAt: null, userNotes: [], resolvedIds: [] };
    return {
      viewingEnabled: s.viewingEnabled !== undefined ? Boolean(s.viewingEnabled) : true,
      updatedAt: s.updatedAt || null,
      userNotes: Array.isArray(s.userNotes) ? s.userNotes : [],
      resolvedIds: Array.isArray(s.resolvedIds) ? s.resolvedIds : [],
    };
  } catch (e) {
    console.error("[store] readMain fout:", e.message);
    return { viewingEnabled: true, updatedAt: null, userNotes: [], resolvedIds: [] };
  }
}

export async function writeMain(data) {
  const next = { ...data, updatedAt: new Date().toISOString() };
  await store().setJSON("settings", next);
  return next;
}

export async function readText() {
  try {
    return (await store().get("booktext", { type: "text" })) || null;
  } catch (e) {
    console.error("[store] readText fout:", e.message);
    return null;
  }
}

export async function saveText(text) {
  await store().set("booktext", text, { contentType: "text/plain" });
  const main = await readMain();
  return writeMain({ ...main });
}
