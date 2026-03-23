'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrynqscwtctqbasivcvb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeW5xc2N3dGN0cWJhc2l2Y3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MDU3MywiZXhwIjoyMDU2MTY2NTczfQ.c2nnOxrj98uIGzAHBFodsEh6VWlWavjgM75WGYBgcYA'
)

// ── Types ──────────────────────────────────────────────────────────────────────
interface Row { l: string; v: string; d: 'g' | 'y' | 'r' | '_' }
interface Flag { t: string; c: 'fr' | 'fa' | 'fb' }
interface Mgmt { name?: string; phone?: string; email?: string; hours?: string }
interface Listing {
  id: string; name: string; addr: string; price: string; pn: string
  type: 'apartment' | 'cohousing'; beds: string; score: number
  status: 'top' | 'ok' | 'dead'; isNew: boolean; isCustom?: boolean
  rows: Row[]; flags: Flag[]; link: string; note: string
  gradient: string; lat: number; lng: number; mgmt?: Mgmt
}
interface ContactEntry { status: 'none' | 'out' | 'scheduled' | 'toured'; date?: string }
interface SharedState {
  favorites: string[]; notes: Record<string, string>
  favoriteOrder: string[]; archived: string[]
  photos: Record<string, string>; contacts: Record<string, ContactEntry>
  customListings: Listing[]
}

