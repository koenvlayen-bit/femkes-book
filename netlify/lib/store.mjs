import { getStore } from "@netlify/blobs";

function store() {
  return getStore("femkes-book");
}

export async function readMain() {
  const s = (await store().get("settings", { type: "json" })) || {};
  return {
    viewingEnabled: s.viewingEnabled !== undefined ? Boolean(s.viewingEnabled) : true,
    updatedAt: s.updatedAt || null,
    userNotes: s.userNotes || [],
    resolvedIds: s.resolvedIds || [],
  };
}

export async function writeMain(data) {
  const next = { ...data, updatedAt: new Date().toISOString() };
  await store().setJSON("settings", next);
  return next;
}

export async function readText() {
  return (await store().get("booktext", { type: "text" })) || null;
}

export async function saveText(text) {
  await store().set("booktext", text, { contentType: "text/plain" });
  const main = await readMain();
  return writeMain({ ...main });
}
