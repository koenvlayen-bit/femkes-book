import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import mammoth from 'mammoth'
import { renderToStaticMarkup } from 'react-dom/server'
import { fetchBook, saveBookText, saveNotes, seedNotes, setViewing, loadSession, saveSession, clearSession } from './api.js'
import SEED_NOTES from './initialNotes.js'
import BOOK_TEXT from './bookText.js'
import './App.css'


const CREDS = {
  'Femke': { pin: '6600', role: 'writer', displayName: 'Femke' },
  'Femke Janssens': { pin: '6600', role: 'writer', displayName: 'Femke' },
  'Koen': { pin: '6601', role: 'editor', displayName: 'Koen' },
  'Koen Vlayen': { pin: '6601', role: 'editor', displayName: 'Koen' },
}
const READER_PIN = '6699'
const PARAS_PER_PAGE = 8

// Vetdruk uit Word loopt vaak over regeleinden heen ("**tekst\nmeer**").
// Herstel dat zodat elke regel zijn eigen, gebalanceerde ** markeringen heeft.
function normalizeBold(text) {
  let out = '', bold = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && text[i + 1] === '*') { out += '**'; bold = !bold; i++; continue }
    if (text[i] === '\n' && bold) { out += '**\n**'; continue }
    out += text[i]
  }
  if (bold) out += '**'
  return out.split('\n').map(l => l.replace(/\*\*(\s*)\*\*/g, '$1')).join('\n')
}

const plain = s => s.replace(/\*\*/g, '').trim()
const isFullyBold = s => /^\*\*[^*]+\*\*$/.test(s.trim())
const CHAPTER_RE = /^(Proloog|Epiloog|Notities|\d{1,2})\.?$/
const MONTHS = '(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)'
const STAMP_RE = new RegExp(`^([A-ZÀ-Ý][\\wà-ÿ]+,\\s*)?(\\d{1,2}\\s+${MONTHS}(\\s+\\d{4})?:?\\s*)?(\\d{1,2}[.:]\\d{2}(\\s*(uur|AM|PM))?)?$`, 'i')
const isStamp = s => { const p = plain(s); return /\d/.test(p) && p.length < 45 && STAMP_RE.test(p) }
const isChapter = s => CHAPTER_RE.test(plain(s))

// Een krantenartikel = minstens 3 opeenvolgende volledig vetgedrukte regels (lege regels tussenin mogen)
function articleRun(lines, i) {
  const idx = []
  let j = i
  while (j < lines.length) {
    const t = lines[j].trim()
    if (!t) { j++; continue }
    if (!isFullyBold(t) || isChapter(t) || isStamp(t)) break
    idx.push(j); j++
  }
  return { idx, end: j }
}

function buildArticle(rawLines) {
  let lines = rawLines.map(plain).filter(Boolean)
  const head = { type: 'np-head', kicker: '', dateline: '', headline: '', deck: '', paper: '' }
  const foot = { type: 'np-foot', byline: '' }
  // Koptekst: "BREAKING NEWS PISKOPIANO" → label + plaatsnaam
  const bm = lines[0]?.match(/^(BREAKING NEWS)\s*(.*)$/i)
  if (bm) { head.kicker = bm[1].toUpperCase(); head.dateline = bm[2]; lines.shift() }
  const isShort = (s, n) => s.length < n && !/[.!]$/.test(s)
  if (lines[0] && isShort(lines[0], 100)) head.headline = lines.shift()
  if (head.headline && lines[0] && /^[A-ZÀ-Ý\s-]{3,30}$/.test(lines[0])) head.dateline = lines.shift()
  else if (head.headline && lines[0] && isShort(lines[0], 200) && !/—/.test(lines[0])) head.deck = lines.shift()
  if (!head.dateline && lines[0] && /^[A-ZÀ-Ý\s-]{3,30}$/.test(lines[0])) head.dateline = lines.shift()
  // Voettekst: "Auteur: …" en eventueel de krantennaam
  const tail = []
  while (lines.length > 1 && lines[lines.length - 1].length < 45 && !/[.!?]$/.test(lines[lines.length - 1])) tail.unshift(lines.pop())
  if (tail.length) {
    foot.byline = tail[0].replace(/^Auteur:\s*/i, '')
    if (tail[1]) head.paper = tail.slice(1).join(' · ')
  }
  const out = [head]
  lines.forEach((text, k) => out.push({ type: 'np-para', text, first: k === 0 }))
  out.push(foot)
  return out
}

