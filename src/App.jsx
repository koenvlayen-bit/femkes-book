import { useState, useEffect, useRef, useCallback } from 'react'
import { getData, setData } from './jsonbin.js'
import BOOK_TEXT from './bookText.js'
import './App.css'

const BOOK_NAME = 'Voor de zon opkwam'
const BOOK_DATE = '28 juni 2026'
const USERS = {
  'Femke Janssens': { role: 'writer', displayName: 'Femke' },
  'Koen Vlayen':    { role: 'editor', displayName: 'Koen' },
}

// Koen's pre-loaded editorial notes as "Koen"
const INITIAL_NOTES = [
  {
    id: 1001, type: 'inline', resolved: false,
    quote: 'Was Sophia in de badkamer?',
    text: 'Misschien beter als gedachte tonen i.p.v. uitroep? "Was Sophia in de badkamer?" zonder uitroepteken voelt intenser.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1002, type: 'inline', resolved: false,
    quote: 'Ze ging graag zwemmen voor het ochtendgloren.',
    text: 'Prachtige zin — karakteriseert Sophia subtiel en sterk. Dit is de lezer haar eerste echte beeld van haar.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1003, type: 'inline', resolved: false,
    quote: 'Vier jongeren wankelden over de strip',
    text: '"Wankelden" is perfect gekozen — je voelt meteen de dronkenschap zonder het te benoemen.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1004, type: 'inline', resolved: false,
    quote: 'Een overweldigend geloei van heel dichtbij',
    text: 'Heel effectief. De opbouw van geluiden (gehijg → voetstappen → geloei) werkt uitstekend als spanningstechniek.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1005, type: 'inline', resolved: false,
    quote: 'Bel Mavrakis!',
    text: 'Sterke cliffhanger om het hoofdstuk mee te eindigen. Mavrakis wordt hiermee meteen een belofte aan de lezer.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1006, type: 'general', resolved: false,
    text: 'De afwisseling tussen de vier perspectieven (Thomas, de jongeren, Nikos, Eleni) in de eerste hoofdstukken werkt heel goed. Overweeg wel om de tijdstempels consequenter te gebruiken — soms ontbreekt er een.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1007, type: 'general', resolved: false,
    text: 'De Minotaurus-mythe als ondertoon is een sterke keuze. Misschien kan je die nog iets explicieter verweven in de beschrijvingen van het landschap — Kreta zelf als labyrint?',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1009, type: 'general', resolved: false,
    text: 'PROLOOG — tempo: De opbouw werkt uitstekend, maar het stuk tussen de joint en het eerste geluid gaat iets te snel. Overweeg één extra alinea waarin de jongens écht tot rust komen — lachen, een grap, de stilte van de nacht voelen. Dat maakt de breuk (het gehijg) veel abrupter en dus angstaanjagender.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1010, type: 'inline', resolved: false,
    quote: 'Dit was het leven! Overdag luieren op de strandbedden van Star Beach',
    text: 'Structuur: deze karakterisering van Jarne komt iets te vroeg — nog voor we de sfeer goed hebben. Overweeg dit blokje te verplaatsen naar nádat de joint aangestoken is. Dan voelt het als een dronken monoloog in zijn hoofd, wat veel natureller aanvoelt.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1011, type: 'general', resolved: false,
    text: 'H1 — Thomas: het ritme is sterk maar de koffer-doorzoeking is te lang voor dit moment. De lezer wil dat Thomas snel bij Nikos geraakt. Kort die scène in tot twee zinnen en laat Thomas\' emotionele toestand (tranen, spiegel, water) iets langer duren — dat is het sterkste stuk van het hoofdstuk.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1012, type: 'inline', resolved: false,
    quote: 'De rit naar Iraklion duurde een korte 30 minuten.',
    text: 'Opvulling: deze autorit met Nikos is een gemiste kans. Nu is het één alinea. Maar dit is het moment waarop Thomas voor het eerst echt begint te beseffen dat er iets ernstig mis is — Nikos zwijgt, rijdt gespannen, stelt hem niet gerust. Geef dit meer ruimte: de bochten, de muziek, Thomas die probeert te bellen, zijn gedachten die naar het donkerste gaan. Dit mag twee of drie alinea\'s worden.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1013, type: 'general', resolved: false,
    text: 'H2 — bij Alex: het stuk in de taverna is wat repetitief. De agenten twijfelen, de jongeren overtuigen — dit gaat twee keer rond. Schrap de tweede twijfelronde en geef in de vrijgekomen ruimte meer sfeer aan de taverna zelf: de geur van koffie, Alex die moppert vanuit de hoek, de spanning terwijl ze wachten.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1014, type: 'general', resolved: false,
    text: 'H3 — Nikos: prachtig rustig ritme dat contrasteert met de rest. Maar de Facebook-passages zijn te lang. Twee alinea\'s over de Piskopiano-groep volstaan. In de vrijgekomen ruimte meer geven over Nikos\' gevoelens wanneer hij het breaking news leest — zijn band met Thomas en Sophia, de stilte in zijn winkel. Dat mist nu.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1015, type: 'inline', resolved: false,
    quote: 'Slaap vond ze zwaar overroepen.',
    text: 'H4 — perfecte openingszin. Maar het stuk bij Giorgos verdient meer uitwerking. Nu loopt Eleni erdoor in twee zinnen. De relatie vader-dochter is een van de warmste elementen van het verhaal — gun de lezer even de tijd om erin te ademen. Een blik, een gebaar, een halve zin die ze niet afmaken. Dat hoeft niet lang, maar het mag iets meer zijn.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1016, type: 'general', resolved: false,
    text: 'H5 — verhoor: sterk, maar Floris verdwijnt te snel. Hij is duidelijk de bangste en heeft iets gezien dat hem echt schokt. Maak hem aanweziger tijdens het groepsverhoor — een reactie hier en daar, een blik die Eleni opvangt. Dat maakt zijn aparte verhoor later zwaarder.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1017, type: 'general', resolved: false,
    text: 'H9 — autopsie: gaat te snel. De patholoog spreekt zijn bevindingen uit in twee zinnen. Geef dit meer adem: de geluiden in de ruimte, het koude licht, Eleni\'s inwendige reactie op de wonden. Nu denkt ze bij de derde zin al aan de mythe. Laat haar eerst even écht kijken.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1018, type: 'general', resolved: false,
    text: 'H10 — einde te abrupt. Na "De Minotaurus" volgt meteen H11. Overweeg één slotalinea: Eleni die naar de afbeelding staart, Giorgos die niks meer zegt, de stilte in de taverna. Die stilte mist nu.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1019, type: 'general', resolved: false,
    text: 'H13 — Kostas bij de jongeren: sterkste scène van de tweede helft. Maar de opbouw naar het dronken moment gaat iets te snel. Eén cocktailronde meer beschrijven — de sfeer die loskomt, Stijn die grappen maakt, Kostas die zijn rol speelt. Nu spring je van "ze bestellen" naar "ze zijn dronken" in twee zinnen.',
    author: 'Koen', date: '28 juni 2026',
  },
  {
    id: 1020, type: 'inline', resolved: false,
    quote: 'Ze leefden in Stratford nabij Londen in een gezellige cottage woning',
    text: 'Notities — structuur: deze notities voelen als achtergrondinformatie die je schrijvend verzameld hebt. Veel hiervan (IVF, Thomas\' hobby\'s) is al organisch verweven in de hoofdstukken. Overweeg de notities te herschrijven als een echte epiloog-scène — misschien Thomas die na alles thuiskomt en voor het eerst alleen kookt, of Eleni die het dossier afsluit. Emotioneel veel sterker dan een opsomming.',
    author: 'Koen', date: '28 juni 2026',
  },

  {
    id: 1008, type: 'inline', resolved: false,
    quote: 'Eleni bedacht dat ze een passagier meehad en vertraagde haar snelheid.',
    text: 'Idee voor herwerking: de partner is altijd verdachte nummer 1, dus het is ongeloofwaardig dat Eleni Thomas zelf naar het hotel rijdt en meteen zo vertrouwelijk wordt. Wat als een brigadier (of het Griekse equivalent — een "upaspisths") Thomas naar het hotel brengt, terwijl Eleni alleen in haar eigen wagen achterna rijdt? In die auto kan ze dan een innerlijke monoloog houden: haar gedachten over de zaak, haar aanpak als inspecteur, en haar instinct dat Thomas ondanks alles niet schuldig lijkt. Dat geeft de lezer een venster op haar methode én maakt haar professionele distantie geloofwaardiger.',
    author: 'Koen', date: '28 juni 2026',
  },
]

