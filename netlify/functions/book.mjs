import { roleFromRequest, json } from "../lib/auth.mjs";
import { readMain, readText } from "../lib/store.mjs";

export default async (req) => {
  const role = roleFromRequest(req);
  if (!role) return json({ error: "Je bent niet aangemeld." }, 401);

  try {
    const main = await readMain();
    // Lezers mogen enkel lezen als viewingEnabled
    if (role === "reader" && !main.viewingEnabled) {
      return json({
        available: false,
        viewingEnabled: false,
        userNotes: [],
        resolvedIds: [],
        text: null,
      });
    }
    const text = await readText();
    return json({
      available: true,
      viewingEnabled: main.viewingEnabled,
      updatedAt: main.updatedAt,
      userNotes: main.userNotes || [],
      resolvedIds: main.resolvedIds || [],
      text,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/.netlify/functions/book" };
