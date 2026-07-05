import { useState, useEffect, useRef } from 'react'
import { getData, setData } from './jsonbin.js'
import BOOK_TEXT from './bookText.js'
import './App.css'

const INITIAL_NOTES = [
  { id: 1003, type: 'inline', resolved: false, quote: 'Vier jongeren wankelden over de strip', pos: 1178, text: 'PROLOOG — tempo: De opbouw werkt uitstekend, maar het stuk tussen de joint en het eerste geluid gaat iets te snel. Overweeg een extra alinea waarin de jongens tot rust komen, wat lachen en plezier maken, dan de stilte van de nacht laten terugkeren. Dat maakt de breuk (het gehijg) veel abrupter en dus angstaanjagender.', author: 'Koen', date: '28 juni 2026' },
  { id: 1010, type: 'inline', resolved: false, quote: 'Dit was het leven! Overdag luieren op de strandbedden van Star Beach', pos: 1759, text: 'Structuur: deze karakterisering van Jarne komt iets te vroeg, nog voor we de sfeer goed hebben. Overweeg dit blokje te verplaatsen naar nádat de joint aangestoken is. Dan voelt het als een dronken monoloog in zijn hoofd — het vervolg met de geur komt dan minder abrupt.', author: 'Koen', date: '28 juni 2026' },
  { id: 1004, type: 'inline', resolved: false, quote: 'Een overweldigend geloei van heel dichtbij', pos: 3555, text: 'Heel effectief. De opbouw van geluiden (gehijg → voetstappen → geloei) werkt uitstekend als spanningstechniek. Ik ben nog steeds fan van een MUUUH-geluid.', author: 'Koen', date: '28 juni 2026' },
  { id: 1005, type: 'inline', resolved: false, quote: 'Bel Mavrakis!', pos: 21066, text: 'Sterke cliffhanger om het hoofdstuk mee te eindigen. Zulke hoofdstukafsluiters mag je zeker vaker gebruiken, dat werkt sterk.', author: 'Koen', date: '28 juni 2026' },
  { id: 1011, type: 'inline', resolved: false, quote: 'Thomas Brend rekte zich loom uit en zocht met zijn arm naar Sophia.', pos: 5200, text: 'H1 — Thomas: laat zijn emotionele toestand (tranen, spiegel, het water) iets langer duren — dat is het sterkste stuk van het hoofdstuk. De eerste wanhoop al beter benadrukken. Misschien ook "gulzig" vervangen door "slokte een flesje water binnen" — dat klinkt beter bij het wanhopige moment.', author: 'Koen', date: '28 juni 2026' },
  { id: 1001, type: 'inline', resolved: false, quote: 'Het bleef oorverdovend stil.', pos: 5480, text: 'Misschien beter als gedachte tonen i.p.v. uitroep naar Sophia? Zoiets als: "Was Sophia in de badkamer? Hij riep haar zacht, maar het bleef oorverdovend stil. Vreemd, zelfs de cicades bleken vandaag geruisloos, alsof een onheilspellende dreiging hun tjirpende geluiden had verstomd."', author: 'Koen', date: '28 juni 2026' },
  { id: 1012, type: 'inline', resolved: false, quote: 'De rit naar Iraklion duurde een korte 30 minuten.', pos: 13724, text: 'Opvulling: deze autorit met Nikos is een gemiste kans. Nu is het één alinea. Maar dit is het moment waarop Thomas voor het eerst echt begint te beseffen dat er iets ernstig mis is. Nikos zwijgt, rijdt gespannen, stelt hem niet gerust. Geef dit meer ruimte: de bochten, de muziek, Thomas die probeert te bellen, zijn gedachten die naar het donkerste gaan. Dit mag twee of drie alinea\'s worden.', author: 'Koen', date: '28 juni 2026' },
  { id: 1013, type: 'inline', resolved: false, quote: 'Niet veel later belde de ziedende man de politie.', pos: 16778, text: 'H2 — bij Alex: het stuk in de taverna is wat repetitief. De agenten twijfelen twee keer rond. Schrap de tweede twijfelronde en geef meer sfeer aan de taverna zelf: de geuren, Alex die moppert vanuit de hoek — het zoveelste groepje dronken toeristen. Vermijd ook 2x het woord "euh" in twee opeenvolgende zinnen.', author: 'Koen', date: '28 juni 2026' },
  { id: 2001, type: 'inline', resolved: false, quote: 'Klokslag zeven uur gaf hij zijn drie geadopteerde katten eten.', pos: 22635, text: 'H3 — Geef gerust wat meer aandacht aan de typische (zwerf)katten in Griekenland, en pas de zin wat aan zodat hij vlotter leest: "De talrijke katten rond zijn autoverhuurbedrijf gaf hij eerst brokjes en vers water."', author: 'Koen', date: '29 juni 2026' },
  { id: 1014, type: 'inline', resolved: false, quote: 'Zijn oog viel op een post in de', pos: 22254, text: 'H3 — Nikos: rustig ritme dat mooi contrasteert. Na het Breaking News ook meer de stilte benadrukken — zo\'n nieuws schokt het hele stadje. De Facebook-passages zijn te druk. Het herhalende "Alex" komt slordig over — niet elke zin hoeft met zijn naam te beginnen. Geef meer aandacht aan Alex als persoon vanuit Nikos\' standpunt, om de hechte gemeenschap in de verf te zetten.', author: 'Koen', date: '28 juni 2026' },
  { id: 1015, type: 'inline', resolved: false, quote: 'Slaap vond ze zwaar overroepen.', pos: 27871, text: 'H4 — perfecte openingszin. Maar het stuk bij Giorgos verdient meer uitwerking. Nu loopt Eleni erdoor in enkele zinnen. De relatie vader-dochter is een warm moment — gun de lezer wat ademruimte. Een blik, een gebaar, een halve zin die ze niet afmaken. Dat hoeft niet lang, maar het mag iets meer zijn.', author: 'Koen', date: '28 juni 2026' },
  { id: 1016, type: 'inline', resolved: false, quote: 'Daarna ging ze over naar de echte ondervraging.', pos: 36102, text: 'H5 — verhoor: sterk, maar Floris verdwijnt te snel op de achtergrond. Hij is duidelijk de angsthaas en heeft iets gezien dat hem echt schokt. Maak hem aanweziger tijdens het groepsverhoor — een reactie hier en daar, een blik die Eleni opvangt. Dat maakt zijn aparte verhoor later zwaarder.', author: 'Koen', date: '28 juni 2026' },
  { id: 1008, type: 'inline', resolved: false, quote: 'Eleni bedacht dat ze een passagier meehad en vertraagde haar snelheid.', pos: 53729, text: 'Idee voor herwerking: de partner is altijd verdachte nummer 1, dus het is ongeloofwaardig dat Eleni Thomas zelf naar het hotel rijdt. Wat als een brigadier Thomas naar het hotel brengt, terwijl Eleni alleen in haar eigen wagen achterna rijdt? In die auto kan ze dan een innerlijke monoloog houden: haar gedachten over de zaak, haar aanpak als inspecteur, en haar instinct dat Thomas ondanks alles niet schuldig lijkt.', author: 'Koen', date: '28 juni 2026' },
  { id: 1017, type: 'inline', resolved: false, quote: 'De ruimte was kouder dan Eleni verwacht had.', pos: 60899, text: 'H9 — autopsie: gaat te snel. Geef dit meer aandacht: de geluiden in de ruimte, het koude licht, Eleni\'s inwendige reactie op de wonden. De volgorde van de pathologische uitleg kan nog samenhangender. Laat Eleni ook eerst kijken voor en tijdens de autopsie en benadruk de gruwelijke toetakeling.', author: 'Koen', date: '28 juni 2026' },
  { id: 1019, type: 'inline', resolved: false, quote: 'Hij had acteur moeten worden!', pos: 83944, text: 'H13 — Kostas bij de jongeren: sterkste scène van de tweede helft. Geef de inwendige gedachten van Kostas weer — het doel heiligt de middelen, alles voor een dikke primeur. De opbouw naar het dronken moment gaat iets te snel: één cocktailronde meer beschrijven, de sfeer die loskomt, Stijn die grappen maakt. Schep een ontspannen sfeer die dan het contrast vormt met het ijzingwekkende verhaal.', author: 'Koen', date: '28 juni 2026' },
  { id: 1006, type: 'general', resolved: false, quote: '', pos: 999999, text: 'De afwisseling tussen de vier perspectieven (Thomas, de jongeren, Nikos, Eleni) in de eerste hoofdstukken werkt heel goed. Bekijk wel om de tijdstempels consequenter te gebruiken — soms ontbreekt er een.', author: 'Koen', date: '28 juni 2026' },
  { id: 1007, type: 'general', resolved: false, quote: '', pos: 999999, text: 'De Minotaurus-mythe als ondertoon is een sterke keuze. Misschien kan je die nog iets explicieter verweven in de beschrijvingen van het landschap — Kreta zelf als labyrint?', author: 'Koen', date: '28 juni 2026' },
]