function parseBook(rawText) {
  const lines = normalizeBold(rawText).split('\n')
  const blocks = []
  let i = 0
  const syn = []
  while (i < lines.length && !isChapter(lines[i].trim())) {
    if (lines[i].trim()) syn.push(plain(lines[i]))
    i++
  }
  if (syn.length) blocks.push({ type: 'synopsis', text: syn.join(' ') })
  while (i < lines.length) {
    const t = lines[i].trim()
    if (!t) { i++; continue }
    if (isChapter(t)) {
      const raw = plain(t).replace('.', '')
      const label = /^\d/.test(raw) ? 'Hoofdstuk ' + raw : raw
      i++
      // Datum/tijd onder de hoofdstuktitel (kan over meerdere regels staan)
      const subs = []
      let j = i
      while (j < lines.length && subs.length < 3) {
        const s = lines[j].trim()
        if (!s) { j++; continue }
        if (isStamp(s)) { subs.push(plain(s)); j++; i = j } else break
      }
      blocks.push({ type: 'chapter', label, sub: subs.join(' · ') }); continue
    }
    if (isStamp(t)) {
      const subs = [plain(t)]; i++
      while (i < lines.length && lines[i].trim() && isStamp(lines[i])) subs.push(plain(lines[i++]))
      blocks.push({ type: 'timestamp', text: subs.join(' · ') }); continue
    }
    if (isFullyBold(t)) {
      const run = articleRun(lines, i)
      if (run.idx.length >= 3) {
        blocks.push(...buildArticle(run.idx.map(k => lines[k])))
        i = run.end; continue
      }
    }
    blocks.push({ type: 'para', text: t }); i++
  }
  return blocks
}

// Fallback (voor de eerste render, vóór er gemeten is)
function paginateBlocks(blocks) {
  const pages = []
  let current = [], paraCount = 0
  function flush() { if (current.length) { pages.push(current); current = []; paraCount = 0 } }
  blocks.forEach((block, bi) => {
    const frag = { ...block, bi, fromWord: 0, toWord: Infinity }
    if (block.type === 'chapter') { flush(); current = [frag]; paraCount = 0 }
    else if (block.type === 'para') { current.push(frag); paraCount++; if (paraCount >= PARAS_PER_PAGE) flush() }
    else { current.push(frag) }
  })
  flush()
  return pages
}

// ── E-reader paginering: vult elke pagina exact tot de beschikbare hoogte ──
const SPLITTABLE = new Set(['para', 'synopsis', 'breaking', 'np-para'])
const KEEP_WITH_NEXT = new Set(['np-head'])

function splitWords(words, k) {
  let a = words.slice(0, k).join(' ')
  let r = words.slice(k).join(' ')
  // Vetgedrukte stukken die over de knip lopen netjes sluiten en heropenen
  if (((a.match(/\*\*/g) || []).length) % 2 === 1) { a += '**'; r = '**' + r }
  return [a, r]
}
// Meet met exact dezelfde markup als op het scherm
function measureEl(frag) {
  const tpl = document.createElement('template')
  tpl.innerHTML = renderToStaticMarkup(<Block block={frag} notes={[]} onHighlightClick={() => {}}/>)
  return tpl.content.firstElementChild || document.createElement('div')
}

