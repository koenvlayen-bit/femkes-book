import { roleFromRequest, json } from "../lib/auth.mjs";
import { readMain, writeMain, saveText } from "../lib/store.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Alleen POST." }, 405);
  const role = roleFromRequest(req);
  if (role !== "writer" && role !== "editor") {
    return json({ error: "Niet toegestaan." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  try {
    // Boektekst opslaan — alleen schrijver
    if (body.action === "saveText") {
      if (role !== "writer") return json({ error: "Alleen de schrijver kan de tekst wijzigen." }, 403);
      if (typeof body.text !== "string" || !body.text.trim()) {
        return json({ error: "De boektekst is leeg." }, 400);
      }
      const next = await saveText(body.text);
      return json({ updatedAt: next.updatedAt });
    }

    // Lezen aan/uit — alleen schrijver
    if (body.action === "setViewing") {
      if (role !== "writer") return json({ error: "Alleen de schrijver kan dit." }, 403);
      const main = await readMain();
      const next = await writeMain({ ...main, viewingEnabled: Boolean(body.value) });
      return json({ viewingEnabled: next.viewingEnabled });
    }

    // Opmerkingen opslaan — schrijver of redacteur
    if (body.action === "saveNotes") {
      const main = await readMain();
      const next = await writeMain({
        ...main,
        userNotes: Array.isArray(body.userNotes) ? body.userNotes : main.userNotes,
        resolvedIds: Array.isArray(body.resolvedIds) ? body.resolvedIds : main.resolvedIds,
      });
      return json({ userNotes: next.userNotes, resolvedIds: next.resolvedIds });
    }

    // Noten seeden — alleen schrijver, vervangt alle bestaande noten
    if (body.action === "seedNotes") {
      if (role !== "writer") return json({ error: "Alleen de schrijver kan seeden." }, 403);
      const main = await readMain();
      const next = await writeMain({
        ...main,
        userNotes: Array.isArray(body.userNotes) ? body.userNotes : [],
        resolvedIds: [],
      });
      return json({ seeded: next.userNotes.length });
    }

    return json({ error: "Onbekende actie." }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/.netlify/functions/admin" };