const CREDS = {
  'Femke': { pin: '6600', role: 'writer', displayName: 'Femke' },
  'Femke Janssens': { pin: '6600', role: 'writer', displayName: 'Femke' },
  'Koen': { pin: '6601', role: 'editor', displayName: 'Koen' },
  'Koen Vlayen': { pin: '6601', role: 'editor', displayName: 'Koen' },
}
const READER_PIN = '6699'
const PARAS_PER_PAGE = 8

function parseBook(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  const syn = []
  while (i < lines.length && !lines[i].startsWith('Proloog') && !lines[i].match(/^\d+[.\s]*$/)) {
    if (lines[i].trim()) syn.push(lines[i].trim())
    i++
  }
  if (syn.length) blocks.push({ type: 'synopsis', text: syn.join(' ') })
  while (i < lines.length) {
    const t = lines[i].trim()
    if (!t) { i++; continue }
    if (t.startsWith('**') || t.startsWith('BREAKING')) {
      blocks.push({ type: 'breaking', text: t.replace(/\*\*/g, '') }); i++; continue
    }
    if (t.match(/^(Proloog|Epiloog|Notities|\d+\.?)\.?\s*$/)) {
      const raw = t.replace('.', '').trim()
      const label = raw === 'Proloog' ? 'Proloog' : raw === 'Epiloog' ? 'Epiloog' : raw === 'Notities' ? 'Notities' : 'Hoofdstuk ' + raw
      let sub = ''; i++
      if (i < lines.length && lines[i].trim().match(/^\d+\s+\w+/)) { sub = lines[i].trim(); i++ }
      blocks.push({ type: 'chapter', label, sub }); continue
    }
    if (t.match(/^\d+\s+\w+(\s+\d{4})?\s+\d+[.:]/)) {
      blocks.push({ type: 'timestamp', text: t }); i++; continue
    }
    blocks.push({ type: 'para', text: t }); i++
  }
  return blocks
}

