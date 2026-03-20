'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrynqscwtctqbasivcvb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeW5xc2N3dGN0cWJhc2l2Y3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MDU3MywiZXhwIjoyMDU2MTY2NTczfQ.c2nnOxrj98uIGzAHBFodsEh6VWlWavjgM75WGYBgcYA'
)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Row { l: string; v: string; d: 'g' | 'y' | 'r' | '_' }
interface Flag { t: string; c: 'fr' | 'fa' | 'fb' }
interface Listing {
  id: string; name: string; addr: string; price: string; pn: string
  type: 'apartment' | 'cohousing'; beds: string; score: number
  status: 'top' | 'ok' | 'dead'; isNew: boolean
  rows: Row[]; flags: Flag[]; link: string; note: string
}
interface SharedState {
  favorites: string[]
  notes: Record<string, string>
  favoriteOrder: string[]
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LISTINGS: Listing[] = [
  { id:'anthem', name:'Anthem PDX', addr:'1313 E Burnside St · Kerns', price:'2BR from $1,953', pn:'studio–2BR · built 2020 · 211 units', type:'apartment', beds:'2BR', score:78, status:'ok', isNew:true,
    rows:[{l:'Natural light',v:'Big windows throughout',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Flooring',v:'Wood-look plank (no concrete)',d:'g'},{l:'2BR',v:'Available',d:'g'},{l:'AC',v:'Included in rent',d:'g'},{l:'Walk / Bike',v:'Walk 97 · Bike 100',d:'g'},{l:'Pets',v:'Yes, breed restrictions',d:'y'},{l:'Parking',v:'Unknown — ask',d:'y'}],
    flags:[{t:'Up to 8 weeks free on select units',c:'fb'},{t:'Utilities not included',c:'fa'}],
    link:'https://www.anthempdx.com', note:"Burnside Corridor — Portland's best eastside food/bar/music strip. Peloton, yoga room, courtyard firepit. Feels more 'corpo' aesthetically but ticks nearly every box." },
  { id:'homma', name:'HOMMA HAUS Mount Tabor', addr:'5115 E Burnside St · North Tabor', price:'$2,995/mo', pn:'2BR/2.5BA · 1,150 sqft · smart home', type:'apartment', beds:'2BR', score:74, status:'ok', isNew:true,
    rows:[{l:'Natural light',v:'Skylight + large windows',d:'g'},{l:'Kitchen',v:'Corian counters · gas · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size upstairs',d:'g'},{l:'2BR',v:'Yes + 2.5 baths',d:'g'},{l:'Seismic',v:'Built 2022 · current code',d:'g'},{l:'Heating',v:'Integrated HVAC',d:'g'},{l:'Pets',v:'2 small dogs/cats ($50/mo)',d:'y'},{l:'Parking',v:'Bike storage · no car parking',d:'y'}],
    flags:[{t:'No availability yet — ask for June',c:'fa'},{t:'Above $2k budget',c:'fa'}],
    link:'https://www.apartments.com/homma-haus-mount-tabor-smart-home-portland-or/stf0wj6/', note:'Built by Green Hammer (sustainable builders). Near Mt Tabor Park, food carts. Up to 8 weeks free. Currently waitlisted — call for June.' },
  { id:'aoe', name:'Atomic Orchard Experiment', addr:'2510 NE Sandy Blvd · Kerns', price:'$1,805–$1,999', pn:'1BR · utilities separate', type:'apartment', beds:'1BR', score:72, status:'top', isNew:false,
    rows:[{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz counters · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size front-load',d:'g'},{l:'Flooring',v:'Wood laminate + concrete',d:'y'},{l:'2BR',v:'1BR only currently',d:'r'},{l:'Seismic',v:'New build 2025',d:'g'},{l:'Pets',v:'Dogs + cats ($300 dep)',d:'g'}],
    flags:[{t:"Exposed concrete floors (both: Don't Want)",c:'fr'}],
    link:'https://www.apartments.com/atomic-orchard-experiment-portland-or/9bwstf4/', note:'#1 pick. Striking loft in Kerns. Verify the concrete floors — shared dealbreaker. Ask if 2BR is coming.' },
  { id:'waldorf', name:'Waldorf Apartments', addr:'833 NE Schuyler St · Irvington', price:'Call for price', pn:'KBC Mgmt · +$105/mo utilities', type:'apartment', beds:'2BR', score:68, status:'ok', isNew:false,
    rows:[{l:'Kitchen',v:'Retro checkered + built-ins',d:'y'},{l:'In-unit W/D',v:'Not listed — confirm',d:'y'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'Yes',d:'g'},{l:'Heating / AC',v:'AC confirmed',d:'g'},{l:'Pets',v:'Dogs + cats ($250 dep)',d:'g'}],
    flags:[{t:'Price unknown — call 503-287-6876',c:'fa'}],
    link:'https://www.kbcmgmt.com/listings/detail/48b2cfd2-1cd4-45e3-a72a-f1da1f97032f', note:'Best vintage 2BR character on the list. Near NE Broadway. Confirm laundry and price first.' },
  { id:'parkview', name:'Parkview Apartments', addr:"1640 NE Irving St · Sullivan's Gulch", price:'From $1,495', pn:'2BR 950 sqft · National Historic Registry · 1941', type:'apartment', beds:'2BR', score:64, status:'ok', isNew:true,
    rows:[{l:'Natural light',v:'Picture windows · tons of light',d:'g'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'No — basement shared',d:'r'},{l:'Flooring',v:'Beautiful hardwood',d:'g'},{l:'2BR',v:'Yes · 950 sqft',d:'g'},{l:'Heating',v:'Steam heat (vintage)',d:'y'},{l:'Storage',v:'5×7 basement unit included',d:'g'},{l:'Courtyard',v:'5-acre garden courtyard',d:'g'}],
    flags:[{t:'No in-unit laundry (basement shared)',c:'fr'},{t:'Steam heat — ask about drafts',c:'fa'}],
    link:'https://www.apartments.com/parkview-apartments-portland-or/sb2rbt6/', note:'Gorgeous historic property with garden courtyard and hardwood floors. Best-priced 2BR on the list. Shared laundry is the main drawback.' },
  { id:'kailash', name:'Kailash Ecovillage', addr:'SE Portland · Creston-Kenilworth', price:'Waitlist', pn:'1–2BR · rental model', type:'cohousing', beds:'1–2BR', score:62, status:'ok', isNew:true,
    rows:[{l:'Community',v:'Solar intentional community',d:'g'},{l:'Shared spaces',v:'Community room · treehouse · gardens',d:'g'},{l:'In-unit W/D',v:'Building laundry room',d:'y'},{l:'2BR',v:'Some units available',d:'y'},{l:'Eco values',v:'Solar · composting · car share',d:'g'},{l:'Location',v:'SE Portland inner city',d:'g'}],
    flags:[{t:'Waitlist — contact ASAP for June',c:'fa'},{t:'No guaranteed availability',c:'fa'}],
    link:'https://www.kailashecovillage.org/housing', note:'Best cohousing fit for science/left/creative values. Rental model — no ownership needed. Contact immediately at kailashecovillage.org/contact.' },
  { id:'belmont', name:'2121 Belmont', addr:'2121 SE Belmont St · Buckman', price:'From $1,977', pn:'2BR ~$2,500–$3,600', type:'apartment', beds:'1–2BR', score:61, status:'ok', isNew:false,
    rows:[{l:'Natural light',v:'Open-concept, glowing',d:'g'},{l:'Kitchen',v:'Condo-grade finishes',d:'g'},{l:'In-unit W/D',v:'Likely (condo build)',d:'y'},{l:'2BR',v:'Available (pricey)',d:'y'},{l:'Seismic',v:'Built 2008',d:'g'},{l:'Parking',v:'Underground garage',d:'g'}],
    flags:[{t:'Up to 6 weeks free running now',c:'fb'}],
    link:'https://www.2121belmontapts.com/', note:'Condo-grade Buckman build. Use the free weeks to offset 2BR cost.' },
  { id:'yamhill', name:'2026 SE Yamhill St Unit A', addr:'SE Yamhill · Buckman', price:'~$2,199 est', pn:'2BR/1BA · 1,210 sqft · Zillow est', type:'apartment', beds:'2BR', score:58, status:'ok', isNew:true,
    rows:[{l:'Natural light',v:'Big front window',d:'g'},{l:'Kitchen',v:'Gas range · dishwasher',d:'g'},{l:'In-unit W/D',v:'Not included',d:'r'},{l:'2BR',v:'Yes + attached garage',d:'g'},{l:'Utilities',v:'Water/sewer/garbage incl',d:'g'}],
    flags:[{t:'Not confirmed available — verify',c:'fa'},{t:"Linoleum floors (shared Don't Want)",c:'fr'}],
    link:'https://www.zillow.com/homedetails/2026-SE-Yamhill-St-APT-A-Portland-OR-97214/2069064308_zpid/', note:'Zillow historical listing — not confirmed live. Buckman, attached garage great for camping gear.' },
  { id:'alberta', name:'Intentional Community — Alberta Arts', addr:'Alberta Arts / Sabin · NE Portland', price:'$825/mo', pn:'Room in shared house · Craigslist', type:'cohousing', beds:'Room share', score:55, status:'ok', isNew:true,
    rows:[{l:'Community',v:'Intentional community listing',d:'g'},{l:'Location',v:'Alberta Arts — very cool area',d:'g'},{l:'Price',v:'$825/mo — very affordable',d:'g'},{l:'Private space',v:'Single room, shared home',d:'y'},{l:'2BR',v:'No — shared household',d:'r'}],
    flags:[{t:'Room share only',c:'fb'},{t:'CL listing — check soon',c:'fa'}],
    link:'https://portland.craigslist.org/search/roo', note:'Search "intentional community Alberta" in PDX Craigslist rooms & shares. Great short-term landing spot.' },
  { id:'cascadia', name:'Cascadia Commons', addr:'SW Portland · Raleigh Hills (97225)', price:'$1,800/mo', pn:'1BR 675 sqft · water/sewer/HOA incl', type:'cohousing', beds:'1BR', score:58, status:'ok', isNew:true,
    rows:[{l:'Natural light',v:"Vaulted 12' ceilings",d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'1BR only available',d:'r'},{l:'Community',v:'26 households since 1999',d:'g'},{l:'Shared spaces',v:'Dining hall · workshop · gardens',d:'g'}],
    flags:[{t:'SW Portland — less inner-city vibe',c:'fa'},{t:'Monthly work parties required',c:'fb'}],
    link:'https://cascadiacommons.com/units-for-sale-or-rent/', note:'Available now at $1,800/mo all-in. Contact: JwhateverG@gmail.com · 503-512-0662' },
  { id:'silver', name:'Silver Court (KBC)', addr:'2170 NE Hancock St · Irvington', price:'Call for price', pn:'+$85/mo utilities', type:'apartment', beds:'1BR', score:52, status:'ok', isNew:false,
    rows:[{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'1BR only',d:'r'},{l:'Pets',v:'Cats only — no dogs',d:'r'}],
    flags:[{t:'No dogs',c:'fr'},{t:'1BR only',c:'fr'}],
    link:'https://www.kbcmgmt.com/listings/detail/2168d557-94a3-42bc-8f1b-c28146d586aa', note:'Elegant 1920s Irvington. Cats-only and 1BR are likely dealbreakers.' },
  { id:'granada', name:'Granada Court (Bristol Urban)', addr:'932 NE Pacific St · Hollywood/Kerns', price:'Call for price', pn:'+$95/mo utilities', type:'apartment', beds:'Unknown', score:48, status:'ok', isNew:false,
    rows:[{l:'In-unit W/D',v:'Building shared only',d:'r'},{l:'Seismic',v:'1926 — ask about retrofit',d:'y'},{l:'Pets',v:'Dogs + cats, no pet rent',d:'g'}],
    flags:[{t:'No in-unit laundry',c:'fr'},{t:'1926 building',c:'fa'}],
    link:'https://www.bristolurban.com/listings/detail/bf220ceb-8085-4a54-8c85-47508f50ec10', note:'Charming courtyard. No in-unit laundry is a high-priority miss. Lower priority.' },
]

const LMAP = Object.fromEntries(LISTINGS.map(l => [l.id, l]))

const FILTERS = [
  { key:'all', label:'All' },
  { key:'apartment', label:'Apartments' },
  { key:'cohousing', label:'Cohousing' },
  { key:'2br', label:'Has 2BR' },
  { key:'inunit', label:'In-unit W/D' },
  { key:'new', label:'New finds' },
  { key:'favorites', label:'Favorited ★' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const scColor = (s: number) => s >= 70 ? '#16a34a' : s >= 55 ? '#d97706' : '#dc2626'

const dotStyle = (d: string): React.CSSProperties => ({
  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
  background: d === 'g' ? '#16a34a' : d === 'y' ? '#d97706' : d === 'r' ? '#dc2626' : '#d1d5db',
  boxShadow: d === 'g' ? '0 0 4px #16a34a60' : 'none',
})

const flagStyle = (c: string): React.CSSProperties => ({
  fontSize: 10, padding: '2px 8px', borderRadius: 99, display: 'inline-block',
  background: c === 'fr' ? '#fef2f2' : c === 'fa' ? '#fffbeb' : '#eff6ff',
  color: c === 'fr' ? '#b91c1c' : c === 'fa' ? '#b45309' : '#1d4ed8',
  border: `1px solid ${c === 'fr' ? '#fecaca' : c === 'fa' ? '#fde68a' : '#bfdbfe'}`,
})

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ listing, isFav, note, onToggleFav, onNoteChange, isDragging, isOver }:
  { listing: Listing; isFav: boolean; note: string; onToggleFav: (id:string)=>void; onNoteChange:(id:string,v:string)=>void; isDragging?:boolean; isOver?:boolean }) {

  const [flipped, setFlipped] = useState(false)
  const [local, setLocal] = useState(note)
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => { if (!flipped) setLocal(note) }, [note, flipped])

  function handleNote(v: string) {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onNoteChange(listing.id, v), 800)
  }

  const topBorder = listing.status === 'top' ? '2px solid #16a34a'
    : listing.type === 'cohousing' ? '2px solid #7c3aed'
    : '1px solid #e5e7eb'

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: topBorder,
    borderRadius: 14,
    boxShadow: isOver ? '0 0 0 2px #7c3aed, 0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.07)',
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
    transform: isOver ? 'scale(1.01)' : 'none',
    transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s',
    perspective: 1000,
    position: 'relative',
  }

  const inner: React.CSSProperties = {
    transition: 'transform 0.45s',
    transformStyle: 'preserve-3d',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    position: 'relative',
    minHeight: 200,
  }

  const face: React.CSSProperties = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }
  const back: React.CSSProperties = { ...face, position: 'absolute', inset: 0, transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column' }

  return (
    <div style={cardStyle}>
      <div style={inner}>
        {/* ── FRONT ── */}
        <div style={{ ...face, padding: 18 }}>
          {/* Badges */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
            {listing.status === 'top' && <Badge label="★ top pick" color="#dcfce7" text="#15803d" />}
            {listing.isNew && <Badge label="new" color="#f0fdf4" text="#15803d" />}
            {listing.type === 'cohousing' && <Badge label="cohousing" color="#f5f3ff" text="#6d28d9" />}
            {listing.beds.includes('2BR') ? <Badge label={listing.beds} color="#f5f3ff" text="#6d28d9" /> : <Badge label={listing.beds} color="#f9fafb" text="#6b7280" />}
            {isFav && <Badge label="★ fav" color="#fefce8" text="#a16207" />}
          </div>

          <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600, lineHeight:1.2, color:'#111827', marginBottom:2 }}>{listing.name}</div>
          <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:10, letterSpacing:'0.03em' }}>{listing.addr}</div>