function paginateMeasured(blocks, measurer, maxH) {
  const pages = []
  let cur = []
  measurer.innerHTML = ''
  const top = () => measurer.getBoundingClientRect().top
  const fits = () => {
    const last = measurer.lastElementChild
    return !last || last.getBoundingClientRect().bottom - top() <= maxH
  }
  // Artikelstuk bovenaan een pagina krijgt een "afgescheurde" bovenrand: meet die mee
  const atTop = f => (!cur.length && (f.type === 'np-para' || f.type === 'np-foot')) ? { ...f, atTop: true } : f
  const tryFrag = frag => { const el = measureEl(atTop(frag)); measurer.appendChild(el); const ok = fits(); measurer.removeChild(el); return ok }
  const place = frag => { const f = atTop(frag); measurer.appendChild(measureEl(f)); cur.push(f) }
  const newPage = () => { if (cur.length) pages.push(cur); cur = []; measurer.innerHTML = '' }

  blocks.forEach((b, bi) => {
    if (b.type === 'chapter' && cur.length) newPage()
    const whole = { ...b, bi, fromWord: 0, toWord: Infinity }
    if (KEEP_WITH_NEXT.has(b.type) && cur.length && blocks[bi + 1]) {
      // Kop van een artikel niet alleen onderaan een pagina laten staan
      const next = blocks[bi + 1]
      const peek = { ...next, text: (next.text || '').split(' ').slice(0, 25).join(' '), split: true }
      const h = measureEl(whole); measurer.appendChild(h)
      const ok = tryFrag(peek)
      measurer.removeChild(h)
      if (!ok) newPage()
    }
    if (tryFrag(whole)) { place(whole); return }
    if (!SPLITTABLE.has(b.type)) { newPage(); place(whole); return }

    // Alinea past niet volledig: knip op woordniveau, zoals een e-reader
    let words = b.text.split(' '), offset = 0, cont = false
    while (words.length) {
      let lo = 0, hi = words.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        const [a] = splitWords(words, mid)
        if (tryFrag({ ...b, text: a, split: mid < words.length, cont })) lo = mid; else hi = mid - 1
      }
      if (lo === 0) {
        if (cur.length) { newPage(); continue }
        lo = 1 // lege pagina en nog steeds te groot: forceer minstens één woord
      }
      if (lo >= words.length) {
        place({ ...b, text: words.join(' '), bi, fromWord: offset, toWord: Infinity, cont })
        break
      }
      const [a] = splitWords(words, lo)
      place({ ...b, text: a, bi, fromWord: offset, toWord: offset + lo, cont, split: true })
      newPage()
      const [, r] = splitWords(words, lo)
      offset += lo
      words = r.split(' ')
      cont = true
    }
  })
  newPage()
  measurer.innerHTML = ''
  return pages
}

function findPage(pages, bi, word = 0) {
  const idx = pages.findIndex(p => p.some(f => f.bi === bi && f.fromWord <= word && word < f.toWord))
  return idx === -1 ? 0 : idx
}

