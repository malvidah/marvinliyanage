'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrynqscwtctqbasivcvb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeW5xc2N3dGN0cWJhc2l2Y3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MDU3MywiZXhwIjoyMDU2MTY2NTczfQ.c2nnOxrj98uIGzAHBFodsEh6VWlWavjgM75WGYBgcYA'
)

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Listings data ────────────────────────────────────────────────────────────
const LISTINGS: Listing[] = [
  {
    id: 'anthem', name: 'Anthem PDX', addr: '1313 E Burnside St · Kerns',
    price: '2BR from $1,953', pn: 'studio–2BR · built 2020 · 211 units',
    type: 'apartment', beds: '2BR', score: 78, status: 'ok', isNew: true,
    rows: [
      { l: 'Natural light', v: 'Big windows throughout', d: 'g' },
      { l: 'Kitchen', v: 'Quartz counters · stainless', d: 'g' },
      { l: 'In-unit W/D', v: 'Yes', d: 'g' },
      { l: 'Flooring', v: 'Wood-look plank (no concrete)', d: 'g' },
      { l: '2BR', v: 'Available', d: 'g' },
      { l: 'AC', v: 'Included in rent', d: 'g' },
      { l: 'Walk / Bike', v: 'Walk 97 · Bike 100', d: 'g' },
      { l: 'Pets', v: 'Yes, breed restrictions', d: 'y' },
      { l: 'Parking', v: 'Unknown — ask', d: 'y' },
    ],
    flags: [{ t: 'Up to 8 weeks free on select units', c: 'fb' }, { t: 'Utilities not included', c: 'fa' }],
    link: 'https://www.anthempdx.com',
    note: "Burnside Corridor — Portland's best eastside food/bar/music strip. Peloton, yoga room, courtyard firepit. Feels more 'corpo' aesthetically but ticks nearly every box.",
  },
  {
    id: 'homma', name: 'HOMMA HAUS Mount Tabor', addr: '5115 E Burnside St · North Tabor',
    price: '$2,995/mo', pn: '2BR/2.5BA · 1,150 sqft · smart home',
    type: 'apartment', beds: '2BR', score: 74, status: 'ok', isNew: true,
    rows: [
      { l: 'Natural light', v: 'Skylight + large windows', d: 'g' },
      { l: 'Kitchen', v: 'Corian counters · gas · dishwasher', d: 'g' },
      { l: 'In-unit W/D', v: 'Full-size upstairs', d: 'g' },
      { l: '2BR', v: 'Yes + 2.5 baths', d: 'g' },
      { l: 'Seismic', v: 'Built 2022 · current code', d: 'g' },
      { l: 'Heating', v: 'Integrated HVAC', d: 'g' },
      { l: 'Pets', v: '2 small dogs/cats ($50/mo)', d: 'y' },
      { l: 'Parking', v: 'Bike storage · no car parking', d: 'y' },
    ],
    flags: [{ t: 'No availability yet — ask for June', c: 'fa' }, { t: 'Above $2k budget', c: 'fa' }],
    link: 'https://www.apartments.com/homma-haus-mount-tabor-smart-home-portland-or/stf0wj6/',
    note: 'Built by Green Hammer (sustainable builders). Near Mt Tabor Park, food carts. Up to 8 weeks free. Currently waitlisted — call for June.',
  },
  {
    id: 'aoe', name: 'Atomic Orchard Experiment', addr: '2510 NE Sandy Blvd · Kerns',
    price: '$1,805–$1,999', pn: '1BR · utilities separate',
    type: 'apartment', beds: '1BR', score: 72, status: 'top', isNew: false,
    rows: [
      { l: 'Natural light', v: 'Floor-to-ceiling windows', d: 'g' },
      { l: 'Kitchen', v: 'Quartz counters · dishwasher', d: 'g' },
      { l: 'In-unit W/D', v: 'Full-size front-load', d: 'g' },
      { l: 'Flooring', v: 'Wood laminate + concrete', d: 'y' },
      { l: '2BR', v: '1BR only currently', d: 'r' },
      { l: 'Seismic', v: 'New build 2025', d: 'g' },
      { l: 'Pets', v: 'Dogs + cats ($300 dep)', d: 'g' },
    ],
    flags: [{ t: "Exposed concrete floors (both: Don't Want)", c: 'fr' }],
    link: 'https://www.apartments.com/atomic-orchard-experiment-portland-or/9bwstf4/',
    note: "#1 pick. Striking loft in Kerns. Verify the concrete floors — shared dealbreaker. Ask if 2BR is coming.",
  },
  {
    id: 'waldorf', name: 'Waldorf Apartments', addr: '833 NE Schuyler St · Irvington',
    price: 'Call for price', pn: 'KBC Mgmt · +$105/mo utilities',
    type: 'apartment', beds: '2BR', score: 68, status: 'ok', isNew: false,
    rows: [
      { l: 'Kitchen', v: 'Retro checkered + built-ins', d: 'y' },
      { l: 'In-unit W/D', v: 'Not listed — confirm', d: 'y' },
      { l: 'Flooring', v: 'Hardwood', d: 'g' },
      { l: '2BR', v: 'Yes', d: 'g' },
      { l: 'Heating / AC', v: 'AC confirmed', d: 'g' },
      { l: 'Pets', v: 'Dogs + cats ($250 dep)', d: 'g' },
    ],
    flags: [{ t: 'Price unknown — call 503-287-6876', c: 'fa' }],
    link: 'https://www.kbcmgmt.com/listings/detail/48b2cfd2-1cd4-45e3-a72a-f1da1f97032f',
    note: 'Best vintage 2BR character on the list. Near NE Broadway. Confirm laundry and price first.',
  },
  {
    id: 'parkview', name: 'Parkview Apartments', addr: "1640 NE Irving St · Sullivan's Gulch",
    price: 'From $1,495', pn: '2BR 950 sqft · National Historic Registry · 1941',
    type: 'apartment', beds: '2BR', score: 64, status: 'ok', isNew: true,
    rows: [
      { l: 'Natural light', v: 'Picture windows · tons of light', d: 'g' },
      { l: 'Kitchen', v: 'Unknown — ask', d: 'y' },
      { l: 'In-unit W/D', v: 'No — basement shared', d: 'r' },
      { l: 'Flooring', v: 'Beautiful hardwood', d: 'g' },
      { l: '2BR', v: 'Yes · 950 sqft', d: 'g' },
      { l: 'Heating', v: 'Steam heat (vintage)', d: 'y' },
      { l: 'Storage', v: '5×7 basement unit included', d: 'g' },
      { l: 'Courtyard', v: '5-acre garden courtyard', d: 'g' },
    ],
    flags: [{ t: 'No in-unit laundry (basement shared)', c: 'fr' }, { t: 'Steam heat — ask about drafts', c: 'fa' }],
    link: 'https://www.apartments.com/parkview-apartments-portland-or/sb2rbt6/',
    note: 'Gorgeous historic property with garden courtyard and hardwood floors. Best-priced 2BR on the list. Shared laundry is the main drawback.',
  },
  {
    id: 'kailash', name: 'Kailash Ecovillage', addr: 'SE Portland · Creston-Kenilworth',
    price: 'Waitlist', pn: '1–2BR · rental model',
    type: 'cohousing', beds: '1–2BR', score: 62, status: 'ok', isNew: true,
    rows: [
      { l: 'Community', v: 'Solar intentional community', d: 'g' },
      { l: 'Shared spaces', v: 'Community room · treehouse · gardens', d: 'g' },
      { l: 'In-unit W/D', v: 'Building laundry room', d: 'y' },
      { l: '2BR', v: 'Some units available', d: 'y' },
      { l: 'Eco values', v: 'Solar · composting · car share', d: 'g' },
      { l: 'Location', v: 'SE Portland inner city', d: 'g' },
    ],
    flags: [{ t: 'Waitlist — contact ASAP for June', c: 'fa' }, { t: 'No guaranteed availability', c: 'fa' }],
    link: 'https://www.kailashecovillage.org/housing',
    note: 'Best cohousing fit for science/left/creative values. Rental model — no ownership needed. Contact immediately at kailashecovillage.org/contact.',
  },
  {
    id: 'belmont', name: '2121 Belmont', addr: '2121 SE Belmont St · Buckman',
    price: 'From $1,977', pn: '2BR ~$2,500–$3,600',
    type: 'apartment', beds: '1–2BR', score: 61, status: 'ok', isNew: false,
    rows: [
      { l: 'Natural light', v: 'Open-concept, glowing', d: 'g' },
      { l: 'Kitchen', v: 'Condo-grade finishes', d: 'g' },
      { l: 'In-unit W/D', v: 'Likely (condo build)', d: 'y' },
      { l: '2BR', v: 'Available (pricey)', d: 'y' },
      { l: 'Seismic', v: 'Built 2008', d: 'g' },
      { l: 'Parking', v: 'Underground garage', d: 'g' },
    ],
    flags: [{ t: 'Up to 6 weeks free running now', c: 'fb' }],
    link: 'https://www.2121belmontapts.com/',
    note: 'Condo-grade Buckman build. Use the free weeks to offset 2BR cost.',
  },
  {
    id: 'yamhill', name: '2026 SE Yamhill St Unit A', addr: 'SE Yamhill · Buckman',
    price: '~$2,199 est', pn: '2BR/1BA · 1,210 sqft · Zillow est',
    type: 'apartment', beds: '2BR', score: 58, status: 'ok', isNew: true,
    rows: [
      { l: 'Natural light', v: 'Big front window', d: 'g' },
      { l: 'Kitchen', v: 'Gas range · dishwasher', d: 'g' },
      { l: 'In-unit W/D', v: 'Not included', d: 'r' },
      { l: '2BR', v: 'Yes + attached garage', d: 'g' },
      { l: 'Utilities', v: 'Water/sewer/garbage incl', d: 'g' },
    ],
    flags: [{ t: 'Not confirmed available — verify', c: 'fa' }, { t: 'Linoleum floors (shared Don\'t Want)', c: 'fr' }],
    link: 'https://www.zillow.com/homedetails/2026-SE-Yamhill-St-APT-A-Portland-OR-97214/2069064308_zpid/',
    note: 'Zillow historical listing — not confirmed live. Buckman, attached garage great for camping gear.',
  },
  {
    id: 'alberta', name: 'Intentional Community — Alberta Arts', addr: 'Alberta Arts / Sabin · NE Portland',
    price: '$825/mo', pn: 'Room in shared house · Craigslist',
    type: 'cohousing', beds: 'Room share', score: 55, status: 'ok', isNew: true,
    rows: [
      { l: 'Community', v: 'Intentional community listing', d: 'g' },
      { l: 'Location', v: 'Alberta Arts — very cool area', d: 'g' },
      { l: 'Price', v: '$825/mo — very affordable', d: 'g' },
      { l: 'Private space', v: 'Single room, shared home', d: 'y' },
      { l: '2BR', v: 'No — shared household', d: 'r' },
    ],
    flags: [{ t: 'Room share only', c: 'fb' }, { t: 'CL listing — check soon', c: 'fa' }],
    link: 'https://portland.craigslist.org/search/roo',
    note: 'Search "intentional community Alberta" in PDX Craigslist rooms & shares. Great short-term landing spot.',
  },
  {
    id: 'cascadia', name: 'Cascadia Commons', addr: 'SW Portland · Raleigh Hills (97225)',
    price: '$1,800/mo', pn: '1BR 675 sqft · water/sewer/HOA incl',
    type: 'cohousing', beds: '1BR', score: 58, status: 'ok', isNew: true,
    rows: [
      { l: 'Natural light', v: "Vaulted 12' ceilings", d: 'g' },
      { l: 'In-unit W/D', v: 'Yes', d: 'g' },
      { l: '2BR', v: '1BR only available', d: 'r' },
      { l: 'Community', v: '26 households since 1999', d: 'g' },
      { l: 'Shared spaces', v: 'Dining hall · workshop · gardens', d: 'g' },
    ],
    flags: [{ t: 'SW Portland — less inner-city vibe', c: 'fa' }, { t: 'Monthly work parties required', c: 'fb' }],
    link: 'https://cascadiacommons.com/units-for-sale-or-rent/',
    note: 'Available now at $1,800/mo all-in. Contact: JwhateverG@gmail.com · 503-512-0662',
  },
  {
    id: 'silver', name: 'Silver Court (KBC)', addr: '2170 NE Hancock St · Irvington',
    price: 'Call for price', pn: '+$85/mo utilities',
    type: 'apartment', beds: '1BR', score: 52, status: 'ok', isNew: false,
    rows: [
      { l: 'Flooring', v: 'Hardwood', d: 'g' },
      { l: '2BR', v: '1BR only', d: 'r' },
      { l: 'Pets', v: 'Cats only — no dogs', d: 'r' },
    ],
    flags: [{ t: 'No dogs', c: 'fr' }, { t: '1BR only', c: 'fr' }],
    link: 'https://www.kbcmgmt.com/listings/detail/2168d557-94a3-42bc-8f1b-c28146d586aa',
    note: 'Elegant 1920s Irvington. Cats-only and 1BR are likely dealbreakers.',
  },
  {
    id: 'granada', name: 'Granada Court (Bristol Urban)', addr: '932 NE Pacific St · Hollywood/Kerns',
    price: 'Call for price', pn: '+$95/mo utilities',
    type: 'apartment', beds: 'Unknown', score: 48, status: 'ok', isNew: false,
    rows: [
      { l: 'In-unit W/D', v: 'Building shared only', d: 'r' },
      { l: 'Seismic', v: '1926 — ask about retrofit', d: 'y' },
      { l: 'Pets', v: 'Dogs + cats, no pet rent', d: 'g' },
    ],
    flags: [{ t: 'No in-unit laundry', c: 'fr' }, { t: '1926 building', c: 'fa' }],
    link: 'https://www.bristolurban.com/listings/detail/bf220ceb-8085-4a54-8c85-47508f50ec10',
    note: 'Charming courtyard. No in-unit laundry is a high-priority miss. Lower priority.',
  },
]