function paginateBlocks(blocks) {
  const pages = []
  let current = [], paraCount = 0
  function flush() { if (current.length) { pages.push(current); current = []; paraCount = 0 } }
  blocks.forEach(block => {
    if (block.type === 'chapter') { flush(); current = [block]; paraCount = 0 }
    else if (block.type === 'para') { current.push(block); paraCount++; if (paraCount >= PARAS_PER_PAGE) flush() }
    else { current.push(block) }
  })
  flush()
  return pages
}

function Block({ block, notes, onHighlightClick }) {
  const active = notes.filter(n => n.type === 'inline' && !n.resolved && n.quote)
  function wrapText(content) {
    const matches = []
    active.forEach(note => { const idx = content.indexOf(note.quote); if (idx !== -1) matches.push({ idx, note }) })
    if (!matches.length) return content
    matches.sort((a, b) => a.idx - b.idx)
    const parts = []; let cursor = 0
    matches.forEach(({ idx, note }) => {
      if (idx < cursor) return
      if (idx > cursor) parts.push(content.slice(cursor, idx))
      parts.push(<span key={note.id} id={'h-' + note.id} className="inline-highlight" onClick={() => onHighlightClick(note.id)}>{note.quote}</span>)
      cursor = idx + note.quote.length
    })
    if (cursor < content.length) parts.push(content.slice(cursor))
    return parts
  }
  switch (block.type) {
    case 'synopsis': return <div className="book-synopsis">{block.text}</div>
    case 'chapter': return (
      <div className="chapter-page">
        <div className="chapter-label">{block.label}</div>
        <div className="chapter-rule"/>
        {block.sub && <div className="chapter-sub">{block.sub}</div>}
      </div>
    )
    case 'timestamp': return <div className="chapter-sub" style={{textAlign:'center'}}>{block.text}</div>
    case 'breaking': return <div className="breaking-news">{block.text}</div>
    case 'para': return <p className="book-para">{wrapText(block.text)}</p>
    default: return null
  }
}