function BookContent({ text, notes, role, onNoteClick }) {
  if (!text) return null
  const lines = text.split('\n')
  const els = []
  let i = 0, k = 0

  const activeInlineNotes = notes.filter(n => n.type === 'inline' && !n.resolved && n.quote)

  function wrapWithHighlights(content) {
    let result = content
    const matches = []
    activeInlineNotes.forEach(note => {
      const idx = result.indexOf(note.quote)
      if (idx !== -1) matches.push({ idx, note })
    })
    if (!matches.length) return content
    matches.sort((a, b) => a.idx - b.idx)
    const parts = []
    let cursor = 0
    matches.forEach(({ idx, note }) => {
      if (idx < cursor) return
      if (idx > cursor) parts.push(result.slice(cursor, idx))
      parts.push(
        <span
          key={note.id}
          className="inline-highlight"
          onClick={() => onNoteClick(note.id)}
          title={`Koen: ${note.text}`}
        >
          {note.quote}
        </span>
      )
      cursor = idx + note.quote.length
    })
    if (cursor < result.length) parts.push(result.slice(cursor))
    return parts
  }

  const syn = []
  while (i < lines.length && !lines[i].startsWith('Proloog') && !lines[i].match(/^\d+[\.\s]*$/)) {
    if (lines[i].trim()) syn.push(lines[i].trim())
    i++
  }
  if (syn.length) els.push(<div key={k++} className="book-synopsis">{syn.join(' ')}</div>)

  while (i < lines.length) {
    const t = lines[i].trim()
    if (!t) { i++; continue }
    if (t.startsWith('**') || t.startsWith('BREAKING')) {
      els.push(<div key={k++} className="breaking-news">{t.replace(/\*\*/g, '')}</div>)
      i++; continue
    }
    if (t.match(/^(Proloog|Epiloog|Notities|\d+\.?)\.?\s*$/)) {
      const raw = t.replace('.', '').trim()
      const label = raw === 'Proloog' ? 'Proloog' : raw === 'Epiloog' ? 'Epiloog' : raw === 'Notities' ? 'Notities' : `Hoofdstuk ${raw}`
      els.push(<div key={k++} className="chapter-heading">{label}</div>)
      i++
      if (i < lines.length && lines[i].trim().match(/^\d+\s+\w+/)) {
        els.push(<div key={k++} className="chapter-sub">{lines[i].trim()}</div>)
        i++
      }
      continue
    }
    if (t.match(/^\d+\s+\w+(\s+\d{4})?\s+\d+[.:]/)) {
      els.push(<div key={k++} className="chapter-sub">{t}</div>)
      i++; continue
    }
    els.push(<p key={k++} className="book-para">{wrapWithHighlights(t)}</p>)
    i++
  }
  return <>{els}</>
}