const LISTINGMAP = Object.fromEntries(LISTINGS.map(l => [l.id, l]))

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'apartment', label: 'Apartments' },
  { key: 'cohousing', label: 'Cohousing' },
  { key: '2br', label: 'Has 2BR' },
  { key: 'inunit', label: 'In-unit W/D' },
  { key: 'new', label: 'New finds' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  return s >= 70 ? '#1D6B3A' : s >= 55 ? '#B85C00' : '#B02020'
}

function dotClass(d: string) {
  return { g: 'bg-emerald-600', y: 'bg-amber-500', r: 'bg-red-600', _: 'bg-neutral-300' }[d] ?? 'bg-neutral-300'
}

function flagClass(c: string) {
  return {
    fr: 'bg-red-50 text-red-700 border border-red-100',
    fa: 'bg-amber-50 text-amber-700 border border-amber-100',
    fb: 'bg-blue-50 text-blue-700 border border-blue-100',
  }[c] ?? 'bg-neutral-100 text-neutral-600'
}

// ─── Card component ────────────────────────────────────────────────────────────
function ApartmentCard({
  listing, isFav, note, onToggleFav, onNoteChange, rank,
}: {
  listing: Listing
  isFav: boolean
  note: string
  onToggleFav: (id: string) => void
  onNoteChange: (id: string, val: string) => void
  rank?: number
}) {
  const [flipped, setFlipped] = useState(false)
  const [localNote, setLocalNote] = useState(note)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync incoming note when it changes externally
  useEffect(() => {
    if (!flipped) setLocalNote(note)
  }, [note, flipped])

  function handleNoteChange(val: string) {
    setLocalNote(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onNoteChange(listing.id, val), 800)
  }

  const borderClass = listing.status === 'top'
    ? 'border-emerald-500 border-2'
    : listing.type === 'cohousing'
    ? 'border-violet-500 border-2'
    : 'border-neutral-200'

  return (
    <div className="relative" style={{ perspective: 1000, height: 'auto' }}>
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: flipped ? 320 : undefined,
        }}
      >
        {/* ── FRONT ── */}
        <div
          className={`bg-white rounded-2xl ${borderClass} shadow-sm p-5 flex flex-col gap-0 backface-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {listing.status === 'top' && (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">★ top pick</span>
            )}
            {listing.isNew && (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">new</span>
            )}
            {listing.type === 'cohousing' && (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">cohousing</span>
            )}
            {(listing.beds === '2BR' || listing.beds.includes('2BR')) ? (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{listing.beds}</span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{listing.beds}</span>
            )}
            {rank !== undefined && (
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">#{rank} fav</span>
            )}
          </div>

          {/* Name + addr */}
          <div className="font-serif text-[17px] leading-snug mb-0.5">{listing.name}</div>
          <div className="font-mono text-[10px] text-neutral-400 mb-3 tracking-wide">{listing.addr}</div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-3 flex-wrap">
            <span className="font-serif text-[19px]">{listing.price}</span>
            {listing.pn && <span className="text-[11px] text-neutral-400">· {listing.pn}</span>}
          </div>

          {/* Score bar */}
          {listing.score > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 w-12 shrink-0">Fit</span>
              <div className="flex-1 h-[3px] bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${listing.score}%`, background: scoreColor(listing.score) }} />
              </div>
              <span className="font-mono text-[11px] font-medium w-5 text-right" style={{ color: scoreColor(listing.score) }}>{listing.score}</span>
            </div>
          )}

          <hr className="border-neutral-100 mb-2.5" />

          {/* Rows */}
          <div className="flex flex-col gap-0.5 mb-2.5">
            {listing.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-[3px]">
                <span className="text-[11px] text-neutral-400 shrink-0 min-w-[84px]">{r.l}</span>
                <span className="text-[11px] font-medium text-neutral-800 text-right flex-1">{r.v}</span>
                <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${dotClass(r.d)}`} />
              </div>
            ))}
          </div>

          {/* Flags */}
          {listing.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {listing.flags.map((f, i) => (
                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${flagClass(f.c)}`}>{f.t}</span>
              ))}
            </div>
          )}

          {/* Note indicator */}
          {note && (
            <div className="text-[10px] text-violet-600 font-mono mb-1.5 flex items-center gap-1">
              <span>✏</span> has notes — flip to read
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-neutral-100">
            <a
              href={listing.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-emerald-700 hover:underline tracking-wide"
            >
              View listing →
            </a>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlipped(true)}
                className="font-mono text-[10px] text-neutral-400 hover:text-violet-600 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50"
                title="Leave a note"
              >
                ✏ note
              </button>
              <button
                onClick={() => onToggleFav(listing.id)}
                className={`text-lg transition-transform hover:scale-110 ${isFav ? 'text-yellow-400' : 'text-neutral-200 hover:text-yellow-300'}`}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                ★
              </button>
            </div>
          </div>
        </div>

        {/* ── BACK (notes) ── */}
        <div
          className={`absolute inset-0 bg-white rounded-2xl ${borderClass} shadow-sm p-5 flex flex-col`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-serif text-[15px] leading-snug mb-0.5">{listing.name}</div>
              <div className="font-mono text-[10px] text-neutral-400 tracking-wide">{listing.addr}</div>
            </div>
            <button
              onClick={() => setFlipped(false)}
              className="text-neutral-400 hover:text-neutral-700 text-xl leading-none ml-3 shrink-0"
              title="Back to details"
            >
              ←
            </button>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-1.5">Your notes (synced)</div>
          <textarea
            className="flex-1 text-[13px] text-neutral-700 bg-neutral-50 rounded-xl border border-neutral-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 placeholder:text-neutral-300 min-h-[160px]"
            placeholder="Leave a note for each other… pros, cons, questions to ask, gut feelings…"
            value={localNote}
            onChange={e => handleNoteChange(e.target.value)}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono text-[9px] text-neutral-400">auto-saves · visible to both of you</span>
            <button
              onClick={() => setFlipped(false)}
              className="font-mono text-[10px] text-emerald-700 hover:underline"
            >
              done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Draggable favorites list ─────────────────────────────────────────────────
function FavoritesList({
  ids,
  notes,
  onReorder,
  onRemove,
}: {
  ids: string[]
  notes: Record<string, string>
  onReorder: (newIds: string[]) => void
  onRemove: (id: string) => void
}) {
  const dragIdx = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)

  if (ids.length === 0) return null

  const listings = ids.map(id => LISTINGMAP[id]).filter(Boolean)

  function onDragStart(i: number) {
    dragIdx.current = i
    setDragging(i)
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setOver(i)
  }

  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return
    const next = [...ids]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    onReorder(next)
    dragIdx.current = null
    setDragging(null)
    setOver(null)
  }

  function onDragEnd() {
    setDragging(null)
    setOver(null)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">Favorites</span>
        <span className="font-mono text-[10px] text-neutral-300">— drag to reorder</span>
      </div>
      <div className="flex flex-col gap-2">
        {listings.map((l, i) => {
          const isOver = over === i && dragging !== i
          return (
            <div
              key={l.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={() => onDrop(i)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all
                ${dragging === i ? 'opacity-40 scale-95' : 'opacity-100'}
                ${isOver ? 'border-violet-300 bg-violet-50 shadow-md' : 'border-neutral-200 bg-white hover:border-neutral-300'}
              `}
            >
              <span className="font-mono text-[11px] font-medium text-neutral-300 w-5 shrink-0 select-none">#{i + 1}</span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="font-serif text-[14px] truncate">{l.name}</span>
                <span className="font-mono text-[10px] text-neutral-400 shrink-0">· {l.price}</span>
              </div>
              {notes[l.id] && (
                <span className="font-mono text-[10px] text-violet-500 shrink-0">✏ noted</span>
              )}
              <span className="font-mono text-[10px] text-neutral-300 hover:text-red-400 cursor-pointer shrink-0 transition-colors select-none" onClick={() => onRemove(l.id)}>✕</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApartmentsPage() {
  const [filter, setFilter] = useState('all')
  const [state, setState] = useState<SharedState>({ favorites: [], notes: {}, favoriteOrder: [] })
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from Supabase on mount
  useEffect(() => {
    loadState()
    const interval = setInterval(loadState, 8000) // poll every 8s
    return () => clearInterval(interval)
  }, [])

  async function loadState() {
    const { data, error } = await supabase
      .from('apartment_state')
      .select('data')
      .eq('key', 'shared')
      .single()
    if (!error && data?.data) {
      setState(data.data as SharedState)
      setLastSynced(new Date())
    }
  }

  const persistState = useCallback((next: SharedState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      await supabase
        .from('apartment_state')
        .upsert({ key: 'shared', data: next, updated_at: new Date().toISOString() })
      setSyncing(false)
      setLastSynced(new Date())
    }, 600)
  }, [])

  function toggleFav(id: string) {
    setState(prev => {
      const isFav = prev.favorites.includes(id)
      const nextFavs = isFav ? prev.favorites.filter(f => f !== id) : [...prev.favorites, id]
      const nextOrder = isFav ? prev.favoriteOrder.filter(f => f !== id) : [...prev.favoriteOrder, id]
      const next = { ...prev, favorites: nextFavs, favoriteOrder: nextOrder }
      persistState(next)
      return next
    })
  }

  function updateNote(id: string, val: string) {
    setState(prev => {
      const next = { ...prev, notes: { ...prev.notes, [id]: val } }
      persistState(next)
      return next
    })
  }

  function reorderFavs(newOrder: string[]) {
    setState(prev => {
      const next = { ...prev, favoriteOrder: newOrder, favorites: newOrder }
      persistState(next)
      return next
    })
  }

  function removeFav(id: string) {
    toggleFav(id)
  }

  const filtered = LISTINGS.filter(l => {
    if (filter === 'all') return true
    if (filter === 'apartment') return l.type === 'apartment'
    if (filter === 'cohousing') return l.type === 'cohousing'
    if (filter === 'new') return l.isNew
    if (filter === '2br') return l.beds.includes('2BR')
    if (filter === 'inunit') return l.rows.some(r => r.l === 'In-unit W/D' && r.d === 'g')
    return true
  })

  const scored = filtered.filter(l => l.score > 0)
  const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0
  const favOrder = state.favoriteOrder.length > 0 ? state.favoriteOrder : state.favorites

  return (
    <div className="min-h-screen" style={{ background: '#F5F2ED', fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100 px-6 py-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Portland Move · June 2026</div>
          <h1 className="text-[22px] leading-snug" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
            Marvin & Reese&rsquo;s <em className="italic text-emerald-700">Housing Shortlist</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setFilter(o.key)}
              className={`font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all
                ${filter === o.key
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-300 text-neutral-500 hover:bg-neutral-50'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="px-6 py-3 bg-[#F5F2ED] border-b border-neutral-200 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[19px]" style={{ fontFamily: "'DM Serif Display', serif" }}>{filtered.length}</span>
          <span className="text-[12px] text-neutral-500">listings</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[19px]" style={{ fontFamily: "'DM Serif Display', serif" }}>{avgScore || '—'}</span>
          <span className="text-[12px] text-neutral-500">avg fit score</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[19px]" style={{ fontFamily: "'DM Serif Display', serif" }}>{filtered.filter(l => l.beds.includes('2BR')).length}</span>
          <span className="text-[12px] text-neutral-500">have 2BR</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[19px]" style={{ fontFamily: "'DM Serif Display', serif" }}>{state.favorites.length}</span>
          <span className="text-[12px] text-neutral-500">favorited</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {syncing && <span className="font-mono text-[10px] text-violet-500 animate-pulse">saving…</span>}
          {!syncing && lastSynced && (
            <span className="font-mono text-[10px] text-neutral-400">
              synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'}`} />
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-neutral-400">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" /> confirmed</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> ask/likely</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" /> dealbreaker</span>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* ── Favorites list ── */}
        <FavoritesList
          ids={favOrder}
          notes={state.notes}
          onReorder={reorderFavs}
          onRemove={removeFav}
        />

        {/* ── Card grid ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(296px, 1fr))' }}>
          {filtered.map((l, i) => {
            const favRank = favOrder.indexOf(l.id)
            return (
              <div
                key={l.id}
                style={{ animationDelay: `${i * 30}ms`, animation: 'fadeUp 0.25s ease both' }}
              >
                <ApartmentCard
                  listing={l}
                  isFav={state.favorites.includes(l.id)}
                  note={state.notes[l.id] || ''}
                  onToggleFav={toggleFav}
                  onNoteChange={updateNote}
                  rank={favRank >= 0 ? favRank + 1 : undefined}
                />
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  )
}