function Block({ block, notes, onHighlightClick, edge = '' }) {
  const active = notes.filter(n => n.type === 'inline' && !n.resolved && n.quote)
  function renderBold(text, keyPrefix) {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={keyPrefix + '-b' + i}>{part.slice(2, -2)}</strong>
      return part
    })
  }
  function wrapText(content) {
    const matches = []
    active.forEach(note => { const idx = content.indexOf(note.quote); if (idx !== -1) matches.push({ idx, note }) })
    if (!matches.length) return renderBold(content, 'rb')
    matches.sort((a, b) => a.idx - b.idx)
    const parts = []; let cursor = 0
    matches.forEach(({ idx, note }) => {
      if (idx < cursor) return
      if (idx > cursor) parts.push(...renderBold(content.slice(cursor, idx), 'rb' + idx))
      parts.push(<span key={note.id} id={'h-' + note.id} className="inline-highlight" onClick={() => onHighlightClick(note.id)}>{note.quote}</span>)
      cursor = idx + note.quote.length
    })
    if (cursor < content.length) parts.push(...renderBold(content.slice(cursor), 'rbe'))
    return parts
  }
  const fragClass = (block.split ? ' split' : '') + (block.cont ? ' cont' : '') +
    (block.split || edge.includes('end') ? ' edge-end' : '') + (block.cont || block.atTop || edge.includes('start') ? ' edge-start' : '')
  switch (block.type) {
    case 'synopsis': return <div className={'book-synopsis' + fragClass}>{block.text}</div>
    case 'chapter': return (
      <div className="chapter-page">
        <div className="chapter-label">{block.label}</div>
        <div className="chapter-rule"/>
        {block.sub && <div className="chapter-sub">{block.sub}</div>}
      </div>
    )
    case 'timestamp': return <div className="chapter-sub" style={{textAlign:'center'}}>{block.text}</div>
    case 'breaking': return <div className={'breaking-news' + fragClass}>{block.text}</div>
    case 'np-head': return (
      <div className="np-head">
        {block.paper
          ? <div className="np-paper">{block.paper}</div>
          : <div className="np-rule"/>}
        {(block.kicker || block.dateline) && (
          <div className="np-meta">
            {block.kicker && <span className="np-kicker">{block.kicker}</span>}
            {block.dateline && <span className="np-dateline">{block.dateline}</span>}
          </div>
        )}
        {block.headline && <div className="np-headline">{block.headline}</div>}
        {block.deck && <div className="np-deck">{block.deck}</div>}
      </div>
    )
    case 'np-para': return <p className={'np-para' + (block.first && !block.cont ? ' first' : '') + fragClass}>{wrapText(block.text)}</p>
    case 'np-foot': return <div className={'np-foot' + (block.atTop || edge.includes('start') ? ' edge-start' : '')}>{block.byline && <>— {block.byline}</>}</div>
    case 'para': return <p className={'book-para' + fragClass}>{wrapText(block.text)}</p>
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
  const [session, setSession] = useState(() => loadSession())
  const [notes, setNotes] = useState([])
  const [viewingEnabled, setViewingEnabled] = useState(true)
  const [bookText, setBookText] = useState(BOOK_TEXT)
  const [bookDate, setBookDate] = useState('28 juni 2026')
  const [loading, setLoading] = useState(false)
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
  const [error, setError] = useState('')

  const pageRef = useRef()
  const overlayListRef = useRef()
  const sidebarListRef = useRef()
  const touchStartX = useRef(null)
  const bookPageRef = useRef()
  const measurerRef = useRef()
  const anchorRef = useRef({ bi: 0, word: 0 })

  const blocks = useMemo(() => parseBook(bookText), [bookText])
  const fallbackPages = useMemo(() => paginateBlocks(blocks), [blocks])
  const [measuredPages, setMeasuredPages] = useState(null)
  const [layoutTick, setLayoutTick] = useState(0)
  const pages = measuredPages || fallbackPages
  const totalPages = pages.length

  // Onthoud waar de lezer zit (eerste stuk van de huidige pagina), zodat
  // we na herpaginering (ander scherm / draaien / nieuw manuscript) op dezelfde plek blijven
  useEffect(() => {
    const first = pages[currentPage]?.[0]
    if (first) anchorRef.current = { bi: first.bi, word: first.fromWord || 0 }
  }, [currentPage, pages])

  // Opnieuw pagineren wanneer de paginagrootte verandert of de lettertypes geladen zijn
  useEffect(() => {
    const el = bookPageRef.current
    if (!el) return
    let t
    const bump = () => { clearTimeout(t); t = setTimeout(() => setLayoutTick(x => x + 1), 120) }
    const ro = new ResizeObserver(bump)
    ro.observe(el)
    document.fonts?.ready.then(bump)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [session, loading, viewingEnabled])

  useLayoutEffect(() => {
    const page = bookPageRef.current, measurer = measurerRef.current
    if (!page || !measurer) return
    const cs = getComputedStyle(page)
    const pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom)
    const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight)
    measurer.style.left = pl + 'px'
    measurer.style.width = (page.clientWidth - pl - pr) + 'px'
    measurer.style.top = pt + 'px'
    const maxH = page.clientHeight - pt - pb
    if (maxH < 80) return
    const result = paginateMeasured(blocks, measurer, maxH - 2)
    setMeasuredPages(result)
    const { bi, word } = anchorRef.current
    setCurrentPage(findPage(result, bi, word))
  }, [blocks, layoutTick])

  // Laad boek van server na login
  useEffect(() => {
    if (!session) return
    setLoading(true); setError('')
    fetchBook(session).then(data => {
      if (data.viewingEnabled !== undefined) setViewingEnabled(data.viewingEnabled)
      // Laad opmerkingen van server
      const serverUserNotes = data.userNotes || []
      const serverResolvedIds = new Set(data.resolvedIds || [])
      const allNotes = serverUserNotes.map(n => ({
        ...n,
        resolved: serverResolvedIds.has(String(n.id)) || Boolean(n.resolved),
      }))
      console.log('[fetchBook] geladen:', allNotes.length, 'noten, resolvedIds:', [...serverResolvedIds])

      // Seed redacteursnoten als de server leeg is en de ingelogde gebruiker writer is
      if (allNotes.length === 0 && session.role === 'writer') {
        console.log('[seed] geen noten op server — seeden...')
        seedNotes(session, SEED_NOTES).then(r => {
          console.log('[seed] klaar:', r.seeded, 'noten')
          setNotes(SEED_NOTES)
        }).catch(e => console.error('[seed] fout:', e))
      } else {
        setNotes(allNotes)
      }
      // Laad boektekst van server als die er is
      if (data.text) {
        setBookText(data.text)
        if (data.updatedAt) setBookDate(new Date(data.updatedAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }))
      }
    }).catch(err => {
      if (err.status === 401) { clearSession(); setSession(null) }
      else setError(err.message)
    }).finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    function onKey(e) { if (e.key === 'ArrowRight') goNext(); if (e.key === 'ArrowLeft') goPrev() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, totalPages])

  function goNext() { if (currentPage < totalPages - 1) { setCurrentPage(p => p + 1); pageRef.current?.scrollTo(0, 0) } }
  function goPrev() { if (currentPage > 0) { setCurrentPage(p => p - 1); pageRef.current?.scrollTo(0, 0) } }
  // Tikken in de linker- of rechterrand van de pagina bladert, zoals op een e-reader
  function handlePageTap(e) {
    if (window.getSelection()?.toString().trim()) return
    if (e.target.closest('.inline-highlight, button, a')) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    if (x < 0.25) goPrev()
    else if (x > 0.75) goNext()
  }
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev() }
    touchStartX.current = null
  }

  const canView = session?.role === 'writer' || session?.role === 'editor' || viewingEnabled
  const isEditor = session?.role === 'editor' || session?.role === 'writer'

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
      const resolvedIds = newNotes.filter(n => n.resolved).map(n => n.id)
      await saveNotes(session, newNotes, resolvedIds)
      console.log('[persist] opgeslagen:', newNotes.length, 'noten, resolvedIds:', resolvedIds)
    } catch (e) { console.error('[persist] fout:', e) }
    finally { setSaving(false) }
  }

  async function toggleViewing() {
    const next = !viewingEnabled; setViewingEnabled(next); setSaving(true)
    try { await setViewing(session, next) }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploadStatus('Lezen...')
    try {
      let text = ''
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
        const html = htmlResult.value
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        function nodeToText(node) {
          if (node.nodeType === 3) return node.textContent
          if (node.nodeType !== 1) return ''
          const tag = node.tagName.toLowerCase()
          const inner = Array.from(node.childNodes).map(nodeToText).join('')
          if (tag === 'strong' || tag === 'b') return '**' + inner + '**'
          if (tag === 'p') return inner + '\n'
          if (tag === 'br') return '\n'
          return inner
        }
        text = Array.from(doc.body.childNodes).map(nodeToText).join('').trim()
      } else {
        text = await file.text()
      }
      const broken = notes.filter(n => n.type === 'inline' && n.quote && text.indexOf(n.quote) === -1)
      setBrokenNotes(broken)
      const date = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })

      // Sla op via Netlify Function
      setSaving(true)
      await saveBookText(session, text)
      setBookText(text)
      setBookDate(date)
      anchorRef.current = { bi: 0, word: 0 }
      setCurrentPage(0)
      setSaving(false)

      setUploadStatus(broken.length > 0 ? `⚠ ${broken.length} opmerking(en) niet meer gevonden in de nieuwe tekst` : '✓ Geüpload op ' + date)
    } catch (err) { console.error(err); setUploadStatus('Fout bij uploaden.'); setSaving(false) }
    e.target.value = ''
  }

  function exportTxt() {
    const blob = new Blob([bookText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'voor-de-zon-opkwam.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (session?.role !== 'editor') return
    function onUp() {
      const sel = window.getSelection(); const txt = sel?.toString().trim()
      if (!txt || txt.length < 3) { setPopup(null); return }
      const range = sel.getRangeAt(0); const rect = range.getBoundingClientRect()
      setSelectedQuote(txt); setSelectedPos(bookText.indexOf(txt) === -1 ? Infinity : bookText.indexOf(txt))
      setPopup({ x: rect.left + rect.width / 2, y: rect.top - 8 })
    }
    document.addEventListener('mouseup', onUp)
    return () => document.removeEventListener('mouseup', onUp)
  }, [session, bookText])

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
    let targetPage = 0
    for (let bi = 0; bi < blocks.length; bi++) {
      const text = blocks[bi].text
      if (!text) continue
      const at = text.indexOf(note.quote)
      if (at !== -1) {
        // woordpositie binnen de alinea → juiste pagina, ook als de alinea gesplitst is
        const word = text.slice(0, at).split(' ').length - 1
        targetPage = findPage(pages, bi, word)
        break
      }
    }
    setOverlayOpen(false); setCurrentPage(targetPage); setActiveNoteId(note.id)
    setTimeout(() => setActiveNoteId(null), 2500)
  }

  async function sendNote() {
    if (!draft.trim() || (noteType === 'inline' && !selectedQuote)) return
    const n = { id: Date.now(), type: noteType, resolved: false, quote: noteType === 'inline' ? selectedQuote : '', pos: noteType === 'inline' ? selectedPos : Infinity, text: draft.trim(), author: session.displayName, date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) }
    const updated = [...notes, n]; setNotes(updated); setDraft(''); setSelectedQuote(''); setSelectedPos(Infinity); setNoteType('general')
    await persist(updated)
  }
  async function resolveNote(id) { const u = notes.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n); setNotes(u); await persist(u) }
  async function deleteNote(id) { const u = notes.filter(n => n.id !== id); setNotes(u); await persist(u) }
  async function saveEditNote(id) { const u = notes.map(n => n.id === id ? { ...n, text: editingNoteText } : n); setNotes(u); setEditingNoteId(null); await persist(u) }

  const renderNoteCard = (note) => {
    const isBroken = brokenNotes.some(b => b.id === note.id)
    return (
      <div key={note.id} id={'note-' + note.id}
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
          {session.role === 'writer' && <button className="suggestion-action-btn resolve" onClick={() => resolveNote(note.id)}>{note.resolved ? 'Heropen' : '✓ Verwerkt'}</button>}
          {session.role === 'editor' && <>
            <button className="suggestion-action-btn" onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text) }}>Bewerk</button>
            <button className="suggestion-action-btn delete" onClick={() => deleteNote(note.id)}>Verwijder</button>
          </>}
        </div>
      </div>
    )
  }

  const renderNotePanel = (listRef) => (
    <>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${activeTab === 'inline' ? 'active' : ''}`} onClick={() => setActiveTab('inline')}>Inline ({inlineNotes.length})</button>
        <button className={`sidebar-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Algemeen ({generalNotes.length})</button>
      </div>
      <div ref={listRef} className="suggestions-list">
        {(activeTab === 'inline' ? inlineNotes : generalNotes).length === 0
          ? <div className="no-suggestions">Geen opmerkingen.</div>
          : (activeTab === 'inline' ? inlineNotes : generalNotes).map(renderNoteCard)}
      </div>
      {session.role === 'editor' && (
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

  function handleLogin(name, role, displayName) {
    const pin = CREDS[name]?.pin || READER_PIN
    const s = { name, role, displayName, pin }
    saveSession(s)
    setSession(s)
  }

  if (!session) return <PinLogin onLogin={handleLogin}/>
  if (loading) return <div className="loading">Laden…</div>
  if (error) return <div className="loading">Fout: {error} <button onClick={() => { clearSession(); setSession(null) }}>Opnieuw aanmelden</button></div>

  const dotColor = session.role === 'writer' ? '#b97a5a' : session.role === 'editor' ? '#5a7ab9' : '#5aab6a'
  const roleLabel = session.role === 'writer' ? 'Schrijver' : session.role === 'editor' ? 'Redacteur' : 'Lezer'

  return (
    <div className="app" style={{ background: '#d4c9b0' }}>
      {popup && session?.role === 'editor' && (
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
            {renderNotePanel(overlayListRef)}
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
          {session.role === 'writer' && (
            <>
              <label className="upload-label">📄 <input type="file" accept=".docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload}/></label>
              <button className="export-label" onClick={exportTxt}>⬇</button>
              <button className={`toggle ${viewingEnabled ? 'on' : ''}`} onClick={toggleViewing} title={viewingEnabled ? 'Zichtbaar voor iedereen' : 'Enkel jij & Koen'}/>
            </>
          )}
          <div className={`badge badge-${session.role}`}>
            <div className="badge-dot" style={{ background: dotColor }}/>{session.displayName} · {roleLabel}
          </div>
          <button className="logout-btn" style={{ color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.18)' }} onClick={() => { clearSession(); setSession(null) }}>Afmelden</button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`upload-banner ${uploadStatus.includes('⚠') ? 'warn' : 'ok'}`}>
          {uploadStatus}
          {brokenNotes.length > 0 && <span className="upload-banner-link" onClick={() => { setOverlayOpen(true); setActiveTab('inline') }}>Bekijk →</span>}
        </div>
      )}

      <div className="main">
        <div className="reading-area" ref={pageRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {!canView ? (
            <div className="locked-state">
              <div className="locked-icon">🔒</div>
              <h3>Nog niet beschikbaar</h3>
              <p>Femke heeft het lezen tijdelijk uitgeschakeld.</p>
            </div>
          ) : (
            <div className="book-page" ref={bookPageRef} onClick={handlePageTap}>
              <div className="page-measurer" ref={measurerRef} aria-hidden="true"/>
              <div className="page-content" style={{ visibility: measuredPages ? 'visible' : 'hidden' }}>
                {pages[currentPage]?.map((block, i, arr) => {
                  // Artikel loopt door over de paginagrens → "afgescheurde" rand tonen
                  const inArticle = block.type === 'np-para' || block.type === 'np-foot'
                  const edge = (inArticle && i === 0 ? 'start ' : '') + (block.type === 'np-para' && i === arr.length - 1 ? 'end' : '')
                  return <Block key={currentPage + '-' + i} block={block} edge={edge} notes={notes} onHighlightClick={handleHighlightClick}/>
                })}
              </div>
              <div className="page-folio">{currentPage + 1}</div>
            </div>
          )}
        </div>

        {isEditor && (
          <div className="editor-sidebar">
            <div className="sidebar-header">
              <h3>{session.role === 'editor' ? 'Opmerkingen' : 'Opmerkingen van Koen'}</h3>
              <p>Klik om naar de pagina te springen</p>
            </div>
            {renderNotePanel(sidebarListRef)}
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