function PinLogin({ onLogin }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [step, setStep] = useState('name')
  function submitName() { if (!name.trim()) { setErr('Vul je naam in.'); return }; setErr(''); setStep('pin') }
  function submitPin() {
    const known = CREDS[name.trim()]
    if (known ? pin === known.pin : pin === READER_PIN) {
      onLogin(name.trim(), known?.role || 'reader', known?.displayName || name.trim().split(' ')[0]); return
    }
    setErr('Ongeldige pincode.'); setPin('')
  }
  return (
    <div className="login-bg">
      <div className="login-overlay"/>
      <div className="login-card">
        <div className="login-eyebrow">Een roman van Femke Janssens</div>
        <div className="login-title">Voor de zon opkwam</div>
        <div className="login-sub">{step === 'name' ? 'Vul je naam in om verder te gaan' : 'Vul je pincode in'}</div>
        {step === 'name' ? (
          <>
            <label className="login-label">Jouw naam</label>
            <input className="login-input" type="text" placeholder="Naam Achternaam" value={name}
              onChange={e => { setName(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && submitName()} autoFocus/>
            <button className="login-btn" onClick={submitName}>Verder →</button>
          </>
        ) : (
          <>
            <div className="login-welcome">Welkom, <strong>{name.split(' ')[0]}</strong>. Vul je pincode in.</div>
            <label className="login-label">Pincode</label>
            <input className="login-input pin-input" type="password" inputMode="numeric" maxLength={4}
              placeholder="••••" value={pin}
              onChange={e => { setPin(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && submitPin()} autoFocus/>
            <button className="login-btn" onClick={submitPin}>Betreden</button>
            <button className="login-back" onClick={() => { setStep('name'); setPin(''); setErr('') }}>← Andere naam</button>
          </>
        )}
        {err && <div className="login-err">{err}</div>}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [viewingEnabled, setViewingEnabled] = useState(true)
  const [overrideBook, setOverrideBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('inline')
  const [draft, setDraft] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [selectedQuote, setSelectedQuote] = useState('')
  const [selectedPos, setSelectedPos] = useState(Infinity)
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [popup, setPopup] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [brokenNotes, setBrokenNotes] = useState([])

  const pageRef = useRef()
  const overlayListRef = useRef()
  const sidebarListRef = useRef()
  const touchStartX = useRef(null)

  const book = overrideBook || { content: BOOK_TEXT, name: 'Voor de zon opkwam', date: '28 juni 2026' }
  const bookText = book.content || ''
  const pages = paginateBlocks(parseBook(bookText))
  const totalPages = pages.length

  useEffect(() => {
    getData().then(d => {
      if (d.viewingEnabled !== undefined) setViewingEnabled(d.viewingEnabled)
      if (d.overrideBook) setOverrideBook(d.overrideBook)
      if (d.userNotes && d.userNotes.length) {
        const ids = new Set(INITIAL_NOTES.map(n => n.id))
        setNotes([...INITIAL_NOTES, ...d.userNotes.filter(n => !ids.has(n.id))])
      }
      if (d.resolvedIds && d.resolvedIds.length) {
        setNotes(prev => prev.map(n => ({ ...n, resolved: d.resolvedIds.includes(n.id) ? true : n.resolved })))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'ArrowRight') goNext(); if (e.key === 'ArrowLeft') goPrev() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, totalPages])

  function goNext() { if (currentPage < totalPages - 1) { setCurrentPage(p => p + 1); pageRef.current?.scrollTo(0, 0) } }
  function goPrev() { if (currentPage > 0) { setCurrentPage(p => p - 1); pageRef.current?.scrollTo(0, 0) } }
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev() }
    touchStartX.current = null
  }

  const canView = user?.role === 'writer' || user?.role === 'editor' || viewingEnabled
  const isEditor = user?.role === 'editor' || user?.role === 'writer'

  const inlineNotes = notes.filter(n => n.type === 'inline').sort((a, b) => {
    const pa = a.pos !== undefined ? a.pos : (a.quote ? bookText.indexOf(a.quote) : Infinity)
    const pb = b.pos !== undefined ? b.pos : (b.quote ? bookText.indexOf(b.quote) : Infinity)
    return (pa === -1 ? Infinity : pa) - (pb === -1 ? Infinity : pb)
  })
  const generalNotes = notes.filter(n => n.type === 'general')
  const openNotes = notes.filter(n => !n.resolved).length

  async function persist(newNotes) {
    setSaving(true)
    try {
      const ids = new Set(INITIAL_NOTES.map(n => n.id))
      const userNotes = newNotes.filter(n => !ids.has(n.id))
      const resolvedIds = newNotes.filter(n => n.resolved).map(n => n.id)
      const d = await getData(); await setData({ ...d, userNotes, resolvedIds })
    } finally { setSaving(false) }
  }

  async function toggleViewing() {
    const next = !viewingEnabled; setViewingEnabled(next); setSaving(true)
    try { const d = await getData(); await setData({ ...d, viewingEnabled: next }) } finally { setSaving(false) }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploadStatus('Lezen...')
    try {
      const text = await file.text()
      const broken = notes.filter(n => n.type === 'inline' && n.quote && text.indexOf(n.quote) === -1)
      setBrokenNotes(broken)
      const ob = { content: text, name: file.name.replace(/\.(docx|txt)$/i, ''), date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) }
      setOverrideBook(ob); setCurrentPage(0)
      const d = await getData(); await setData({ ...d, overrideBook: ob })
      setUploadStatus(broken.length > 0 ? `⚠ ${broken.length} opmerking(en) niet meer gevonden in de nieuwe tekst` : '✓ Geüpload op ' + ob.date)
    } catch { setUploadStatus('Fout bij uploaden.') }
    e.target.value = ''
  }

  function exportTxt() {
    const blob = new Blob([book.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = book.name + '.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (user?.role !== 'editor') return
    function onUp() {
      const sel = window.getSelection(); const txt = sel?.toString().trim()
      if (!txt || txt.length < 3) { setPopup(null); return }
      const range = sel.getRangeAt(0); const rect = range.getBoundingClientRect()
      setSelectedQuote(txt); setSelectedPos(bookText.indexOf(txt) === -1 ? Infinity : bookText.indexOf(txt))
      setPopup({ x: rect.left + rect.width / 2, y: rect.top - 8 })
    }
    document.addEventListener('mouseup', onUp)
    return () => document.removeEventListener('mouseup', onUp)
  }, [user, bookText])

  function scrollToNote(noteId, listRef) {
    const el = document.getElementById('note-' + noteId)
    if (el && listRef.current) {
      const lt = listRef.current.getBoundingClientRect().top
      const et = el.getBoundingClientRect().top
      listRef.current.scrollTo({ top: et - lt + listRef.current.scrollTop - 20, behavior: 'smooth' })
    }
  }

  function handleHighlightClick(noteId) {
    setActiveNoteId(noteId); setActiveTab('inline'); setOverlayOpen(true)
    setTimeout(() => scrollToNote(noteId, overlayListRef), 80)
    setTimeout(() => setActiveNoteId(null), 2500)
  }

  function handleSidebarClick(note) {
    if (note.type !== 'inline' || !note.quote) return
    const notePos = note.pos !== undefined ? note.pos : bookText.indexOf(note.quote)
    const allPages = paginateBlocks(parseBook(bookText))
    let charCursor = 0, targetPage = 0
    outer: for (let pi = 0; pi < allPages.length; pi++) {
      for (const block of allPages[pi]) {
        if (block.type === 'para' && block.text) {
          const idx = bookText.indexOf(block.text, charCursor)
          if (idx !== -1 && idx <= notePos && notePos <= idx + block.text.length) { targetPage = pi; break outer }
          if (idx !== -1) charCursor = idx + block.text.length
        }
      }
    }
    setOverlayOpen(false); setCurrentPage(targetPage); setActiveNoteId(note.id)
    setTimeout(() => {
      const el = document.getElementById('h-' + note.id)
      if (el && pageRef.current) {
        const at = pageRef.current.getBoundingClientRect().top
        const et = el.getBoundingClientRect().top
        pageRef.current.scrollTo({ top: et - at + pageRef.current.scrollTop - 120, behavior: 'smooth' })
      }
    }, 150)
    setTimeout(() => setActiveNoteId(null), 2500)
  }

  async function sendNote() {
    if (!draft.trim() || (noteType === 'inline' && !selectedQuote)) return
    const n = { id: Date.now(), type: noteType, resolved: false, quote: noteType === 'inline' ? selectedQuote : '', pos: noteType === 'inline' ? selectedPos : Infinity, text: draft.trim(), author: user.displayName, date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) }
    const updated = [...notes, n]; setNotes(updated); setDraft(''); setSelectedQuote(''); setSelectedPos(Infinity); setNoteType('general')
    await persist(updated)
  }
  async function resolveNote(id) { const u = notes.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n); setNotes(u); await persist(u) }
  async function deleteNote(id) { const u = notes.filter(n => n.id !== id); setNotes(u); await persist(u) }
  async function saveEditNote(id) { const u = notes.map(n => n.id === id ? { ...n, text: editingNoteText } : n); setNotes(u); setEditingNoteId(null); await persist(u) }

  function NoteCard({ note }) {
    const isBroken = brokenNotes.some(b => b.id === note.id)
    return (
      <div id={'note-' + note.id}
        className={`suggestion-card ${note.type === 'inline' ? 'inline-note' : 'general-note'} ${note.resolved ? 'resolved' : ''} ${isBroken ? 'broken' : ''} ${activeNoteId === note.id ? 'note-active' : ''}`}
        style={{ cursor: note.type === 'inline' && note.quote ? 'pointer' : 'default' }}
        onClick={() => handleSidebarClick(note)}>
        {isBroken && <div className="broken-label">⚠ Niet meer gevonden in manuscript</div>}
        {note.quote && !isBroken && <div className="suggestion-card-label">📍 "{note.quote.slice(0, 45)}{note.quote.length > 45 ? '…' : ''}"</div>}
        {!note.quote && <div className="suggestion-card-label">💬 Algemeen</div>}
        {editingNoteId === note.id ? (
          <>
            <textarea className="suggestion-textarea" style={{ minHeight: 70, marginTop: 4 }} value={editingNoteText} onChange={e => setEditingNoteText(e.target.value)} autoFocus/>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="edit-save-btn" style={{ flex: 1, padding: '5px 0', fontSize: '.74rem' }} onClick={e => { e.stopPropagation(); saveEditNote(note.id) }}>Opslaan</button>
              <button className="edit-cancel-btn" style={{ padding: '5px 10px', fontSize: '.74rem' }} onClick={e => { e.stopPropagation(); setEditingNoteId(null) }}>✕</button>
            </div>
          </>
        ) : <div className="suggestion-text">{note.text}</div>}
        <div className="suggestion-meta">{note.author} · {note.date}{note.resolved ? ' · ✓ verwerkt' : ''}</div>
        <div className="suggestion-actions" onClick={e => e.stopPropagation()}>
          {user.role === 'writer' && <button className="suggestion-action-btn resolve" onClick={() => resolveNote(note.id)}>{note.resolved ? 'Heropen' : '✓ Verwerkt'}</button>}
          {user.role === 'editor' && <>
            <button className="suggestion-action-btn" onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text) }}>Bewerk</button>
            <button className="suggestion-action-btn delete" onClick={() => deleteNote(note.id)}>Verwijder</button>
          </>}
        </div>
      </div>
    )
  }

  function NotePanel({ listRef }) {
    return (
      <>
        <div className="sidebar-tabs">
          <button className={`sidebar-tab ${activeTab === 'inline' ? 'active' : ''}`} onClick={() => setActiveTab('inline')}>Inline ({inlineNotes.length})</button>
          <button className={`sidebar-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Algemeen ({generalNotes.length})</button>
        </div>
        <div ref={listRef} className="suggestions-list">
          {(activeTab === 'inline' ? inlineNotes : generalNotes).length === 0
            ? <div className="no-suggestions">Geen opmerkingen.</div>
            : (activeTab === 'inline' ? inlineNotes : generalNotes).map(note => <NoteCard key={note.id} note={note}/>)}
        </div>
        {user.role === 'editor' && (
          <div className="suggestion-form">
            <div className="note-type-row">
              <button className={`note-type-btn ${noteType === 'general' ? 'active' : ''}`} onClick={() => setNoteType('general')}>Algemeen</button>
              <button className={`note-type-btn ${noteType === 'inline' ? 'active' : ''}`} onClick={() => setNoteType('inline')}>Inline</button>
            </div>
            {noteType === 'inline' && <div className="selection-hint">{selectedQuote ? `✓ "${selectedQuote.slice(0, 35)}…"` : 'Selecteer tekst in het verhaal'}</div>}
            <textarea className="suggestion-textarea" placeholder={noteType === 'inline' ? 'Opmerking bij geselecteerde tekst…' : 'Algemene opmerking…'} value={draft} onChange={e => setDraft(e.target.value)}/>
            <button className="send-btn" onClick={sendNote} disabled={!draft.trim() || (noteType === 'inline' && !selectedQuote)}>Opmerking toevoegen</button>
          </div>
        )}
      </>
    )
  }

  if (!user) return <PinLogin onLogin={(name, role, displayName) => setUser({ name, role, displayName })}/>
  if (loading) return <div className="loading">Laden…</div>

  const dotColor = user.role === 'writer' ? '#b97a5a' : user.role === 'editor' ? '#5a7ab9' : '#5aab6a'
  const roleLabel = user.role === 'writer' ? 'Schrijver' : user.role === 'editor' ? 'Redacteur' : 'Lezer'

  return (
    <div className="app" style={{ background: '#d4c9b0' }}>
      {popup && user?.role === 'editor' && (
        <div className="selection-popup" style={{ left: popup.x, top: popup.y, transform: 'translate(-50%,-100%)' }}>
          <button onClick={() => { setNoteType('inline'); setActiveTab('inline'); setPopup(null); window.getSelection()?.removeAllRanges() }}>+ Inline opmerking</button>
          <button onClick={() => setPopup(null)}>✕</button>
        </div>
      )}

      {overlayOpen && isEditor && (
        <div className="overlay-backdrop" onClick={() => setOverlayOpen(false)}>
          <div className="overlay-spacer"/>
          <div className="overlay-sheet" onClick={e => e.stopPropagation()}>
            <div className="overlay-header">
              <div>
                <div className="overlay-title">Opmerkingen</div>
                <div className="overlay-subtitle">Klik om naar de pagina te springen</div>
              </div>
              <button className="overlay-close" onClick={() => setOverlayOpen(false)}>✕</button>
            </div>
            <NotePanel listRef={overlayListRef}/>
          </div>
        </div>
      )}

      <div className="topbar" style={{ background: '#2c2420' }}>
        <div className="topbar-left">
          <span className="topbar-title" style={{ color: '#f0ece5' }}>Voor de zon opkwam</span>
          <span className="topbar-divider" style={{ background: 'rgba(255,255,255,.2)' }}/>
          <span className="book-label" style={{ color: 'rgba(255,255,255,.4)' }}>Femke Janssens</span>
        </div>
        <div className="topbar-right">
          {saving && <span className="saving-indicator" style={{ color: 'rgba(255,255,255,.5)' }}>Opslaan…</span>}
          {isEditor && (
            <button className="notes-btn" onClick={() => setOverlayOpen(true)}>
              💬 {openNotes > 0 && <span className="notes-badge">{openNotes}</span>}
            </button>
          )}
          {user.role === 'writer' && (
            <>
              <label className="upload-label">📄 <input type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFileUpload}/></label>
              <button className="export-label" onClick={exportTxt}>⬇</button>
              <button className={`toggle ${viewingEnabled ? 'on' : ''}`} onClick={toggleViewing} title={viewingEnabled ? 'Zichtbaar voor iedereen' : 'Enkel jij & Koen'}/>
            </>
          )}
          <div className={`badge badge-${user.role}`}>
            <div className="badge-dot" style={{ background: dotColor }}/>{user.displayName} · {roleLabel}
          </div>
          <button className="logout-btn" style={{ color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.18)' }} onClick={() => setUser(null)}>Afmelden</button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`upload-banner ${uploadStatus.includes('⚠') ? 'warn' : 'ok'}`}>
          {uploadStatus}
          {brokenNotes.length > 0 && <span className="upload-banner-link" onClick={() => { setOverlayOpen(true); setActiveTab('inline') }}>Bekijk →</span>}
        </div>
      )}

      <div className="main">
        <div className="reading-area" ref={pageRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ background: '#d4c9b0', padding: '32px 24px 16px' }}>
          {!canView ? (
            <div className="locked-state">
              <div className="locked-icon">🔒</div>
              <h3>Nog niet beschikbaar</h3>
              <p>Femke heeft het lezen tijdelijk uitgeschakeld.</p>
            </div>
          ) : (
            <div className="book-page">
              {pages[currentPage]?.map((block, i) => (
                <Block key={i} block={block} notes={notes} onHighlightClick={handleHighlightClick}/>
              ))}
            </div>
          )}
        </div>

        {isEditor && (
          <div className="editor-sidebar">
            <div className="sidebar-header">
              <h3>{user.role === 'editor' ? 'Opmerkingen' : 'Opmerkingen van Koen'}</h3>
              <p>Klik om naar de pagina te springen</p>
            </div>
            <NotePanel listRef={sidebarListRef}/>
          </div>
        )}
      </div>

      <div className="page-nav">
        <button className="page-nav-btn" onClick={goPrev} disabled={currentPage === 0}>‹</button>
        <div className="page-nav-center">
          <input
            className="page-slider"
            type="range"
            min={0}
            max={totalPages - 1}
            value={currentPage}
            onChange={e => { setCurrentPage(Number(e.target.value)); pageRef.current?.scrollTo(0, 0) }}
          />
          <span className="page-nav-label">{currentPage + 1} / {totalPages}</span>
        </div>
        <button className="page-nav-btn" onClick={goNext} disabled={currentPage === totalPages - 1}>›</button>
      </div>
    </div>
  )
}