function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  function doLogin() {
    const t = name.trim()
    if (!t) { setErr('Vul je naam in.'); return }
    setErr(''); onLogin(t)
  }
  return (
    <div className="login-bg">
      <div className="login-overlay" />
      <div className="login-card">
        <div className="login-eyebrow">Een roman van Femke Janssens</div>
        <div className="login-title">Voor de zon opkwam</div>
        <div className="login-sub">Vul je naam in om het verhaal te lezen</div>
        <label className="login-label">Jouw naam</label>
        <input className="login-input" type="text" placeholder="Naam Achternaam"
          value={name} onChange={e => { setName(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && doLogin()} autoFocus />
        <button className="login-btn" onClick={doLogin}>Betreden</button>
        {name.trim() && <div className="login-confirm">Inloggen als: {name.trim()}</div>}
        {err && <div className="login-err">{err}</div>}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [viewingEnabled, setViewingEnabled] = useState(true)
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [draft, setDraft] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [selectedQuote, setSelectedQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [overrideBook, setOverrideBook] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState('')
  const [activeTab, setActiveTab] = useState('inline')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [popup, setPopup] = useState(null)
  const [highlightedNoteId, setHighlightedNoteId] = useState(null)
  const fileRef = useRef()
  const sidebarRef = useRef()

  const ui = user ? (USERS[user] || { role: 'reader', displayName: user.split(' ')[0] }) : null
  const book = overrideBook || { content: BOOK_TEXT, name: BOOK_NAME, date: BOOK_DATE }

  useEffect(() => {
    getData().then(d => {
      if (d.viewingEnabled !== undefined) setViewingEnabled(d.viewingEnabled)
      if (d.notes && d.notes.length) setNotes(d.notes)
      if (d.overrideBook) setOverrideBook(d.overrideBook)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const canView = ui?.role === 'writer' || ui?.role === 'editor' || viewingEnabled

  async function persist(newNotes) {
    setSaving(true)
    try { const d = await getData(); await setData({ ...d, notes: newNotes }) }
    finally { setSaving(false) }
  }

  async function toggleViewing() {
    const next = !viewingEnabled; setViewingEnabled(next); setSaving(true)
    try { const d = await getData(); await setData({ ...d, viewingEnabled: next }) }
    finally { setSaving(false) }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploadStatus('Lezen...')
    try {
      const text = await file.text()
      const ob = { content: text, name: file.name.replace(/\.(docx|txt)$/i, ''),
        date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) }
      setOverrideBook(ob)
      const d = await getData(); await setData({ ...d, overrideBook: ob })
      setUploadStatus('✓ Geüpload op ' + ob.date)
    } catch { setUploadStatus('Fout bij uploaden.') }
    e.target.value = ''
  }

  function exportDocx() {
    const content = book.content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = book.name + '.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  function startEdit() {
    setEditText(book.content); setEditMode(true)
  }

  async function saveEdit() {
    const ob = { ...book, content: editText, date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) }
    setOverrideBook(ob); setEditMode(false)
    setSaving(true)
    try { const d = await getData(); await setData({ ...d, overrideBook: ob }) }
    finally { setSaving(false) }
  }

  // Text selection for inline notes
  useEffect(() => {
    if (ui?.role !== 'editor') return
    function handleMouseUp(e) {
      const sel = window.getSelection()
      const txt = sel?.toString().trim()
      if (!txt || txt.length < 3) { setPopup(null); return }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectedQuote(txt)
      setPopup({ x: rect.left + rect.width / 2, y: rect.top - 8 })
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [ui])

  function handlePopupInline() {
    setNoteType('inline'); setActiveTab('inline')
    setPopup(null)
    window.getSelection()?.removeAllRanges()
  }

  async function sendNote() {
    if (!draft.trim()) return
    if (noteType === 'inline' && !selectedQuote) return
    const n = {
      id: Date.now(), type: noteType, resolved: false,
      quote: noteType === 'inline' ? selectedQuote : '',
      text: draft.trim(),
      author: ui.displayName,
      date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    const updated = [n, ...notes]
    setNotes(updated); setDraft(''); setSelectedQuote(''); setNoteType('general')
    await persist(updated)
  }

  async function resolveNote(id) {
    const updated = notes.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n)
    setNotes(updated); await persist(updated)
  }

  async function deleteNote(id) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated); await persist(updated)
  }

  function startEditNote(note) {
    setEditingNoteId(note.id); setEditingNoteText(note.text)
  }

  async function saveEditNote(id) {
    const updated = notes.map(n => n.id === id ? { ...n, text: editingNoteText } : n)
    setNotes(updated); setEditingNoteId(null); await persist(updated)
  }

  function handleNoteClick(id) {
    setHighlightedNoteId(id)
    setActiveTab(notes.find(n => n.id === id)?.type === 'general' ? 'general' : 'inline')
    setTimeout(() => setHighlightedNoteId(null), 2000)
  }

  if (!user) return <Login onLogin={setUser} />
  if (loading) return <div className="loading">Laden…</div>

  const roleLabel = ui.role === 'writer' ? 'Schrijver' : ui.role === 'editor' ? 'Redacteur' : 'Lezer'
  const inlineNotes = notes.filter(n => n.type === 'inline')
  const generalNotes = notes.filter(n => n.type === 'general')

  return (
    <div className="app">
      {popup && ui?.role === 'editor' && (
        <div className="selection-popup" style={{ left: popup.x, top: popup.y, transform: 'translate(-50%,-100%)' }}>
          <button onClick={handlePopupInline}>+ Inline opmerking</button>
          <button onClick={() => setPopup(null)}>✕</button>
        </div>
      )}

      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Voor de zon opkwam</span>
          <span className="topbar-divider" />
          <span className="book-label">Femke Janssens</span>
        </div>
        <div className="topbar-right">
          {saving && <span className="saving-indicator">Opslaan…</span>}
          <div className={`badge badge-${ui.role}`}>
            <div className="badge-dot" />{ui.displayName} · {roleLabel}
          </div>
          <button className="logout-btn" onClick={() => setUser(null)}>Afmelden</button>
        </div>
      </div>

      <div className="main">
        <div className="reading-area">
          <div className="reading-area-inner">

            {ui.role === 'writer' && (
              <div className="writer-panel">
                <h3>Schrijversbeheer</h3>
                <div className="panel-row">
                  <label className="file-label" htmlFor="txt-upload">📄 Importeren (.txt)</label>
                  <input id="txt-upload" className="file-input" type="file" accept=".txt" ref={fileRef} onChange={handleFileUpload} />
                  <button className="export-btn" onClick={exportDocx}>⬇ Exporteren (.txt)</button>
                  <button className={`edit-toggle-btn ${editMode ? 'active' : ''}`} onClick={editMode ? () => setEditMode(false) : startEdit}>
                    {editMode ? '✕ Sluiten' : '✏ Bewerken'}
                  </button>
                  {overrideBook && <span className="file-name">{overrideBook.name}</span>}
                </div>
                {uploadStatus && <div className={`upload-status ${uploadStatus.startsWith('Fout') ? 'error' : ''}`}>{uploadStatus}</div>}
                <div className="toggle-row">
                  <button className={`toggle ${viewingEnabled ? 'on' : ''}`} onClick={toggleViewing} />
                  <span className="toggle-label">Anderen mogen lezen</span>
                  <span className="status-text">{viewingEnabled ? 'Zichtbaar voor iedereen' : 'Enkel jij & Koen'}</span>
                </div>
              </div>
            )}

            {!canView ? (
              <div className="locked-state">
                <div className="locked-icon">🔒</div>
                <h3>Nog niet beschikbaar</h3>
                <p>Femke heeft het lezen tijdelijk uitgeschakeld.</p>
              </div>
            ) : editMode && ui.role === 'writer' ? (
              <>
                <div className="book-header">
                  <div className="book-title">{book.name}</div>
                  <div className="book-author">door Femke Janssens — bewerkingsmodus</div>
                </div>
                <textarea className="edit-textarea" value={editText} onChange={e => setEditText(e.target.value)} />
                <div className="edit-save-bar">
                  <button className="edit-save-btn" onClick={saveEdit}>Opslaan</button>
                  <button className="edit-cancel-btn" onClick={() => setEditMode(false)}>Annuleren</button>
                </div>
              </>
            ) : (
              <>
                <div className="book-header">
                  <div className="book-title">{book.name}</div>
                  <div className="book-author">door Femke Janssens</div>
                  <div className="book-date">Versie {book.date}</div>
                </div>
                <BookContent text={book.content} notes={notes} role={ui.role} onNoteClick={handleNoteClick} />
              </>
            )}
          </div>
        </div>

        {(ui.role === 'editor' || ui.role === 'writer') && (
          <div className="editor-sidebar" ref={sidebarRef}>
            <div className="sidebar-header">
              <h3>{ui.role === 'editor' ? 'Opmerkingen' : 'Opmerkingen van Koen'}</h3>
              <p>{ui.role === 'editor' ? 'Inline of algemeen' : 'Vink af wanneer verwerkt'}</p>
            </div>

            <div className="sidebar-tabs">
              <button className={`sidebar-tab ${activeTab === 'inline' ? 'active' : ''}`} onClick={() => setActiveTab('inline')}>
                Inline ({inlineNotes.length})
              </button>
              <button className={`sidebar-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                Algemeen ({generalNotes.length})
              </button>
            </div>

            <div className="suggestions-list">
              {(activeTab === 'inline' ? inlineNotes : generalNotes).length === 0 ? (
                <div className="no-suggestions">Geen opmerkingen.</div>
              ) : (activeTab === 'inline' ? inlineNotes : generalNotes).map(note => (
                <div
                  className={`suggestion-card ${note.type === 'inline' ? 'inline-note' : 'general-note'} ${note.resolved ? 'resolved' : ''} ${highlightedNoteId === note.id ? 'highlighted' : ''}`}
                  key={note.id}
                  id={`note-${note.id}`}
                >
                  {note.type === 'inline' && note.quote && (
                    <div className="suggestion-card-label">"{note.quote.slice(0, 40)}{note.quote.length > 40 ? '…' : ''}"</div>
                  )}
                  {note.type === 'general' && (
                    <div className="suggestion-card-label">Algemeen</div>
                  )}

                  {editingNoteId === note.id ? (
                    <>
                      <textarea
                        className="suggestion-textarea"
                        style={{ minHeight: 60, marginTop: 4 }}
                        value={editingNoteText}
                        onChange={e => setEditingNoteText(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="edit-save-btn" style={{ flex: 1, padding: '5px 0', fontSize: '.75rem' }} onClick={() => saveEditNote(note.id)}>Opslaan</button>
                        <button className="edit-cancel-btn" style={{ padding: '5px 10px', fontSize: '.75rem' }} onClick={() => setEditingNoteId(null)}>✕</button>
                      </div>
                    </>
                  ) : (
                    <div className="suggestion-text">{note.text}</div>
                  )}

                  <div className="suggestion-meta">{note.author} · {note.date}{note.resolved ? ' · ✓ verwerkt' : ''}</div>

                  <div className="suggestion-actions">
                    {ui.role === 'writer' && (
                      <button className={`suggestion-action-btn resolve`} onClick={() => resolveNote(note.id)}>
                        {note.resolved ? 'Heropen' : '✓ Verwerkt'}
                      </button>
                    )}
                    {ui.role === 'editor' && (
                      <>
                        <button className="suggestion-action-btn" onClick={() => startEditNote(note)}>Bewerk</button>
                        <button className="suggestion-action-btn delete" onClick={() => deleteNote(note.id)}>Verwijder</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {ui.role === 'editor' && (
              <div className="suggestion-form">
                <div className="note-type-row">
                  <button className={`note-type-btn ${noteType === 'general' ? 'active' : ''}`} onClick={() => setNoteType('general')}>Algemeen</button>
                  <button className={`note-type-btn ${noteType === 'inline' ? 'active' : ''}`} onClick={() => setNoteType('inline')}>Inline</button>
                </div>
                {noteType === 'inline' && (
                  <div className="selection-hint">
                    {selectedQuote ? `✓ Geselecteerd: "${selectedQuote.slice(0, 30)}…"` : 'Selecteer tekst in het verhaal'}
                  </div>
                )}
                <textarea
                  className="suggestion-textarea"
                  placeholder={noteType === 'inline' ? 'Opmerking bij geselecteerde tekst…' : 'Algemene opmerking…'}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                <button
                  className="send-btn"
                  onClick={sendNote}
                  disabled={!draft.trim() || (noteType === 'inline' && !selectedQuote)}
                >
                  Opmerking toevoegen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