// ── Image compression ──────────────────────────────────────────────────────────
async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 700
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * r); height = Math.round(height * r)
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.65))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ── Seed Listings ──────────────────────────────────────────────────────────────
const SEED: Listing[] = [
  { id:'anthem', name:'Anthem PDX', addr:'1313 E Burnside · Kerns', price:'From $1,953', pn:'studio–2BR · built 2020', type:'apartment', beds:'2BR', score:78, status:'ok', isNew:true, lat:45.5236, lng:-122.6545, gradient:'linear-gradient(135deg,#1a1a2e,#0f3460)',
    rows:[{l:'Natural light',v:'Big windows',d:'g'},{l:'Kitchen',v:'Quartz + stainless',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Flooring',v:'Wood-look plank',d:'g'},{l:'2BR',v:'Available',d:'g'},{l:'AC',v:'In rent',d:'g'},{l:'Walk/Bike',v:'97/100',d:'g'},{l:'Pets',v:'Yes, breed restrictions',d:'y'}],
    flags:[{t:'Up to 8 weeks free',c:'fb'},{t:'Utilities not included',c:'fa'}], link:'https://www.anthempdx.com',
    note:"Burnside Corridor — Portland's best eastside strip. Peloton, yoga room, courtyard firepit.", mgmt:{name:'Avenue5 Residential',phone:'(971) 254-4598',email:'anthem@avenue5apt.com',hours:'M–F 10–6 · Sat–Sun 10–5'} },
  { id:'homma', name:'HOMMA HAUS Mt Tabor', addr:'5115 E Burnside · N Tabor', price:'$2,995/mo', pn:'2BR/2.5BA · 1,150 sqft · smart home', type:'apartment', beds:'2BR', score:74, status:'ok', isNew:true, lat:45.5232, lng:-122.6044, gradient:'linear-gradient(135deg,#2d1b69,#11998e)',
    rows:[{l:'Natural light',v:'Skylight + large windows',d:'g'},{l:'Kitchen',v:'Corian · gas · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size upstairs',d:'g'},{l:'2BR',v:'Yes + 2.5 baths',d:'g'},{l:'Seismic',v:'Built 2022',d:'g'},{l:'Pets',v:'2 small ($50/mo)',d:'y'}],
    flags:[{t:'No availability yet — ask for June',c:'fa'},{t:'Above $2k budget',c:'fa'}], link:'https://www.apartments.com/homma-haus-mount-tabor-smart-home-portland-or/stf0wj6/',
    note:'Smart home townhomes by Green Hammer. Near Mt Tabor Park.', mgmt:{name:'Edge Asset Management',phone:'(503) 926-8021',hours:'By appointment'} },
  { id:'aoe', name:'Atomic Orchard Experiment', addr:'2510 NE Sandy · Kerns', price:'$1,805–$1,999', pn:'1BR · utilities separate', type:'apartment', beds:'1BR', score:72, status:'ok', isNew:false, lat:45.5317, lng:-122.6388, gradient:'linear-gradient(135deg,#f093fb,#f5576c,#fda085)',
    rows:[{l:'Layout',v:'Split-level loft · stairs',d:'g'},{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size front-load',d:'g'},{l:'Flooring',v:'Wood laminate + concrete',d:'y'},{l:'2BR',v:'1BR only',d:'y'},{l:'Pets',v:'Dogs + cats ($300)',d:'g'}],
    flags:[{t:'Confirmed split-level layout',c:'fb'},{t:'Was in foreclosure — new mgmt ~Feb 2026',c:'fr'},{t:'Street parking only · breakins reported',c:'fr'}], link:'https://www.apartments.com/atomic-orchard-experiment-portland-or/9bwstf4/',
    note:'Best loft layout in Portland. New mgmt Feb 2026. Street parking only — leave nothing visible.', mgmt:{name:'New mgmt ~Feb 2026',phone:'Call building directly',hours:'Verify first'} },
  { id:'everettstlofts', name:'Everett Street Lofts', addr:'2821 NE Everett · Kerns', price:'$1,225–$1,450', pn:'Studio–1BR · in-unit W/D · built 2016', type:'apartment', beds:'1BR', score:78, status:'ok', isNew:true, lat:45.5266, lng:-122.6355, gradient:'linear-gradient(135deg,#373b44,#4286f4)',
    rows:[{l:'Layout',v:'Split-level units available',d:'g'},{l:'Natural light',v:'Energy-efficient windows',d:'g'},{l:'Kitchen',v:'Quartz · stainless',d:'g'},{l:'In-unit W/D',v:'Yes · full-size',d:'g'},{l:'Flooring',v:'Hardwood-style',d:'g'},{l:'2BR',v:'Studio + 1BR only',d:'y'},{l:'Pets',v:'Yes · dog wash',d:'g'}],
    flags:[{t:'Split-level confirmed per Reddit',c:'fb'},{t:'No 2BR',c:'fb'}], link:'https://www.portland-apartment-living.com/communities/everett-street-lofts/',
    note:'Same neighborhood as AOE, split-level confirmed. Great price, in-unit W/D, hardwood floors.', mgmt:{name:'Portland Apartment Living',phone:'(503) 726-7220 ext 1'} },
  { id:'moderabelmont', name:'Modera Belmont', addr:'685 SE Belmont · Buckman', price:'From $1,480', pn:'Studio–2BR · 457–1,230 sqft · 2018', type:'apartment', beds:'2BR', score:76, status:'ok', isNew:true, lat:45.5155, lng:-122.6500, gradient:'linear-gradient(135deg,#ff6b6b,#feca57)',
    rows:[{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz · eco floors',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'Up to 1,230 sqft',d:'g'},{l:'Rooftop',v:'Mt Hood + river views',d:'g'},{l:'Pets',v:'Yes · pet spa',d:'g'}],
    flags:[{t:'Price drops seen recently',c:'fb'}], link:'https://www.moderabelmont.com/',
    note:'Floor-to-ceiling windows, rooftop deck with Mt Hood views. Very well-reviewed management.', mgmt:{name:'Mill Creek Residential',hours:'M–F 10–6 · Sat 10–5 · moderabelmont.com'} },
  { id:'waldorf', name:'Waldorf Apartments', addr:'833 NE Schuyler · Irvington', price:'Call for price', pn:'KBC Mgmt · +$105/mo utilities', type:'apartment', beds:'2BR', score:68, status:'ok', isNew:false, lat:45.5381, lng:-122.6471, gradient:'linear-gradient(135deg,#667eea,#764ba2)',
    rows:[{l:'Kitchen',v:'Retro checkered',d:'y'},{l:'In-unit W/D',v:'Confirm',d:'y'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'Yes',d:'g'},{l:'AC',v:'Confirmed',d:'g'},{l:'Pets',v:'Dogs + cats',d:'g'}],
    flags:[{t:'Call to get price',c:'fa'}], link:'https://www.kbcmgmt.com/listings/detail/48b2cfd2-1cd4-45e3-a72a-f1da1f97032f',
    note:'Best vintage 2BR character on the list. Near NE Broadway. Confirm laundry + price first.', mgmt:{name:'KBC Management',phone:'(503) 287-6876',hours:'M–F business hours'} },
  { id:'anthem2', name:'Cook Street', addr:'107 N Cook · Williams District', price:'From $1,335', pn:'Studio–2BR · 490–983 sqft · 2016', type:'apartment', beds:'2BR', score:71, status:'ok', isNew:true, lat:45.545, lng:-122.67, gradient:'linear-gradient(135deg,#0f2027,#2c5364)',
    rows:[{l:'Natural light',v:'Picture windows',d:'g'},{l:'Kitchen',v:'Luxury finishes',d:'y'},{l:'In-unit W/D',v:'Confirm',d:'y'},{l:'2BR',v:'Up to 983 sqft',d:'g'},{l:'Eco',v:'Natural NW materials',d:'g'},{l:'Pets',v:'No weight limit',d:'g'}],
    flags:[{t:'Confirm in-unit W/D',c:'fa'}], link:'https://cookstreetportland.com/',
    note:'Williams District — one block from Mississippi. Picture windows, eco-build, no pet weight limit.', mgmt:{name:'Cook Street Leasing',hours:'cookstreetportland.com'} },
  { id:'buckmancourt', name:'Buckman Court', addr:'1955 SE Morrison · Buckman', price:'$1,250–$1,395', pn:'Studio–2BR + 6 townhomes · 1970', type:'apartment', beds:'2BR', score:71, status:'ok', isNew:true, lat:45.5188, lng:-122.6452, gradient:'linear-gradient(135deg,#5C258D,#4389A2)',
    rows:[{l:'Layout',v:'6 two-story townhomes',d:'g'},{l:'In-unit W/D',v:'No — shared',d:'r'},{l:'2BR',v:'Yes',d:'g'},{l:'Pets',v:'No pets',d:'r'},{l:'Price',v:'Best-value 2BR',d:'g'}],
    flags:[{t:'Ask for townhome units specifically',c:'fb'},{t:'No pets',c:'fr'},{t:'No in-unit laundry',c:'fr'}], link:'https://www.portland-apartment-living.com/communities/buckman-court/',
    note:'6 two-story townhomes likely have split-level layout. Best 2BR price. No pets + shared laundry.', mgmt:{name:'Portland Apartment Living',phone:'(503) 726-7220 ext 1'} },
  { id:'asalofts', name:'ASA Flats + Lofts', addr:'1200 NW Marshall · Pearl District', price:'$1,346–$2,853', pn:'Studio–2BR · 15+ split-level units', type:'apartment', beds:'2BR', score:70, status:'ok', isNew:true, lat:45.5289, lng:-122.6832, gradient:'linear-gradient(135deg,#232526,#414345)',
    rows:[{l:'Layout',v:'15–20 split-level units',d:'g'},{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz · stainless',d:'g'},{l:'2BR',v:'Yes · up to $2,853',d:'g'},{l:'Rooftop',v:'16th floor · fire pit',d:'g'},{l:'Pets',v:'Yes · 75lb max',d:'g'}],
    flags:[{t:'15–20 split-level units per Reddit',c:'fb'},{t:'Pearl District — higher price',c:'fa'}], link:'https://www.liveatasa.com/asa-flats-lofts-portland-or/',
    note:'Largest loft-unit inventory in Portland per Reddit. Ask specifically for mezzanine floorplans.', mgmt:{name:'ASA Flats Leasing',phone:'(503) 755-9217',hours:'M–F 9:30–6 · Sat 9–6 · Sun 11–4'} },
  { id:'park19', name:'Park 19', addr:'550 NW 19th · Alphabet District', price:'2BR from $2,512', pn:'Studio–2BR · 529–1,168 sqft', type:'apartment', beds:'2BR', score:65, status:'ok', isNew:true, lat:45.5270, lng:-122.6928, gradient:'linear-gradient(135deg,#2c3e50,#3498db)',
    rows:[{l:'Natural light',v:'Large windows · park views',d:'g'},{l:'In-unit W/D',v:'Confirm',d:'y'},{l:'2BR',v:'From $2,512',d:'y'},{l:'Management',v:'Greystar · excellent',d:'g'},{l:'Walk',v:'Couch + Washington Park',d:'g'}],
    flags:[{t:'2BR above $2k',c:'fa'},{t:'NW Portland — not eastside',c:'fb'}], link:'https://www.livepark19.com/',
    note:'Residents stay for years. Couch Park views, walkable to Forest Park (80+ miles trails).', mgmt:{name:'Greystar',hours:'livepark19.com'} },
  { id:'revere', name:'Revere', addr:'3309 N Mississippi · Boise', price:'$1,356–$2,464+', pn:'Studio–2BR · 570–1,097 sqft · 2019', type:'apartment', beds:'2BR', score:67, status:'ok', isNew:true, lat:45.5476, lng:-122.6741, gradient:'linear-gradient(135deg,#1a1a2e,#0f3460)',
    rows:[{l:'Layout',v:'Ground-floor split-level 1BR',d:'g'},{l:'Kitchen',v:'Stainless · gas stove',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Amenities',v:'Bouldering wall · sauna',d:'g'},{l:'Pets',v:'Yes · no weight limit',d:'g'}],
    flags:[{t:'Split-level units are ground floor only',c:'fb'},{t:'Car break-ins — street parking',c:'fr'}], link:'https://www.reverepdx.com/',
    note:'Mississippi Ave — best N Portland strip. Bouldering wall on-site. Ground-floor split-level 1BRs only.', mgmt:{name:'Avenue5 Residential',phone:'(503) 227-2787',email:'revere@avenue5apt.com',hours:'M–F 9–6 · Sat 10–5'} },
  { id:'parkview', name:'Parkview Apartments', addr:"1640 NE Irving · Sullivan's Gulch", price:'From $1,495', pn:"2BR 950sqft · Historic Registry · 1941", type:'apartment', beds:'2BR', score:64, status:'ok', isNew:true, lat:45.5289, lng:-122.6567, gradient:'linear-gradient(135deg,#4ecdc4,#093637)',
    rows:[{l:'Natural light',v:'Picture windows',d:'g'},{l:'In-unit W/D',v:'No — basement',d:'r'},{l:'Flooring',v:'Beautiful hardwood',d:'g'},{l:'2BR',v:'950 sqft',d:'g'},{l:'Courtyard',v:'5-acre garden',d:'g'}],
    flags:[{t:'No in-unit laundry',c:'fr'},{t:'Steam heat — ask about drafts',c:'fa'}], link:'https://www.apartments.com/parkview-apartments-portland-or/sb2rbt6/',
    note:'Gorgeous historic property with garden courtyard. Best-priced 2BR on list. Shared laundry only.', mgmt:{name:'See listing for contact',hours:'apartments.com listing'} },
  { id:'fortyone11', name:'Forty One 11', addr:'4111 NE MLK · Alberta/King', price:'From $1,199', pn:'Studio–2BR · 394–931 sqft · 2019', type:'apartment', beds:'2BR', score:62, status:'ok', isNew:true, lat:45.556, lng:-122.664, gradient:'linear-gradient(135deg,#833ab4,#fcb045)',
    rows:[{l:'Natural light',v:'Unknown — ask',d:'y'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'Unknown — ask',d:'y'},{l:'2BR',v:'Up to 931 sqft',d:'g'},{l:'Price',v:'Very affordable',d:'g'}],
    flags:[{t:'Many details unknown — call to confirm',c:'fa'}], link:'https://www.fortyone11pdx.com/',
    note:'Alberta Arts / King — one of the coolest areas. Very competitive price for 2BR. Worth a call.', mgmt:{name:'Forty One 11 Leasing',hours:'fortyone11pdx.com'} },
  { id:'kailash', name:'Kailash Ecovillage', addr:'SE Portland · Creston-Kenilworth', price:'Waitlist', pn:'1–2BR · rental model', type:'cohousing', beds:'1–2BR', score:62, status:'ok', isNew:true, lat:45.493, lng:-122.63, gradient:'linear-gradient(135deg,#56ab2f,#a8e063)',
    rows:[{l:'Community',v:'Solar intentional',d:'g'},{l:'Shared spaces',v:'Treehouse · gardens',d:'g'},{l:'In-unit W/D',v:'Building laundry',d:'y'},{l:'2BR',v:'Some units',d:'y'},{l:'Eco',v:'Solar · composting',d:'g'}],
    flags:[{t:'Waitlist — contact ASAP for June',c:'fa'}], link:'https://www.kailashecovillage.org/housing',
    note:'Best cohousing fit for your values. Rental model — no ownership needed.', mgmt:{name:'Kailash Ecovillage',hours:'kailashecovillage.org/contact'} },
  { id:'cascadia', name:'Cascadia Commons', addr:'SW Portland · Raleigh Hills', price:'$1,800/mo', pn:'1BR 675sqft · water/sewer/HOA incl', type:'cohousing', beds:'1BR', score:58, status:'ok', isNew:true, lat:45.4896, lng:-122.78, gradient:'linear-gradient(135deg,#1d976c,#93f9b9)',
    rows:[{l:'Natural light',v:"Vaulted 12' ceilings",d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Community',v:'26 households since 1999',d:'g'},{l:'Shared spaces',v:'Dining hall · workshop',d:'g'}],
    flags:[{t:'SW Portland — less inner-city',c:'fa'},{t:'Monthly work parties required',c:'fb'}], link:'https://cascadiacommons.com/units-for-sale-or-rent/',
    note:'Available now $1,800/mo all-in.', mgmt:{name:'Cascadia Commons',phone:'(503) 512-0662',email:'JwhateverG@gmail.com'} },
  { id:'belmont21', name:'2121 Belmont', addr:'2121 SE Belmont · Buckman', price:'From $1,977', pn:'2BR ~$2,500–$3,600', type:'apartment', beds:'1–2BR', score:61, status:'ok', isNew:false, lat:45.5162, lng:-122.643, gradient:'linear-gradient(135deg,#fc4a1a,#f7b733)',
    rows:[{l:'Natural light',v:'Open-concept, glowing',d:'g'},{l:'Kitchen',v:'Condo-grade finishes',d:'g'},{l:'In-unit W/D',v:'Likely',d:'y'},{l:'2BR',v:'Available (pricey)',d:'y'},{l:'Parking',v:'Underground garage',d:'g'}],
    flags:[{t:'Up to 6 weeks free',c:'fb'}], link:'https://www.2121belmontapts.com/',
    note:'Condo-grade Buckman build. Use the free weeks to offset 2BR cost.', mgmt:{name:'2121 Belmont Leasing',hours:'2121belmontapts.com'} },
  { id:'moderabelmont2', name:'Modera Belmont', addr:'685 SE Belmont · Buckman', price:'From $1,480', pn:'Studio–2BR · 457–1,230 sqft', type:'apartment', beds:'2BR', score:76, status:'ok', isNew:true, lat:45.5155, lng:-122.6502, gradient:'linear-gradient(135deg,#ff6b6b,#feca57)',
    rows:[{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'Up to 1,230 sqft',d:'g'},{l:'Rooftop',v:'Mt Hood + river views',d:'g'}],
    flags:[{t:'Price drops recently',c:'fb'}], link:'https://www.moderabelmont.com/',
    note:'Floor-to-ceiling windows, Buckman. Well-reviewed management. 2BR up to 1,230 sqft.', mgmt:{name:'Mill Creek Residential',hours:'M–F 10–6 · Sat 10–5'} },
  { id:'belmontdairy', name:'Belmont Dairy Lofts', addr:'3342 SE Morrison · Sunnyside', price:'From $1,258', pn:'1–2BR · income-qualified', type:'apartment', beds:'2BR', score:48, status:'ok', isNew:true, lat:45.5180, lng:-122.6390, gradient:'linear-gradient(135deg,#d4a373,#a0522d)',
    rows:[{l:'Layout',v:'22-ft ceilings · skylights',d:'g'},{l:'In-unit W/D',v:'No — shared',d:'r'},{l:'2BR',v:'1,004–1,486 sqft',d:'g'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'Pets',v:'Dogs 45lb max',d:'y'}],
    flags:[{t:'⚠ Income-qualified — verify eligibility',c:'fr'},{t:'Mixed management reviews',c:'fr'},{t:'No in-unit laundry',c:'fr'}], link:'https://www.belmontdairy.com/',
    note:'Stunning ceilings and skylights. BUT: income caps — verify eligibility first.', mgmt:{name:'Cirrus Asset Management',hours:'belmontdairy.com'} },
  { id:'east12', name:'East 12 Lofts', addr:'1100 SE 12th · Buckman', price:'From $1,195', pn:'Studio/1BR · 380–445 sqft · 2014', type:'apartment', beds:'Studio/1BR', score:63, status:'ok', isNew:true, lat:45.5159, lng:-122.6583, gradient:'linear-gradient(135deg,#373B44,#4286f4)',
    rows:[{l:'Natural light',v:'Oversized windows',d:'g'},{l:'Kitchen',v:'Quartz · stainless',d:'g'},{l:'In-unit W/D',v:'Stacked',d:'g'},{l:'2BR',v:'No — studio/1BR only',d:'r'},{l:'Amenities',v:'Rooftop · fitness',d:'g'}],
    flags:[{t:'Studio/1BR only',c:'fr'},{t:'1 month free select units',c:'fb'}], link:'https://www.liveeast12.com/',
    note:'Buckman — steps from food carts and Hawthorne bridge. Units small (380–445 sqft) but well finished.', mgmt:{name:'East 12 Leasing',hours:'liveeast12.com'} },
]

// ── Filters → URL slugs ───────────────────────────────────────────────────────
const VIEWS = [
  { key:'all',        slug:'',           label:'All' },
  { key:'map',        slug:'map',        label:'Map' },
  { key:'favorites',  slug:'favorites',  label:'Favorites ★' },
  { key:'cohousing',  slug:'cohousing',  label:'Cohousing' },
  { key:'2br',        slug:'2br',        label:'2BR' },
  { key:'loft',       slug:'loft',       label:'Loft layout' },
  { key:'new',        slug:'new',        label:'New' },
  { key:'archived',   slug:'archived',   label:'Archived' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 55 ? '#d97706' : '#dc2626'
const dotBg = (d: string) => d === 'g' ? '#16a34a' : d === 'y' ? '#d97706' : d === 'r' ? '#dc2626' : '#d1d5db'

function getChips(l: Listing): { label: string; color: string; bg: string }[] {
  const chips: { label: string; color: string; bg: string }[] = []
  const loftRow = l.rows.find(r => r.l === 'Layout')
  if (loftRow) chips.push({ label: '⬆ loft', color: '#7c3aed', bg: '#f5f3ff' })
  const wdRow = l.rows.find(r => r.l === 'In-unit W/D')
  if (wdRow) chips.push({
    label: wdRow.d === 'g' ? 'W/D ✓' : wdRow.d === 'r' ? 'no W/D' : 'W/D?',
    color: wdRow.d === 'g' ? '#15803d' : wdRow.d === 'r' ? '#b91c1c' : '#b45309',
    bg: wdRow.d === 'g' ? '#dcfce7' : wdRow.d === 'r' ? '#fef2f2' : '#fffbeb',
  })
  if (l.beds) chips.push({ label: l.beds, color: '#1d4ed8', bg: '#eff6ff' })
  return chips.slice(0, 3)
}

const CONTACT_OPTS: { s: ContactEntry['status']; label: string; color: string; bg: string }[] = [
  { s:'none',      label:'Not contacted', color:'#9ca3af', bg:'#f3f4f6' },
  { s:'out',       label:'📞 Reached out', color:'#1d4ed8', bg:'#eff6ff' },
  { s:'scheduled', label:'📅 Scheduled',   color:'#854d0e', bg:'#fef9c3' },
  { s:'toured',    label:'✓ Toured',       color:'#15803d', bg:'#dcfce7' },
]

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ l, isFav, isTop, isArchived, note, photo, contact, rank,
  onFav, onArchive, onNote, onPhoto, onContact, isDragging, isOver,
  onEdit }: {
  l: Listing; isFav: boolean; isTop: boolean; isArchived: boolean
  note: string; photo: string; contact: ContactEntry; rank?: number
  onFav: (id:string)=>void; onArchive: (id:string)=>void
  onNote: (id:string,v:string)=>void; onPhoto: (id:string,url:string)=>void
  onContact: (id:string,e:ContactEntry)=>void
  isDragging?: boolean; isOver?: boolean; onEdit?: (l:Listing)=>void
}) {
  const [expanded, setExpanded] = useState(isArchived)
  const [localNote, setLocalNote] = useState(note)
  const [imgHover, setImgHover] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!expanded) setLocalNote(note) }, [note, expanded])

  function handleNote(v: string) {
    setLocalNote(v)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => onNote(l.id, v), 800)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressImage(reader.result)
        onPhoto(l.id, compressed)
      }
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  const contactOpt = CONTACT_OPTS.find(o => o.s === contact.status) || CONTACT_OPTS[0]
  const chips = getChips(l)

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: isTop ? '1.5px solid #16a34a' : isArchived ? '1px solid #e5e7eb' : '1px solid #ebebeb',
      boxShadow: isOver ? '0 0 0 2px #7c3aed, 0 8px 32px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.07)',
      opacity: isDragging ? 0.4 : isArchived ? 0.7 : 1,
      transform: isOver ? 'scale(1.02)' : 'none',
      transition: 'box-shadow 0.15s, transform 0.15s',
      overflow: 'hidden',
    }}>
      {/* ── Photo / Hero ── */}
      <div style={{ position:'relative', height:160, overflow:'hidden', cursor:'pointer', flexShrink:0 }}
        onMouseEnter={() => setImgHover(true)} onMouseLeave={() => setImgHover(false)}
        onClick={() => fileRef.current?.click()}>
        {photo
          ? <img src={photo} alt={l.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter: isArchived ? 'grayscale(50%)' : 'none' }} />
          : <div style={{ width:'100%', height:'100%', background: l.gradient }} />}
        {/* Bottom gradient + name overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 55%)', pointerEvents:'none' }} />
        {isTop && <div style={{ position:'absolute', top:10, left:10, background:'#16a34a', color:'#fff', fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:99, letterSpacing:'0.06em' }}>★ TOP PICK</div>}
        {rank && <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:99 }}>#{rank}</div>}
        {l.isNew && !isTop && !rank && <div style={{ position:'absolute', top:10, left:10, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(6px)', color:'#fff', fontSize:9, fontFamily:'monospace', padding:'2px 7px', borderRadius:99, letterSpacing:'0.06em' }}>NEW</div>}
        <div style={{ position:'absolute', bottom:10, left:14, right:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:16, fontWeight:600, color:'#fff', lineHeight:1.2, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>{l.name}</div>
        </div>
        {/* Upload overlay */}
        {imgHover && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#fff', fontSize:11, fontFamily:'monospace' }}>
          <span>📷</span><span>{photo ? 'replace photo' : 'add photo'}</span>
        </div>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'12px 14px 0' }}>
        {/* Price + addr row */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8, marginBottom:2 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:18, color:'#111827', fontWeight:500, lineHeight:1 }}>{l.price}</div>
          {l.score > 0 && <div style={{ fontFamily:'monospace', fontSize:10, color: scoreColor(l.score), fontWeight:600 }}>{l.score}</div>}
        </div>
        <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:10, letterSpacing:'0.02em' }}>{l.addr}</div>

        {/* Chips */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
          {chips.map((c,i) => (
            <span key={i} style={{ fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:99, background:c.bg, color:c.color, fontWeight:500 }}>{c.label}</span>
          ))}
          {contact.status !== 'none' && (
            <span style={{ fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:99, background:contactOpt.bg, color:contactOpt.color, fontWeight:500 }}>{contactOpt.label}</span>
          )}
        </div>

        {/* Note preview */}
        {note && !expanded && (
          <div style={{ fontSize:11, color:'#7c3aed', fontFamily:'monospace', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✎ {note}</div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div style={{ padding:'10px 14px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #f5f5f5' }}>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {/* Star */}
          <button onClick={() => onFav(l.id)} title={isFav ? 'Unfavorite' : 'Favorite'}
            style={{ fontSize:18, background:'none', border:'none', cursor:'pointer', color: isFav ? '#eab308' : '#d1d5db', padding:'2px 4px', lineHeight:1 }}>★</button>
          {/* View listing */}
          <a href={l.link} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', textDecoration:'none', padding:'2px 6px' }}>↗</a>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {/* Edit (custom only) */}
          {l.isCustom && onEdit && (
            <button onClick={() => onEdit(l)}
              style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:'3px 6px' }}>edit</button>
          )}
          {/* Notes toggle */}
          <button onClick={() => setExpanded(e => !e)}
            style={{ fontFamily:'monospace', fontSize:10, color: expanded ? '#111827' : (note ? '#7c3aed' : '#9ca3af'), background: expanded ? '#f3f4f6' : 'none', border:'none', cursor:'pointer', padding:'3px 8px', borderRadius:6, transition:'all 0.1s' }}>
            {expanded ? 'close ↑' : (note ? '✎ notes' : 'notes')}
          </button>
          {/* Archive */}
          <button onClick={() => onArchive(l.id)} title={isArchived ? 'Unarchive' : 'Rule out'}
            style={{ fontFamily:'monospace', fontSize:10, color: isArchived ? '#ef4444' : '#9ca3af', background: isArchived ? '#fff1f1' : 'none', border:'1px solid', borderColor: isArchived ? '#fca5a5' : 'transparent', cursor:'pointer', padding:'3px 8px', borderRadius:6 }}>
            {isArchived ? '↺' : '✕'}
          </button>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{ borderTop:'1px solid #f0f0f0', padding:'14px', background: isArchived ? '#fffafa' : '#fafafa' }}>

          {/* Contact block */}
          {l.mgmt && (l.mgmt.phone || l.mgmt.email || l.mgmt.name) && (
            <div style={{ marginBottom:14, padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #ebebeb' }}>
              {l.mgmt.name && <div style={{ fontSize:11, fontWeight:600, color:'#374151', marginBottom:5 }}>{l.mgmt.name}</div>}
              {l.mgmt.phone && <a href={`tel:${l.mgmt.phone.replace(/\D/g,'')}`} style={{ display:'block', fontSize:13, color:'#16a34a', fontWeight:600, textDecoration:'none', marginBottom:3 }}>📞 {l.mgmt.phone}</a>}
              {l.mgmt.email && <a href={`mailto:${l.mgmt.email}`} style={{ display:'block', fontSize:11, color:'#1d4ed8', textDecoration:'none', marginBottom:3 }}>✉ {l.mgmt.email}</a>}
              {l.mgmt.hours && <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>{l.mgmt.hours}</div>}
            </div>
          )}

          {/* Contact status */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
            {CONTACT_OPTS.map(opt => (
              <button key={opt.s} onClick={() => onContact(l.id, { status: opt.s, date: opt.s !== 'none' ? new Date().toLocaleDateString() : undefined })}
                style={{ fontSize:10, fontFamily:'monospace', padding:'4px 9px', borderRadius:99, border:'1px solid', cursor:'pointer',
                  background: contact.status === opt.s ? opt.bg : '#fff',
                  color: contact.status === opt.s ? opt.color : '#9ca3af',
                  borderColor: contact.status === opt.s ? opt.color : '#e5e7eb',
                  fontWeight: contact.status === opt.s ? 600 : 400 }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color: isArchived ? '#ef4444' : '#9ca3af', marginBottom:5 }}>
            {isArchived ? 'Ruled out — reason / notes' : 'Notes (synced with Reese)'}
          </div>
          <textarea value={localNote} onChange={e => handleNote(e.target.value)}
            placeholder="Pros, cons, questions to ask on tour…"
            style={{ width:'100%', minHeight:90, fontSize:12, color:'#374151', background: isArchived ? '#fff5f5' : '#fff', border:`1px solid ${isArchived ? '#fecaca' : '#e5e7eb'}`, borderRadius:8, padding:'10px 12px', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }} />

          {/* Flags */}
          {l.flags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:10 }}>
              {l.flags.map((f,i) => (
                <span key={i} style={{ fontSize:10, padding:'2px 8px', borderRadius:99,
                  background: f.c==='fr' ? '#fef2f2' : f.c==='fa' ? '#fffbeb' : '#eff6ff',
                  color: f.c==='fr' ? '#b91c1c' : f.c==='fa' ? '#b45309' : '#1d4ed8',
                  border: `1px solid ${f.c==='fr' ? '#fecaca' : f.c==='fa' ? '#fde68a' : '#bfdbfe'}` }}>
                  {f.t}
                </span>
              ))}
            </div>
          )}

          {/* Detail rows */}
          {l.rows.length > 0 && (
            <div style={{ marginTop:12, borderTop:'1px solid #f0f0f0', paddingTop:10 }}>
              {l.rows.map((r,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 0', gap:8 }}>
                  <span style={{ fontSize:11, color:'#9ca3af', minWidth:90, flexShrink:0 }}>{r.l}</span>
                  <span style={{ fontSize:11, color:'#374151', fontWeight:500, flex:1, textAlign:'right' }}>{r.v}</span>
                  <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: dotBg(r.d) }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#2d1b69,#11998e)',
  'linear-gradient(135deg,#1a1a2e,#0f3460)',
  'linear-gradient(135deg,#0f2027,#2c5364)',
]

type ModalMode = 'add' | 'edit'
interface ModalState {
  name: string; addr: string; price: string; pn: string; beds: string
  type: 'apartment' | 'cohousing'; score: string; link: string; note: string; gradient: string
  mgmtName: string; mgmtPhone: string; mgmtEmail: string; mgmtHours: string
  lat: string; lng: string
}

const emptyModal = (): ModalState => ({
  name:'', addr:'', price:'', pn:'', beds:'', type:'apartment', score:'', link:'', note:'', gradient: GRADIENTS[0],
  mgmtName:'', mgmtPhone:'', mgmtEmail:'', mgmtHours:'', lat:'', lng:''
})

function AddEditModal({ mode, initial, onSave, onDelete, onClose }: {
  mode: ModalMode; initial?: Listing; onSave: (l: Listing) => void
  onDelete?: () => void; onClose: () => void
}) {
  const [f, setF] = useState<ModalState>(() => {
    if (!initial) return emptyModal()
    return {
      name: initial.name, addr: initial.addr, price: initial.price, pn: initial.pn,
      beds: initial.beds, type: initial.type, score: String(initial.score || ''),
      link: initial.link, note: initial.note, gradient: initial.gradient,
      mgmtName: initial.mgmt?.name||'', mgmtPhone: initial.mgmt?.phone||'',
      mgmtEmail: initial.mgmt?.email||'', mgmtHours: initial.mgmt?.hours||'',
      lat: String(initial.lat||''), lng: String(initial.lng||''),
    }
  })
  const set = (k: keyof ModalState, v: string) => setF(p => ({ ...p, [k]: v }))

  function save() {
    if (!f.name.trim() || !f.addr.trim()) return
    const listing: Listing = {
      id: initial?.id || `custom_${Date.now()}`,
      name: f.name.trim(), addr: f.addr.trim(), price: f.price, pn: f.pn,
      beds: f.beds, type: f.type, score: parseInt(f.score)||0,
      status: 'ok', isNew: true, isCustom: true,
      rows: [], flags: [], link: f.link, note: f.note,
      gradient: f.gradient, lat: parseFloat(f.lat)||45.5231, lng: parseFloat(f.lng)||-122.6765,
      mgmt: (f.mgmtName||f.mgmtPhone||f.mgmtEmail) ? {
        name: f.mgmtName||undefined, phone: f.mgmtPhone||undefined,
        email: f.mgmtEmail||undefined, hours: f.mgmtHours||undefined,
      } : undefined,
    }
    onSave(listing)
  }

  const inp: React.CSSProperties = { width:'100%', fontSize:13, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, outline:'none', fontFamily:'inherit', color:'#111827', boxSizing:'border-box' as const, background:'#fff' }
  const lbl: React.CSSProperties = { fontSize:10, fontFamily:'monospace', color:'#9ca3af', textTransform:'uppercase' as const, letterSpacing:'0.1em', display:'block', marginBottom:4 }
  const row: React.CSSProperties = { display:'flex', gap:10 }
  const half: React.CSSProperties = { flex:1, minWidth:0 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', padding:'24px 24px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:20 }}>{mode === 'add' ? 'Add listing' : 'Edit listing'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#9ca3af', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Gradient picker */}
        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Card color</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {GRADIENTS.map(g => (
              <div key={g} onClick={() => set('gradient', g)} style={{
                width:32, height:32, borderRadius:8, background:g, cursor:'pointer', flexShrink:0,
                border: f.gradient === g ? '2.5px solid #111827' : '2.5px solid transparent',
                transition:'border 0.1s'
              }} />
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name */}
          <div>
            <label style={lbl}>Name *</label>
            <input style={inp} value={f.name} onChange={e => set('name',e.target.value)} placeholder="e.g. Anthem PDX" />
          </div>
          {/* Addr */}
          <div>
            <label style={lbl}>Address *</label>
            <input style={inp} value={f.addr} onChange={e => set('addr',e.target.value)} placeholder="123 NE Burnside · Kerns" />
          </div>
          {/* Price + PN */}
          <div style={row}>
            <div style={half}>
              <label style={lbl}>Price</label>
              <input style={inp} value={f.price} onChange={e => set('price',e.target.value)} placeholder="From $1,800" />
            </div>
            <div style={half}>
              <label style={lbl}>Details</label>
              <input style={inp} value={f.pn} onChange={e => set('pn',e.target.value)} placeholder="2BR · built 2020" />
            </div>
          </div>
          {/* Type + Beds + Score */}
          <div style={row}>
            <div style={half}>
              <label style={lbl}>Type</label>
              <select style={inp} value={f.type} onChange={e => set('type', e.target.value as any)}>
                <option value="apartment">Apartment</option>
                <option value="cohousing">Cohousing</option>
              </select>
            </div>
            <div style={half}>
              <label style={lbl}>Beds</label>
              <input style={inp} value={f.beds} onChange={e => set('beds',e.target.value)} placeholder="2BR" />
            </div>
            <div style={{ width:70 }}>
              <label style={lbl}>Score</label>
              <input style={inp} value={f.score} onChange={e => set('score',e.target.value)} placeholder="70" type="number" min="0" max="100" />
            </div>
          </div>
          {/* Link */}
          <div>
            <label style={lbl}>Listing URL</label>
            <input style={inp} value={f.link} onChange={e => set('link',e.target.value)} placeholder="https://…" type="url" />
          </div>
          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, minHeight:70, resize:'none' }} value={f.note} onChange={e => set('note',e.target.value)} placeholder="Key details, things to ask on tour…" />
          </div>

          {/* Divider */}
          <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:4 }}>
            <div style={{ ...lbl, marginBottom:10 }}>Management contact (optional)</div>
          </div>
          <div style={row}>
            <div style={half}>
              <label style={lbl}>Company</label>
              <input style={inp} value={f.mgmtName} onChange={e => set('mgmtName',e.target.value)} placeholder="Greystar" />
            </div>
            <div style={half}>
              <label style={lbl}>Phone</label>
              <input style={inp} value={f.mgmtPhone} onChange={e => set('mgmtPhone',e.target.value)} placeholder="(503) 555-0100" />
            </div>
          </div>
          <div style={row}>
            <div style={half}>
              <label style={lbl}>Email</label>
              <input style={inp} value={f.mgmtEmail} onChange={e => set('mgmtEmail',e.target.value)} placeholder="leasing@example.com" type="email" />
            </div>
            <div style={half}>
              <label style={lbl}>Hours</label>
              <input style={inp} value={f.mgmtHours} onChange={e => set('mgmtHours',e.target.value)} placeholder="M–F 10–6" />
            </div>
          </div>
          {/* Lat/Lng for map */}
          <div style={row}>
            <div style={half}>
              <label style={lbl}>Latitude (for map)</label>
              <input style={inp} value={f.lat} onChange={e => set('lat',e.target.value)} placeholder="45.5231" />
            </div>
            <div style={half}>
              <label style={lbl}>Longitude (for map)</label>
              <input style={inp} value={f.lng} onChange={e => set('lng',e.target.value)} placeholder="-122.6765" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={save} disabled={!f.name.trim() || !f.addr.trim()}
            style={{ flex:1, padding:'12px', background:'#111827', color:'#fff', border:'none', borderRadius:10, fontFamily:'Georgia,serif', fontSize:15, cursor:'pointer', opacity: (!f.name.trim()||!f.addr.trim()) ? 0.4 : 1 }}>
            {mode === 'add' ? 'Add listing' : 'Save changes'}
          </button>
          {mode === 'edit' && onDelete && (
            <button onClick={onDelete} style={{ padding:'12px 18px', background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', borderRadius:10, fontFamily:'monospace', fontSize:12, cursor:'pointer' }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Map View ──────────────────────────────────────────────────────────────────
function MapView({ listings, favorites, archived, topPickId, notes }: {
  listings: Listing[]; favorites: string[]; archived: string[]; topPickId: string|null; notes: Record<string,string>
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link'); link.id='leaflet-css'; link.rel='stylesheet'
      link.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = () => initMap(); document.head.appendChild(script)
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }
  }, [])

  useEffect(() => { if (leafletMap.current) renderMarkers() }, [favorites, archived, topPickId])

  function initMap() {
    const L = (window as any).L; if (!mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl:true }).setView([45.528, -122.654], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution:'© OpenStreetMap © CARTO', maxZoom:19 }).addTo(map)
    leafletMap.current = map; renderMarkers()
  }

  function renderMarkers() {
    const L = (window as any).L; const map = leafletMap.current; if (!L||!map) return
    map.eachLayer((layer: any) => { if (layer.options?.isAptMarker) map.removeLayer(layer) })
    listings.filter(l => !archived.includes(l.id)).forEach(l => {
      const isFav = favorites.includes(l.id); const isTop = l.id === topPickId; const hasNote = !!(notes[l.id]?.trim())
      const color = isTop ? '#16a34a' : isFav ? '#eab308' : hasNote ? '#d97706' : '#6b7280'
      const size = isTop ? 18 : isFav ? 15 : 12
      const icon = L.divIcon({
        html: `<div style="width:${size*2}px;height:${size*2}px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:${size*.7}px;color:white;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;">${isTop?'★':isFav?'♥':''}</div>`,
        className:'', iconSize:[size*2,size*2], iconAnchor:[size,size], popupAnchor:[0,-size-4]
      })
      const popup = `<div style="font-family:sans-serif;min-width:200px"><div style="font-size:13px;font-weight:600;margin-bottom:2px">${l.name}</div><div style="font-size:11px;color:#9ca3af;margin-bottom:6px">${l.addr}</div><div style="font-size:14px;font-weight:500;margin-bottom:6px">${l.price}</div>${notes[l.id]?`<div style="font-size:11px;color:#7c3aed;margin-bottom:6px">✎ ${notes[l.id].slice(0,80)}…</div>`:''}<a href="${l.link}" target="_blank" style="font-size:11px;color:#16a34a;font-family:monospace">View listing →</a></div>`
      L.marker([l.lat,l.lng],{icon,isAptMarker:true}).addTo(map).bindPopup(popup,{maxWidth:280,className:'apt-popup'})
    })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 110px)', minHeight:500 }}>
      <div style={{ padding:'8px 24px', background:'#fff', borderBottom:'1px solid #ebebeb', display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
        {[{c:'#16a34a',l:'Top pick'},{c:'#eab308',l:'Favorited'},{c:'#d97706',l:'Has notes'},{c:'#6b7280',l:'New'}].map(x=>(
          <div key={x.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:x.c, border:'2px solid white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
            <span style={{ fontFamily:'monospace', fontSize:10, color:'#6b7280' }}>{x.l}</span>
          </div>
        ))}
      </div>
      <div ref={mapRef} style={{ flex:1 }} />
      <style>{`.apt-popup .leaflet-popup-content-wrapper{border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:0}.apt-popup .leaflet-popup-content{margin:14px 16px}`}</style>
    </div>
  )
}

// ── Kanban Group ──────────────────────────────────────────────────────────────
function KanbanGroup({ label, count, hint, accent, children }: { label:string; count:number; hint?:string; accent:string; children: React.ReactNode[] }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:3, height:18, borderRadius:99, background:accent, flexShrink:0 }} />
        <span style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600, color:'#111827' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>{count} {hint||''}</span>
        <div style={{ flex:1, height:1, background:'#ebebeb' }} />
      </div>
      {children.length === 0
        ? <div style={{ fontFamily:'Georgia,serif', fontSize:14, fontStyle:'italic', color:'#d1d5db', padding:'16px 0' }}>—</div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14 }}>{children}</div>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApartmentsPage() {
  const router = useRouter()
  const params = useParams()
  const slugArr = params?.slug as string[]|undefined
  const view = slugArr?.[0] || 'all'

  function navigate(slug: string) {
    router.push(slug === 'all' ? '/apartments' : `/apartments/${slug}`)
  }

  // ── State ──
  const [state, setState] = useState<SharedState>({ favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{}, customListings:[] })
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date|null>(null)
  const [showModal, setShowModal] = useState<{mode:ModalMode; listing?:Listing}|null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const pendingSave = useRef(false)
  const pendingTimeout = useRef<ReturnType<typeof setTimeout>|null>(null)
  const stateRef = useRef(state)
  const dragId = useRef<string|null>(null)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overId, setOverId] = useState<string|null>(null)

  useEffect(() => { loadState(); const iv = setInterval(loadState, 8000); return () => clearInterval(iv) }, [])

  function setPending(v: boolean) {
    pendingSave.current = v
    if (pendingTimeout.current) clearTimeout(pendingTimeout.current)
    if (v) pendingTimeout.current = setTimeout(() => { pendingSave.current = false }, 10000)
  }

  async function loadState(force = false) {
    if (!force && pendingSave.current) return
    try {
      const { data, error } = await supabase.from('apartment_state').select('data').eq('key','shared').single()
      if (error) { setSyncError(true); return }
      if (data?.data) {
        const merged: SharedState = { favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{}, customListings:[], ...(data.data as SharedState) }
        stateRef.current = merged; setState(merged); setLastSynced(new Date()); setSyncError(false)
      }
    } catch { setSyncError(true) }
  }

  const persist = useCallback((next: SharedState) => {
    stateRef.current = next; setPending(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      try {
        const { error } = await supabase.from('apartment_state').upsert({ key:'shared', data:stateRef.current, updated_at:new Date().toISOString() })
        if (error) setSyncError(true); else { setLastSynced(new Date()); setSyncError(false) }
      } catch { setSyncError(true) }
      finally { setSyncing(false); setPending(false) }
    }, 600)
  }, [])

  function toggleFav(id: string) {
    setState(prev => {
      const has = prev.favorites.includes(id)
      const favorites = has ? prev.favorites.filter(f=>f!==id) : [...prev.favorites, id]
      const favoriteOrder = has ? prev.favoriteOrder.filter(f=>f!==id) : [...prev.favoriteOrder, id]
      const next = { ...prev, favorites, favoriteOrder }; persist(next); return next
    })
  }
  function updateNote(id: string, v: string) {
    setState(prev => { const next = { ...prev, notes:{ ...prev.notes, [id]:v } }; persist(next); return next })
  }
  function updatePhoto(id: string, dataUrl: string) {
    setState(prev => { const next = { ...prev, photos:{ ...prev.photos, [id]:dataUrl } }; stateRef.current = next; return next })
    setPending(true); setSyncing(true)
    const toSave = { ...stateRef.current }
    supabase.from('apartment_state').upsert({ key:'shared', data:toSave, updated_at:new Date().toISOString() })
      .then(({error}) => { if (error) setSyncError(true); else { setLastSynced(new Date()); setSyncError(false) } })
      .catch(() => setSyncError(true)).finally(() => { setSyncing(false); setPending(false) })
  }
  function updateContact(id: string, entry: ContactEntry) {
    setState(prev => { const next = { ...prev, contacts:{ ...(prev.contacts||{}), [id]:entry } }; persist(next); return next })
  }
  function toggleArchive(id: string) {
    setState(prev => {
      const has = (prev.archived||[]).includes(id)
      const archived = has ? prev.archived.filter(a=>a!==id) : [...(prev.archived||[]), id]
      const favorites = has ? prev.favorites : prev.favorites.filter(f=>f!==id)
      const favoriteOrder = has ? prev.favoriteOrder : prev.favoriteOrder.filter(f=>f!==id)
      const next = { ...prev, archived, favorites, favoriteOrder }; persist(next); return next
    })
  }

  function saveCustomListing(l: Listing) {
    setState(prev => {
      const existing = (prev.customListings||[]).findIndex(x => x.id === l.id)
      const customListings = existing >= 0
        ? prev.customListings.map((x,i) => i === existing ? l : x)
        : [...(prev.customListings||[]), l]
      const next = { ...prev, customListings }; persist(next); return next
    })
    setShowModal(null)
  }
  function deleteCustomListing(id: string) {
    setState(prev => {
      const customListings = (prev.customListings||[]).filter(l => l.id !== id)
      const next = { ...prev, customListings }; persist(next); return next
    })
    setShowModal(null)
  }

  // Drag/drop
  function onDragStart(id: string) { dragId.current = id; setDraggingId(id) }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setOverId(id) }
  function onDrop(targetId: string) {
    if (!dragId.current || dragId.current === targetId) { setDraggingId(null); setOverId(null); return }
    setState(prev => {
      const order = prev.favoriteOrder.length > 0 ? [...prev.favoriteOrder] : [...prev.favorites]
      const from = order.indexOf(dragId.current!); const to = order.indexOf(targetId)
      if (from < 0 || to < 0) return prev
      order.splice(from,1); order.splice(to,0,dragId.current!)
      const next = { ...prev, favoriteOrder:order, favorites:order }; persist(next); return next
    })
    dragId.current=null; setDraggingId(null); setOverId(null)
  }
  function onDragEnd() { dragId.current=null; setDraggingId(null); setOverId(null) }

  // Derived
  const allListings = [...SEED, ...(state.customListings||[])]
  const LMAP = Object.fromEntries(allListings.map(l=>[l.id,l]))
  const archived = state.archived||[]
  const favOrder = state.favoriteOrder.length > 0 ? state.favoriteOrder : state.favorites
  const topPickId = favOrder[0]||null

  const kanbanFav = favOrder.map(id=>LMAP[id]).filter(l=>l&&!archived.includes(l.id))
  const unfav = allListings.filter(l=>!archived.includes(l.id)&&!favOrder.includes(l.id))
  const kanbanConsidering = unfav.filter(l=>!!(state.notes[l.id]?.trim()))
  const kanbanNew = unfav.filter(l=>!state.notes[l.id]?.trim())

  const visibleListings = (() => {
    if (view==='archived') return allListings.filter(l=>archived.includes(l.id))
    if (view==='favorites') return favOrder.map(id=>LMAP[id]).filter(l=>l&&!archived.includes(l.id))
    if (view==='all'||view==='map') return []
    return allListings.filter(l => {
      if (archived.includes(l.id)) return false
      if (view==='cohousing') return l.type==='cohousing'
      if (view==='2br') return l.beds.includes('2BR')
      if (view==='loft') return l.rows.some(r=>r.l==='Layout'&&r.d==='g')
      if (view==='new') return l.isNew
      return true
    })
  })()

  const statsListings = (view==='all'||view==='map') ? [...kanbanFav,...kanbanConsidering,...kanbanNew] : (view==='archived' ? allListings.filter(l=>archived.includes(l.id)) : visibleListings)
  const contactedCount = Object.values(state.contacts as Record<string,ContactEntry>||{}).filter(c=>c.status!=='none').length
  const touredCount = Object.values(state.contacts as Record<string,ContactEntry>||{}).filter(c=>c.status==='toured').length

  function renderCard(l: Listing, i: number, draggable=false, rank?: number) {
    return (
      <div key={l.id} draggable={draggable}
        onDragStart={draggable?()=>onDragStart(l.id):undefined}
        onDragOver={draggable?(e)=>onDragOver(e,l.id):undefined}
        onDrop={draggable?()=>onDrop(l.id):undefined}
        onDragEnd={draggable?onDragEnd:undefined}
        style={{ cursor:draggable?'grab':'default', animation:`fadeUp 0.2s ease ${i*25}ms both` }}>
        <Card l={l} isFav={state.favorites.includes(l.id)} isTop={l.id===topPickId}
          isArchived={archived.includes(l.id)} note={state.notes[l.id]||''}
          photo={(state.photos||{})[l.id]||''} contact={(state.contacts||{})[l.id]||{status:'none'}}
          rank={rank} onFav={toggleFav} onArchive={toggleArchive} onNote={updateNote}
          onPhoto={updatePhoto} onContact={updateContact} isDragging={draggingId===l.id}
          isOver={overId===l.id&&draggingId!==l.id}
          onEdit={l.isCustom ? (x)=>setShowModal({mode:'edit',listing:x}) : undefined} />
      </div>
    )
  }

  const isAll = view==='all'; const isMap = view==='map'; const isFavView = view==='favorites'; const isArchiveView = view==='archived'

  return (
    <div style={{ background:'#F5F3EF', minHeight:'100vh', color:'#111827' }}>
      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid #ebebeb', padding:'12px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', color:'#9ca3af', marginBottom:1 }}>Portland · June 2026</div>
            <h1 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:400, margin:0, lineHeight:1.1 }}>
              Marvin & Reese&rsquo;s <em style={{ color:'#16a34a' }}>Housing Shortlist</em>
            </h1>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {syncError && (
              <button onClick={() => loadState(true)} style={{ fontFamily:'monospace', fontSize:9, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, cursor:'pointer', padding:'3px 8px' }}>
                ⚠ retry sync
              </button>
            )}
            <div style={{ width:6, height:6, borderRadius:'50%', background: syncError?'#dc2626':syncing?'#7c3aed':'#16a34a', flexShrink:0 }} />
            {lastSynced && !syncError && <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af' }}>{lastSynced.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
          {VIEWS.map(v => {
            const active = view === v.key
            const isArch = v.key === 'archived'
            return (
              <button key={v.key} onClick={() => navigate(v.slug)}
                style={{ fontFamily:'monospace', fontSize:10, letterSpacing:'0.04em', padding:'5px 12px', borderRadius:99, border:'1px solid', cursor:'pointer', transition:'all 0.1s', whiteSpace:'nowrap',
                  background: active ? (isArch?'#7f1d1d':'#111827') : isArch?'#fff5f5':'#ffffff',
                  color: active ? '#fff' : isArch ? '#b91c1c' : '#6b7280',
                  borderColor: active ? (isArch?'#7f1d1d':'#111827') : isArch?'#fecaca':'#e5e7eb' }}>
                {v.label}{isArch&&archived.length>0?` (${archived.length})`:''}
              </button>
            )
          })}
          <button onClick={() => setShowModal({mode:'add'})}
            style={{ fontFamily:'monospace', fontSize:10, padding:'5px 14px', borderRadius:99, border:'1px solid #16a34a', cursor:'pointer', background:'#f0fdf4', color:'#15803d', marginLeft:'auto', whiteSpace:'nowrap' }}>
            + Add
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
          {[{n:statsListings.length,l:'listings'},{n:state.favorites.length,l:'favorited'},{n:contactedCount,l:'contacted'},{n:touredCount,l:'toured'}].map(s=>(
            <div key={s.l} style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontFamily:'Georgia,serif', fontSize:16, color:'#111827' }}>{s.n||'—'}</span>
              <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Views ── */}
      {isMap && <MapView listings={allListings} favorites={state.favorites} archived={archived} topPickId={topPickId} notes={state.notes} />}

      {isAll && (
        <div style={{ padding:'24px 20px 60px', display:'flex', flexDirection:'column', gap:48 }}>
          <KanbanGroup label="Favorited" count={kanbanFav.length} hint="· drag to reorder" accent="#16a34a">
            {kanbanFav.map((l,i) => renderCard(l, i, true, i+1))}
          </KanbanGroup>
          <KanbanGroup label="Considering" count={kanbanConsidering.length} hint="with notes" accent="#d97706">
            {kanbanConsidering.map((l,i) => renderCard(l,i))}
          </KanbanGroup>
          <KanbanGroup label="New" count={kanbanNew.length} hint="not yet reviewed" accent="#9ca3af">
            {kanbanNew.map((l,i) => renderCard(l,i))}
          </KanbanGroup>
        </div>
      )}

      {!isAll && !isMap && (
        <div style={{ padding:'20px 20px 60px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14 }}>
          {visibleListings.map((l,i) => renderCard(l, i, isFavView, isFavView?i+1:undefined))}
          {visibleListings.length === 0 && (
            <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', fontFamily:'Georgia,serif', fontSize:20, fontStyle:'italic', color:'#9ca3af' }}>
              {isArchiveView ? 'Nothing archived yet.' : isFavView ? 'No favorites yet — star some listings.' : 'No listings match this filter.'}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <AddEditModal
          mode={showModal.mode}
          initial={showModal.listing}
          onSave={saveCustomListing}
          onDelete={showModal.listing?.id ? () => deleteCustomListing(showModal.listing!.id) : undefined}
          onClose={() => setShowModal(null)}
        />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus, input:focus, select:focus { border-color:#a5b4fc !important; box-shadow: 0 0 0 3px #ede9fe !important; outline:none; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