          <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Georgia,serif', fontSize:19, color:'#111827' }}>{listing.price}</span>
            {listing.pn && <span style={{ fontSize:11, color:'#9ca3af' }}>· {listing.pn}</span>}
          </div>

          {listing.score > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <span style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.08em', color:'#9ca3af', width:52, flexShrink:0 }}>Fit</span>
              <div style={{ flex:1, height:3, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:99, width:`${listing.score}%`, background:scColor(listing.score) }} />
              </div>
              <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:500, width:22, textAlign:'right', color:scColor(listing.score) }}>{listing.score}</span>
            </div>
          )}

          <hr style={{ border:'none', borderTop:'1px solid #f3f4f6', margin:'8px 0 10px' }} />

          {listing.rows.map((r, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 0', gap:8 }}>
              <span style={{ fontSize:11, color:'#9ca3af', minWidth:88, flexShrink:0 }}>{r.l}</span>
              <span style={{ fontSize:11, fontWeight:500, color:'#1f2937', textAlign:'right', flex:1 }}>{r.v}</span>
              <div style={dotStyle(r.d)} />
            </div>
          ))}

          {listing.flags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:10 }}>
              {listing.flags.map((f, i) => <span key={i} style={flagStyle(f.c)}>{f.t}</span>)}
            </div>
          )}

          {note && (
            <div style={{ fontSize:10, color:'#7c3aed', fontFamily:'monospace', marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
              ✏ has notes — flip to read
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:10, borderTop:'1px solid #f3f4f6' }}>
            <a href={listing.link} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', textDecoration:'none', letterSpacing:'0.04em' }}>
              View listing →
            </a>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={() => setFlipped(true)}
                style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:6 }}>
                ✏ note
              </button>
              <button onClick={() => onToggleFav(listing.id)}
                style={{ fontSize:17, background:'none', border:'none', cursor:'pointer', lineHeight:1, color: isFav ? '#eab308' : '#d1d5db', transition:'color 0.15s' }}>
                ★
              </button>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{ ...back, padding:18, background:'#ffffff', borderRadius:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:15, color:'#111827', marginBottom:2 }}>{listing.name}</div>
              <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>{listing.addr}</div>
            </div>
            <button onClick={() => setFlipped(false)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af', lineHeight:1, flexShrink:0, marginLeft:8 }}>←</button>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:6 }}>Your notes (synced with Reese)</div>
          <textarea
            value={local}
            onChange={e => handleNote(e.target.value)}
            placeholder="Leave notes for each other… pros, cons, questions to ask…"
            style={{ flex:1, width:'100%', minHeight:140, fontSize:13, color:'#374151', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:12, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.55 }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af' }}>auto-saves · visible to both of you</span>
            <button onClick={() => setFlipped(false)}
              style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', background:'none', border:'none', cursor:'pointer' }}>done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ label, color, text }: { label:string; color:string; text:string }) {
  return (
    <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.04em', background:color, color:text }}>
      {label}
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ApartmentsPage() {
  const [filter, setFilter] = useState('all')
  const [state, setState] = useState<SharedState>({ favorites:[], notes:{}, favoriteOrder:[] })
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date|null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  // Drag state (for favorites reorder)
  const dragId = useRef<string|null>(null)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overId, setOverId] = useState<string|null>(null)

  useEffect(() => {
    loadState()
    const iv = setInterval(loadState, 8000)
    return () => clearInterval(iv)
  }, [])

  async function loadState() {
    const { data, error } = await supabase.from('apartment_state').select('data').eq('key','shared').single()
    if (!error && data?.data) { setState(data.data as SharedState); setLastSynced(new Date()) }
  }

  const persist = useCallback((next: SharedState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      await supabase.from('apartment_state').upsert({ key:'shared', data:next, updated_at:new Date().toISOString() })
      setSyncing(false); setLastSynced(new Date())
    }, 600)
  }, [])

  function toggleFav(id: string) {
    setState(prev => {
      const has = prev.favorites.includes(id)
      const favs = has ? prev.favorites.filter(f=>f!==id) : [...prev.favorites, id]
      const order = has ? prev.favoriteOrder.filter(f=>f!==id) : [...prev.favoriteOrder, id]
      const next = { ...prev, favorites:favs, favoriteOrder:order }
      persist(next); return next
    })
  }

  function updateNote(id: string, v: string) {
    setState(prev => { const next = { ...prev, notes:{ ...prev.notes, [id]:v } }; persist(next); return next })
  }

  // Drag handlers for favorites reorder
  function onDragStart(id: string) { dragId.current = id; setDraggingId(id) }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setOverId(id) }
  function onDrop(targetId: string) {
    if (!dragId.current || dragId.current === targetId) { setDraggingId(null); setOverId(null); return }
    setState(prev => {
      const order = prev.favoriteOrder.length > 0 ? [...prev.favoriteOrder] : [...prev.favorites]
      const from = order.indexOf(dragId.current!)
      const to = order.indexOf(targetId)
      if (from < 0 || to < 0) return prev
      order.splice(from, 1); order.splice(to, 0, dragId.current!)
      const next = { ...prev, favoriteOrder:order, favorites:order }
      persist(next); return next
    })
    dragId.current = null; setDraggingId(null); setOverId(null)
  }
  function onDragEnd() { dragId.current = null; setDraggingId(null); setOverId(null) }

  const favOrder = state.favoriteOrder.length > 0 ? state.favoriteOrder : state.favorites

  const visibleListings = (() => {
    if (filter === 'favorites') {
      return favOrder.map(id => LMAP[id]).filter(Boolean)
    }
    return LISTINGS.filter(l => {
      if (filter === 'all') return true
      if (filter === 'apartment') return l.type === 'apartment'
      if (filter === 'cohousing') return l.type === 'cohousing'
      if (filter === 'new') return l.isNew
      if (filter === '2br') return l.beds.includes('2BR')
      if (filter === 'inunit') return l.rows.some(r => r.l === 'In-unit W/D' && r.d === 'g')
      return true
    })
  })()

  const scored = visibleListings.filter(l => l.score > 0)
  const avgScore = scored.length ? Math.round(scored.reduce((a,b)=>a+b.score,0)/scored.length) : 0
  const isFavView = filter === 'favorites'

  return (
    <div style={{ background:'#f8f7f5', color:'#111827', minHeight:'100vh', fontFamily:"'Instrument Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid #e5e7eb', padding:'14px 28px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:'monospace', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', color:'#9ca3af', marginBottom:3 }}>Portland Move · June 2026</div>
          <h1 style={{ fontSize:22, fontWeight:400, lineHeight:1.15, fontFamily:'Georgia,serif' }}>
            Marvin & Reese&rsquo;s <em style={{ fontStyle:'italic', color:'#16a34a' }}>Housing Shortlist</em>
          </h1>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ fontFamily:'monospace', fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase', padding:'5px 12px', borderRadius:99, border:'1px solid', cursor:'pointer', transition:'all 0.12s',
                background: filter===f.key ? '#111827' : '#ffffff',
                color: filter===f.key ? '#ffffff' : '#6b7280',
                borderColor: filter===f.key ? '#111827' : '#d1d5db',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Stats ── */}
      <div style={{ padding:'10px 28px', background:'#f8f7f5', borderBottom:'1px solid #e5e7eb', display:'flex', flexWrap:'wrap', alignItems:'center', gap:24 }}>
        <Stat n={visibleListings.length} label="listings" />
        <Stat n={avgScore || 0} label="avg fit score" />
        <Stat n={visibleListings.filter(l=>l.beds.includes('2BR')).length} label="have 2BR" />
        <Stat n={state.favorites.length} label="favorited" />
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {syncing
            ? <span style={{ fontFamily:'monospace', fontSize:10, color:'#7c3aed' }}>saving…</span>
            : lastSynced && <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>synced {lastSynced.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          <div style={{ width:7, height:7, borderRadius:'50%', background: syncing ? '#7c3aed' : '#16a34a', boxShadow: syncing ? '0 0 6px #7c3aed' : '0 0 6px #16a34a' }} />
        </div>
        <div style={{ display:'flex', gap:14, fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ ...dotStyle('g'), display:'inline-block' }} /> confirmed</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ ...dotStyle('y'), display:'inline-block' }} /> ask/likely</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ ...dotStyle('r'), display:'inline-block' }} /> dealbreaker</span>
        </div>
      </div>

      {isFavView && visibleListings.length > 0 && (
        <div style={{ padding:'8px 28px 0', fontFamily:'monospace', fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Drag cards to reorder your favorites
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{ padding:'20px 28px 60px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(296px, 1fr))', gap:14 }}>
        {visibleListings.map((l, i) => (
          <div
            key={l.id}
            draggable={isFavView}
            onDragStart={isFavView ? () => onDragStart(l.id) : undefined}
            onDragOver={isFavView ? (e) => onDragOver(e, l.id) : undefined}
            onDrop={isFavView ? () => onDrop(l.id) : undefined}
            onDragEnd={isFavView ? onDragEnd : undefined}
            style={{ cursor: isFavView ? 'grab' : 'default', animation:`fadeUp 0.25s ease ${i*30}ms both` }}
          >
            {isFavView && (
              <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:4, textAlign:'center', letterSpacing:'0.06em' }}>
                #{favOrder.indexOf(l.id)+1}
              </div>
            )}
            <Card
              listing={l}
              isFav={state.favorites.includes(l.id)}
              note={state.notes[l.id] || ''}
              onToggleFav={toggleFav}
              onNoteChange={updateNote}
              isDragging={draggingId === l.id}
              isOver={overId === l.id && draggingId !== l.id}
            />
          </div>
        ))}
        {visibleListings.length === 0 && (
          <div style={{ gridColumn:'1/-1', padding:48, textAlign:'center', fontFamily:'Georgia,serif', fontSize:22, fontStyle:'italic', color:'#9ca3af' }}>
            {isFavView ? 'No favorites yet — star some listings!' : 'No listings match this filter.'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus { border-color: #a5b4fc !important; box-shadow: 0 0 0 3px #ede9fe; }
        button:hover { opacity: 0.8; }
      `}</style>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
      <span style={{ fontFamily:'Georgia,serif', fontSize:20 }}>{n || '—'}</span>
      <span style={{ fontSize:12, color:'#9ca3af' }}>{label}</span>
    </div>
  )
}
