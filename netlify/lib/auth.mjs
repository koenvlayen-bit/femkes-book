// Credentials — zelfde als in App.jsx
const CREDS = {
  Femke: { pin: "6600", role: "writer" },
  "Femke Janssens": { pin: "6600", role: "writer" },
  Koen: { pin: "6601", role: "editor" },
  "Koen Vlayen": { pin: "6601", role: "editor" },
};
const READER_PIN = "6699";

export function roleFromRequest(req) {
  const name = decodeURIComponent(req.headers.get("x-user-name") || "");
  const pin = req.headers.get("x-user-pin") || "";
  if (!name || !pin) return null;
  const known = CREDS[name];
  if (known && pin === known.pin) return known.role;
  if (pin === READER_PIN) return "reader";
  return null;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
