'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrynqscwtctqbasivcvb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeW5xc2N3dGN0cWJhc2l2Y3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MDU3MywiZXhwIjoyMDU2MTY2NTczfQ.c2nnOxrj98uIGzAHBFodsEh6VWlWavjgM75WGYBgcYA'
)

interface Row { l: string; v: string; d: 'g' | 'y' | 'r' | '_' }
interface Flag { t: string; c: 'fr' | 'fa' | 'fb' }
interface Listing {
  id: string; name: string; addr: string; price: string; pn: string
  type: 'apartment' | 'cohousing'; beds: string; score: number
  status: 'top' | 'ok' | 'dead'; isNew: boolean
  rows: Row[]; flags: Flag[]; link: string; note: string
  gradient: string
}
interface SharedState {
  favorites: string[]
  notes: Record<string, string>
  favoriteOrder: string[]
  archived: string[]
  photos: Record<string, string>
}

const LISTINGS: Listing[] = [
  { id:'anthem', name:'Anthem PDX', addr:'1313 E Burnside St · Kerns', price:'2BR from $1,953', pn:'studio–2BR · built 2020 · 211 units', type:'apartment', beds:'2BR', score:78, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    rows:[{l:'Natural light',v:'Big windows throughout',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Flooring',v:'Wood-look plank (no concrete)',d:'g'},{l:'2BR',v:'Available',d:'g'},{l:'AC',v:'Included in rent',d:'g'},{l:'Walk / Bike',v:'Walk 97 · Bike 100',d:'g'},{l:'Pets',v:'Yes, breed restrictions',d:'y'},{l:'Parking',v:'Unknown — ask',d:'y'}],
    flags:[{t:'Up to 8 weeks free on select units',c:'fb'},{t:'Utilities not included',c:'fa'}],
    link:'https://www.anthempdx.com', note:"Burnside Corridor — Portland's best eastside food/bar/music strip. Peloton, yoga room, courtyard firepit. Feels more 'corpo' aesthetically but ticks nearly every box." },
  { id:'homma', name:'HOMMA HAUS Mount Tabor', addr:'5115 E Burnside St · North Tabor', price:'$2,995/mo', pn:'2BR/2.5BA · 1,150 sqft · smart home', type:'apartment', beds:'2BR', score:74, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    rows:[{l:'Natural light',v:'Skylight + large windows',d:'g'},{l:'Kitchen',v:'Corian counters · gas · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size upstairs',d:'g'},{l:'2BR',v:'Yes + 2.5 baths',d:'g'},{l:'Seismic',v:'Built 2022 · current code',d:'g'},{l:'Heating',v:'Integrated HVAC',d:'g'},{l:'Pets',v:'2 small dogs/cats ($50/mo)',d:'y'},{l:'Parking',v:'Bike storage · no car parking',d:'y'}],
    flags:[{t:'No availability yet — ask for June',c:'fa'},{t:'Above $2k budget',c:'fa'}],
    link:'https://www.apartments.com/homma-haus-mount-tabor-smart-home-portland-or/stf0wj6/', note:'Built by Green Hammer (sustainable builders). Near Mt Tabor Park, food carts. Up to 8 weeks free. Currently waitlisted — call for June.' },
  { id:'aoe', name:'Atomic Orchard Experiment', addr:'2510 NE Sandy Blvd · Kerns', price:'$1,805–$1,999', pn:'1BR · utilities separate', type:'apartment', beds:'1BR', score:72, status:'ok', isNew:false,
    gradient:'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)',
    rows:[{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz counters · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size front-load',d:'g'},{l:'Flooring',v:'Wood laminate + concrete',d:'y'},{l:'2BR',v:'1BR only currently',d:'r'},{l:'Seismic',v:'New build 2025',d:'g'},{l:'Pets',v:'Dogs + cats ($300 dep)',d:'g'}],
    flags:[{t:"Exposed concrete floors (both: Don't Want)",c:'fr'}],
    link:'https://www.apartments.com/atomic-orchard-experiment-portland-or/9bwstf4/', note:'Striking loft in Kerns. Verify the concrete floors — shared dealbreaker. Ask if 2BR is coming.' },
  { id:'waldorf', name:'Waldorf Apartments', addr:'833 NE Schuyler St · Irvington', price:'Call for price', pn:'KBC Mgmt · +$105/mo utilities', type:'apartment', beds:'2BR', score:68, status:'ok', isNew:false,
    gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rows:[{l:'Kitchen',v:'Retro checkered + built-ins',d:'y'},{l:'In-unit W/D',v:'Not listed — confirm',d:'y'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'Yes',d:'g'},{l:'Heating / AC',v:'AC confirmed',d:'g'},{l:'Pets',v:'Dogs + cats ($250 dep)',d:'g'}],
    flags:[{t:'Price unknown — call 503-287-6876',c:'fa'}],
    link:'https://www.kbcmgmt.com/listings/detail/48b2cfd2-1cd4-45e3-a72a-f1da1f97032f', note:'Best vintage 2BR character on the list. Near NE Broadway. Confirm laundry and price first.' },
  { id:'parkview', name:'Parkview Apartments', addr:"1640 NE Irving St · Sullivan's Gulch", price:'From $1,495', pn:'2BR 950 sqft · National Historic Registry · 1941', type:'apartment', beds:'2BR', score:64, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #093637 100%)',
    rows:[{l:'Natural light',v:'Picture windows · tons of light',d:'g'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'No — basement shared',d:'r'},{l:'Flooring',v:'Beautiful hardwood',d:'g'},{l:'2BR',v:'Yes · 950 sqft',d:'g'},{l:'Heating',v:'Steam heat (vintage)',d:'y'},{l:'Storage',v:'5×7 basement unit included',d:'g'},{l:'Courtyard',v:'5-acre garden courtyard',d:'g'}],
    flags:[{t:'No in-unit laundry (basement shared)',c:'fr'},{t:'Steam heat — ask about drafts',c:'fa'}],
    link:'https://www.apartments.com/parkview-apartments-portland-or/sb2rbt6/', note:'Gorgeous historic property with garden courtyard and hardwood floors. Best-priced 2BR on the list. Shared laundry is the main drawback.' },
  { id:'kailash', name:'Kailash Ecovillage', addr:'SE Portland · Creston-Kenilworth', price:'Waitlist', pn:'1–2BR · rental model', type:'cohousing', beds:'1–2BR', score:62, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    rows:[{l:'Community',v:'Solar intentional community',d:'g'},{l:'Shared spaces',v:'Community room · treehouse · gardens',d:'g'},{l:'In-unit W/D',v:'Building laundry room',d:'y'},{l:'2BR',v:'Some units available',d:'y'},{l:'Eco values',v:'Solar · composting · car share',d:'g'},{l:'Location',v:'SE Portland inner city',d:'g'}],
    flags:[{t:'Waitlist — contact ASAP for June',c:'fa'},{t:'No guaranteed availability',c:'fa'}],
    link:'https://www.kailashecovillage.org/housing', note:'Best cohousing fit for science/left/creative values. Rental model — no ownership needed. Contact immediately at kailashecovillage.org/contact.' },
  { id:'belmont', name:'2121 Belmont', addr:'2121 SE Belmont St · Buckman', price:'From $1,977', pn:'2BR ~$2,500–$3,600', type:'apartment', beds:'1–2BR', score:61, status:'ok', isNew:false,
    gradient:'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    rows:[{l:'Natural light',v:'Open-concept, glowing',d:'g'},{l:'Kitchen',v:'Condo-grade finishes',d:'g'},{l:'In-unit W/D',v:'Likely (condo build)',d:'y'},{l:'2BR',v:'Available (pricey)',d:'y'},{l:'Seismic',v:'Built 2008',d:'g'},{l:'Parking',v:'Underground garage',d:'g'}],
    flags:[{t:'Up to 6 weeks free running now',c:'fb'}],
    link:'https://www.2121belmontapts.com/', note:'Condo-grade Buckman build. Use the free weeks to offset 2BR cost.' },
  { id:'yamhill', name:'2026 SE Yamhill St Unit A', addr:'SE Yamhill · Buckman', price:'~$2,199 est', pn:'2BR/1BA · 1,210 sqft · Zillow est', type:'apartment', beds:'2BR', score:58, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
    rows:[{l:'Natural light',v:'Big front window',d:'g'},{l:'Kitchen',v:'Gas range · dishwasher',d:'g'},{l:'In-unit W/D',v:'Not included',d:'r'},{l:'2BR',v:'Yes + attached garage',d:'g'},{l:'Utilities',v:'Water/sewer/garbage incl',d:'g'}],
    flags:[{t:'Not confirmed available — verify',c:'fa'},{t:"Linoleum floors (shared Don't Want)",c:'fr'}],
    link:'https://www.zillow.com/homedetails/2026-SE-Yamhill-St-APT-A-Portland-OR-97214/2069064308_zpid/', note:'Zillow historical listing — not confirmed live. Buckman, attached garage great for camping gear.' },
  { id:'alberta', name:'Intentional Community — Alberta Arts', addr:'Alberta Arts / Sabin · NE Portland', price:'$825/mo', pn:'Room in shared house · Craigslist', type:'cohousing', beds:'Room share', score:55, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    rows:[{l:'Community',v:'Intentional community listing',d:'g'},{l:'Location',v:'Alberta Arts — very cool area',d:'g'},{l:'Price',v:'$825/mo — very affordable',d:'g'},{l:'Private space',v:'Single room, shared home',d:'y'},{l:'2BR',v:'No — shared household',d:'r'}],
    flags:[{t:'Room share only',c:'fb'},{t:'CL listing — check soon',c:'fa'}],
    link:'https://portland.craigslist.org/search/roo', note:'Search "intentional community Alberta" in PDX Craigslist rooms & shares. Great short-term landing spot.' },
  { id:'cascadia', name:'Cascadia Commons', addr:'SW Portland · Raleigh Hills (97225)', price:'$1,800/mo', pn:'1BR 675 sqft · water/sewer/HOA incl', type:'cohousing', beds:'1BR', score:58, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #1d976c 0%, #93f9b9 100%)',
    rows:[{l:'Natural light',v:"Vaulted 12' ceilings",d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'1BR only available',d:'r'},{l:'Community',v:'26 households since 1999',d:'g'},{l:'Shared spaces',v:'Dining hall · workshop · gardens',d:'g'}],
    flags:[{t:'SW Portland — less inner-city vibe',c:'fa'},{t:'Monthly work parties required',c:'fb'}],
    link:'https://cascadiacommons.com/units-for-sale-or-rent/', note:'Available now at $1,800/mo all-in. Contact: JwhateverG@gmail.com · 503-512-0662' },
  { id:'silver', name:'Silver Court (KBC)', addr:'2170 NE Hancock St · Irvington', price:'Call for price', pn:'+$85/mo utilities', type:'apartment', beds:'1BR', score:52, status:'ok', isNew:false,
    gradient:'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
    rows:[{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'1BR only',d:'r'},{l:'Pets',v:'Cats only — no dogs',d:'r'}],
    flags:[{t:'No dogs',c:'fr'},{t:'1BR only',c:'fr'}],
    link:'https://www.kbcmgmt.com/listings/detail/2168d557-94a3-42bc-8f1b-c28146d586aa', note:'Elegant 1920s Irvington. Cats-only and 1BR are likely dealbreakers.' },
  { id:'granada', name:'Granada Court (Bristol Urban)', addr:'932 NE Pacific St · Hollywood/Kerns', price:'Call for price', pn:'+$95/mo utilities', type:'apartment', beds:'Unknown', score:48, status:'ok', isNew:false,
    gradient:'linear-gradient(135deg, #e96c0e 0%, #f5d020 100%)',
    rows:[{l:'In-unit W/D',v:'Building shared only',d:'r'},{l:'Seismic',v:'1926 — ask about retrofit',d:'y'},{l:'Pets',v:'Dogs + cats, no pet rent',d:'g'}],
    flags:[{t:'No in-unit laundry',c:'fr'},{t:'1926 building',c:'fa'}],
    link:'https://www.bristolurban.com/listings/detail/bf220ceb-8085-4a54-8c85-47508f50ec10', note:'Charming courtyard. No in-unit laundry is a high-priority miss. Lower priority.' },
  { id:'east12', name:'East 12 Lofts', addr:'1100 SE 12th Ave · Buckman', price:'From $1,195', pn:'Studio/1BR · 380–445 sqft · built 2014', type:'apartment', beds:'Studio/1BR', score:63, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
    rows:[{l:'Natural light',v:'Oversized windows · city views',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless steel',d:'g'},{l:'In-unit W/D',v:'Stacked in-unit',d:'g'},{l:'2BR',v:'No — studio/1BR only',d:'r'},{l:'Flooring',v:'Unknown — ask',d:'y'},{l:'Seismic',v:'Built 2014',d:'g'},{l:'Pets',v:'Dogs + cats (100lb max, $250 dep)',d:'g'},{l:'Amenities',v:'Rooftop deck · fitness · bike room',d:'g'},{l:'Walk / Bike',v:'Walk 96 · very bikeable',d:'g'}],
    flags:[{t:'Studio/1BR only — no 2BR',c:'fr'},{t:'1 month free on select units',c:'fb'}],
    link:'https://www.liveeast12.com/', note:'Buckman location is excellent — steps from food carts, cafes, Hawthorne bridge. Units are small (380–445 sqft) but well finished.' },
  { id:'cookstreet', name:'Cook Street', addr:'107 N Cook St · Williams District', price:'From $1,335', pn:'Studio–2BR · 490–983 sqft · built 2016', type:'apartment', beds:'2BR', score:71, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    rows:[{l:'Natural light',v:'Picture windows · city views',d:'g'},{l:'Kitchen',v:'Luxury finishes — confirm details',d:'y'},{l:'In-unit W/D',v:'Confirm — not listed explicitly',d:'y'},{l:'2BR',v:'Available · up to 983 sqft',d:'g'},{l:'Eco-friendly',v:'Natural NW materials · green build',d:'g'},{l:'Seismic',v:'Built 2016',d:'g'},{l:'Pets',v:'Dogs + cats (no weight limit!)',d:'g'},{l:'Walk / Bike',v:'Walk 94 · near Mississippi/Alberta',d:'g'}],
    flags:[{t:'Confirm in-unit W/D before touring',c:'fa'}],
    link:'https://cookstreetportland.com/', note:'Williams District — one block from Mississippi Ave, close to Alberta Arts. Picture windows, eco-build, no pet weight limit (rare). Strong 2BR option.' },
  { id:'fortyone11', name:'Forty One 11', addr:'4111 NE MLK Blvd · Alberta/King', price:'From $1,199', pn:'Studio–2BR · 394–931 sqft · built 2019', type:'apartment', beds:'2BR', score:62, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    rows:[{l:'Natural light',v:'Unknown — ask',d:'y'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'Unknown — ask',d:'y'},{l:'2BR',v:'Available · up to 931 sqft',d:'g'},{l:'Area',v:'Alberta Arts / King neighborhood',d:'g'},{l:'Seismic',v:'Built 2019',d:'g'},{l:'Pets',v:'Unknown — ask',d:'y'},{l:'Price',v:'Very affordable for 2BR',d:'g'}],
    flags:[{t:'Many details unknown — call to confirm',c:'fa'}],
    link:'https://www.fortyone11pdx.com/', note:'Alberta Arts / King neighborhood — one of the coolest areas on your list. Very competitive price for 2BR. Worth a call.' },
  { id:'kingstreet', name:'King Street Lofts', addr:'405 NE Mason St · Alberta/King', price:'From $1,075', pn:'1BR · 556–667 sqft · in-unit W/D', type:'apartment', beds:'1BR', score:57, status:'ok', isNew:true,
    gradient:'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    rows:[{l:'Natural light',v:'Unknown — ask',d:'y'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'Yes — confirmed',d:'g'},{l:'2BR',v:'Primarily 1BR',d:'r'},{l:'Area',v:'Alberta Arts — very cool',d:'g'},{l:'Price',v:'Very affordable',d:'g'},{l:'Pets',v:'Unknown — ask',d:'y'}],
    flags:[{t:'Primarily 1BR units',c:'fr'},{t:'Best price on the list',c:'fb'}],
    link:'https://www.apartments.com/king-street-lofts-portland-or/nj2bkkq/', note:'Alberta Arts area, excellent price. Mainly 1BR but worth confirming if any 2BR exist.' },
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
  { key:'archived', label:'Archived' },
]

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

// ── Photo section ─────────────────────────────────────────────────────────────
function CardPhoto({ listing, photo, isArchived, onUpload }: {
  listing: Listing; photo: string; isArchived: boolean; onUpload: (id: string, dataUrl: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpload(listing.id, reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const imgSrc = photo || null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', height: 176, borderRadius: '13px 13px 0 0', overflow: 'hidden', flexShrink: 0 }}
    >
      {/* Image or gradient */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={listing.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isArchived ? 'grayscale(60%)' : 'none' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: listing.gradient, display: 'flex', alignItems: 'flex-end', padding: '12px 14px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            tap 📷 to add photo
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          position: 'absolute', inset: 0,
          background: hovered ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0)',
          transition: 'background 0.2s',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {hovered && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: '#fff', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em',
          }}>
            <span style={{ fontSize: 22 }}>📷</span>
            <span>{photo ? 'Replace photo' : 'Upload photo'}</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Bottom gradient fade into card */}
      {imgSrc && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ listing, isFav, isArchived, isTopPick, note, photo, onToggleFav, onToggleArchive, onNoteChange, onPhotoUpload, isDragging, isOver }:
  { listing: Listing; isFav: boolean; isArchived: boolean; isTopPick: boolean; note: string; photo: string
    onToggleFav: (id:string)=>void; onToggleArchive: (id:string)=>void
    onNoteChange:(id:string,v:string)=>void; onPhotoUpload:(id:string,url:string)=>void
    isDragging?:boolean; isOver?:boolean }) {

  const [flipped, setFlipped] = useState(isArchived)
  const [local, setLocal] = useState(note)
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => { if (!flipped) setLocal(note) }, [note, flipped])

  function handleNote(v: string) {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onNoteChange(listing.id, v), 800)
  }

  const topBorder = isArchived ? '1px solid #e5e7eb'
    : isTopPick ? '2px solid #16a34a'
    : listing.type === 'cohousing' ? '2px solid #7c3aed'
    : '1px solid #e5e7eb'

  const cardStyle: React.CSSProperties = {
    background: isArchived ? '#fafafa' : '#ffffff',
    border: topBorder,
    borderRadius: 14,
    boxShadow: isOver ? '0 0 0 2px #7c3aed, 0 8px 24px rgba(0,0,0,0.12)' : '0 1px 6px rgba(0,0,0,0.08)',
    opacity: isDragging ? 0.4 : isArchived ? 0.65 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
    transform: isOver ? 'scale(1.01)' : 'none',
    transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  const inner: React.CSSProperties = {
    transition: 'transform 0.45s',
    transformStyle: 'preserve-3d',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    flex: 1,
    perspective: 1000,
    position: 'relative',
  }

  const face: React.CSSProperties = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }
  const back: React.CSSProperties = { ...face, position: 'absolute', inset: 0, transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column' }

  return (
    <div style={cardStyle}>
      {/* Photo always visible at top (not flipped) */}
      {!flipped && (
        <CardPhoto listing={listing} photo={photo} isArchived={isArchived} onUpload={onPhotoUpload} />
      )}

      <div style={{ position: 'relative', flex: 1 }}>
        <div style={inner}>
          {/* ── FRONT ── */}
          <div style={{ ...face, padding: '14px 16px 16px' }}>
            {/* Badges */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
              {isTopPick && <Badge label="★ top pick" color="#dcfce7" text="#15803d" />}
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
              <div style={{ fontSize:10, color:'#7c3aed', fontFamily:'monospace', marginTop:8 }}>
                ✏ has notes — flip to read
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:10, borderTop:'1px solid #f3f4f6' }}>
              <a href={listing.link} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', textDecoration:'none', letterSpacing:'0.04em' }}>
                View listing →
              </a>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <button onClick={() => setFlipped(true)}
                  style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:6 }}>
                  ✏
                </button>
                <button onClick={() => onToggleFav(listing.id)} title={isFav ? 'Remove favorite' : 'Favorite'}
                  style={{ fontSize:16, background:'none', border:'none', cursor:'pointer', lineHeight:1, color: isFav ? '#eab308' : '#d1d5db', padding:'4px 4px' }}>
                  ★
                </button>
                <button onClick={() => onToggleArchive(listing.id)} title={isArchived ? 'Unarchive' : 'Archive — rule out'}
                  style={{ fontFamily:'monospace', fontSize:10, background: isArchived ? '#fff1f1' : 'none', border:'1px solid', cursor:'pointer', padding:'3px 7px', borderRadius:6, lineHeight:1.4,
                    color: isArchived ? '#b91c1c' : '#9ca3af', borderColor: isArchived ? '#fca5a5' : '#e5e7eb' }}>
                  {isArchived ? '↺ Unarchive' : '✕'}
                </button>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div style={{ ...back, padding:16, background: isArchived ? '#fff8f8' : '#ffffff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:15, color:'#111827', marginBottom:2 }}>{listing.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>{listing.addr}</div>
              </div>
              <button onClick={() => setFlipped(false)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af', lineHeight:1, flexShrink:0, marginLeft:8 }}>←</button>
            </div>
            <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color: isArchived ? '#ef4444' : '#9ca3af', marginBottom:6 }}>
              {isArchived ? 'Ruled out — reason / notes' : 'Your notes (synced with Reese)'}
            </div>
            <textarea
              value={local}
              onChange={e => handleNote(e.target.value)}
              placeholder="Leave notes for each other… pros, cons, questions to ask…"
              style={{ flex:1, width:'100%', minHeight:140, fontSize:13, color:'#374151', background: isArchived ? '#fff1f1' : '#f9fafb', border:`1px solid ${isArchived ? '#fca5a5' : '#e5e7eb'}`, borderRadius:10, padding:12, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.55 }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
              <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af' }}>auto-saves · synced</span>
              <button onClick={() => setFlipped(false)}
                style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', background:'none', border:'none', cursor:'pointer' }}>done</button>
            </div>
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
  const [state, setState] = useState<SharedState>({ favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{} })
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date|null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

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
    if (!error && data?.data) {
      setState({ favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, ...(data.data as SharedState) })
      setLastSynced(new Date())
    }
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
      const favorites = has ? prev.favorites.filter(f=>f!==id) : [...prev.favorites, id]
      const favoriteOrder = has ? prev.favoriteOrder.filter(f=>f!==id) : [...prev.favoriteOrder, id]
      const next = { ...prev, favorites, favoriteOrder }
      persist(next); return next
    })
  }

  function updateNote(id: string, v: string) {
    setState(prev => { const next = { ...prev, notes:{ ...prev.notes, [id]:v } }; persist(next); return next })
  }

  function updatePhoto(id: string, dataUrl: string) {
    setState(prev => { const next = { ...prev, photos:{ ...prev.photos, [id]:dataUrl } }; persist(next); return next })
  }

  function toggleArchive(id: string) {
    setState(prev => {
      const has = (prev.archived || []).includes(id)
      const archived = has ? prev.archived.filter(a=>a!==id) : [...(prev.archived||[]), id]
      const favorites = has ? prev.favorites : prev.favorites.filter(f=>f!==id)
      const favoriteOrder = has ? prev.favoriteOrder : prev.favoriteOrder.filter(f=>f!==id)
      const next = { ...prev, archived, favorites, favoriteOrder }
      persist(next); return next
    })
  }

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

  const archived = state.archived || []
  const favOrder = state.favoriteOrder.length > 0 ? state.favoriteOrder : state.favorites
  const isArchiveView = filter === 'archived'
  const isFavView = filter === 'favorites'
  const isAllView = filter === 'all'
  const topPickId = favOrder[0] || null

  // Kanban groups (only used in All view)
  const kanbanFavorited = favOrder.map(id => LMAP[id]).filter(l => l && !archived.includes(l.id))
  const kanbanNew = LISTINGS.filter(l => !archived.includes(l.id) && !favOrder.includes(l.id))

  const visibleListings = (() => {
    if (isArchiveView) return LISTINGS.filter(l => archived.includes(l.id))
    if (isFavView) return favOrder.map(id => LMAP[id]).filter(l => l && !archived.includes(l.id))
    if (isAllView) return [] // handled separately as kanban groups
    return LISTINGS.filter(l => {
      if (archived.includes(l.id)) return false
      if (filter === 'apartment') return l.type === 'apartment'
      if (filter === 'cohousing') return l.type === 'cohousing'
      if (filter === 'new') return l.isNew
      if (filter === '2br') return l.beds.includes('2BR')
      if (filter === 'inunit') return l.rows.some(r => r.l === 'In-unit W/D' && r.d === 'g')
      return true
    })
  })()

  const allForStats = isAllView
    ? [...kanbanFavorited, ...kanbanNew]
    : isArchiveView ? LISTINGS.filter(l => archived.includes(l.id)) : visibleListings
  const scored = allForStats.filter(l => l.score > 0)
  const avgScore = scored.length ? Math.round(scored.reduce((a,b)=>a+b.score,0)/scored.length) : 0

  // Shared card renderer to avoid repetition
  function renderCard(l: Listing, i: number, draggable = false, showRank = false) {
    return (
      <div
        key={l.id}
        draggable={draggable}
        onDragStart={draggable ? () => onDragStart(l.id) : undefined}
        onDragOver={draggable ? (e) => onDragOver(e, l.id) : undefined}
        onDrop={draggable ? () => onDrop(l.id) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        style={{ cursor: draggable ? 'grab' : 'default', animation:`fadeUp 0.25s ease ${i*30}ms both` }}
      >
        {showRank && (
          <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:4, textAlign:'center', letterSpacing:'0.06em' }}>
            #{favOrder.indexOf(l.id)+1}
          </div>
        )}
        <Card
          listing={l}
          isFav={state.favorites.includes(l.id)}
          isArchived={archived.includes(l.id)}
          isTopPick={l.id === topPickId}
          note={state.notes[l.id] || ''}
          photo={(state.photos || {})[l.id] || ''}
          onToggleFav={toggleFav}
          onToggleArchive={toggleArchive}
          onNoteChange={updateNote}
          onPhotoUpload={updatePhoto}
          isDragging={draggingId === l.id}
          isOver={overId === l.id && draggingId !== l.id}
        />
      </div>
    )
  }

  return (
    <div style={{ background:'#f8f7f5', color:'#111827', minHeight:'100vh', fontFamily:"'Instrument Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid #e5e7eb', padding:'14px 28px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:'monospace', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', color:'#9ca3af', marginBottom:3 }}>Portland Move · June 2026</div>
          <h1 style={{ fontSize:22, fontWeight:400, lineHeight:1.15, fontFamily:'Georgia,serif' }}>
            Marvin & Reese&rsquo;s <em style={{ fontStyle:'italic', color:'#16a34a' }}>Housing Shortlist</em>
          </h1>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {FILTERS.map(f => {
            const isArchiveBtn = f.key === 'archived'
            const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ fontFamily:'monospace', fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase', padding:'5px 12px', borderRadius:99, border:'1px solid', cursor:'pointer', transition:'all 0.12s',
                  background: active ? (isArchiveBtn ? '#7f1d1d' : '#111827') : isArchiveBtn ? '#fff1f1' : '#ffffff',
                  color: active ? '#ffffff' : isArchiveBtn ? '#b91c1c' : '#6b7280',
                  borderColor: active ? (isArchiveBtn ? '#7f1d1d' : '#111827') : isArchiveBtn ? '#fca5a5' : '#d1d5db',
                }}>
                {f.label}{isArchiveBtn && archived.length > 0 ? ` (${archived.length})` : ''}
              </button>
            )
          })}
        </div>
      </header>

      <div style={{ padding:'10px 28px', background:'#f8f7f5', borderBottom:'1px solid #e5e7eb', display:'flex', flexWrap:'wrap', alignItems:'center', gap:24 }}>
        {[{n:allForStats.length,l:'listings'},{n:avgScore||0,l:'avg fit score'},{n:allForStats.filter(l=>l.beds.includes('2BR')).length,l:'have 2BR'},{n:state.favorites.length,l:'favorited'}].map(s=>(
          <div key={s.l} style={{ display:'flex', alignItems:'baseline', gap:5 }}>
            <span style={{ fontFamily:'Georgia,serif', fontSize:20 }}>{s.n||'—'}</span>
            <span style={{ fontSize:12, color:'#9ca3af' }}>{s.l}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {syncing ? <span style={{ fontFamily:'monospace', fontSize:10, color:'#7c3aed' }}>saving…</span>
            : lastSynced && <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>synced {lastSynced.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          <div style={{ width:7, height:7, borderRadius:'50%', background: syncing ? '#7c3aed' : '#16a34a' }} />
        </div>
        <div style={{ display:'flex', gap:14, fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>
          {[['g','confirmed'],['y','ask/likely'],['r','dealbreaker']].map(([d,l])=>(
            <span key={d} style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ ...dotStyle(d), display:'inline-block' }} />{l}</span>
          ))}
        </div>
      </div>

      {isFavView && visibleListings.length > 0 && (
        <div style={{ padding:'8px 28px 0', fontFamily:'monospace', fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Drag cards to reorder your favorites
        </div>
      )}
      {isArchiveView && visibleListings.length > 0 && (
        <div style={{ padding:'8px 28px 0', fontFamily:'monospace', fontSize:10, color:'#b91c1c', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Ruled out — click ↺ Unarchive on any card to restore it
        </div>
      )}

      {/* ── KANBAN (All view) ── */}
      {isAllView && (
        <div style={{ padding:'24px 28px 60px', display:'flex', flexDirection:'column', gap:40 }}>
          {/* Favorited group */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:'#111827' }}>Favorited</span>
              <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', letterSpacing:'0.08em' }}>{kanbanFavorited.length} · drag to reorder</span>
              <div style={{ flex:1, height:1, background:'#e5e7eb', marginLeft:4 }} />
            </div>
            {kanbanFavorited.length === 0 ? (
              <div style={{ fontFamily:'Georgia,serif', fontSize:15, fontStyle:'italic', color:'#d1d5db', padding:'24px 0' }}>
                Star a listing to add it here
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(296px, 1fr))', gap:16 }}>
                {kanbanFavorited.map((l, i) => renderCard(l, i, true, true))}
              </div>
            )}
          </div>

          {/* New / considering group */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:'#111827' }}>Considering</span>
              <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', letterSpacing:'0.08em' }}>{kanbanNew.length} listings</span>
              <div style={{ flex:1, height:1, background:'#e5e7eb', marginLeft:4 }} />
            </div>
            {kanbanNew.length === 0 ? (
              <div style={{ fontFamily:'Georgia,serif', fontSize:15, fontStyle:'italic', color:'#d1d5db', padding:'24px 0' }}>
                All listings are favorited or archived
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(296px, 1fr))', gap:16 }}>
                {kanbanNew.map((l, i) => renderCard(l, i, false, false))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLAT GRID (all other filters) ── */}
      {!isAllView && (
        <div style={{ padding:'20px 28px 60px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(296px, 1fr))', gap:16 }}>
          {visibleListings.map((l, i) => renderCard(l, i, isFavView, isFavView))}
          {visibleListings.length === 0 && (
            <div style={{ gridColumn:'1/-1', padding:48, textAlign:'center', fontFamily:'Georgia,serif', fontSize:22, fontStyle:'italic', color:'#9ca3af' }}>
              {isArchiveView ? 'Nothing archived yet — use ✕ on a card to rule it out.' : isFavView ? 'No favorites yet — star some listings!' : 'No listings match this filter.'}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus { border-color: #a5b4fc !important; box-shadow: 0 0 0 3px #ede9fe; }
      `}</style>
    </div>
  )
}
