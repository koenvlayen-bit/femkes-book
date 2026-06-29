const BIN_ID = '6a41501cf5f4af5e293dd4e3'
const MASTER_KEY = '$2a$10$OvyxDPfZADoBlkt0WdZX/eQP977ceQ/JuaHoVSUI2nxSjyByvQKjq'
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': MASTER_KEY,
  'X-Bin-Versioning': 'false',
}
export async function getData() {
  try {
    const res = await fetch(BASE_URL + '/latest', { headers: HEADERS })
    const json = await res.json()
    return json.record
  } catch { return { viewingEnabled: true, suggestions: [], inlineNotes: [] } }
}
export async function setData(data) {
  try {
    await fetch(BASE_URL, { method: 'PUT', headers: HEADERS, body: JSON.stringify(data) })
  } catch(e) { console.error(e) }
}
