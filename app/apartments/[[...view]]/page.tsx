'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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
  gradient: string; lat: number; lng: number
  mgmt?: { name?: string; phone?: string; email?: string; hours?: string }
  isCustom?: boolean
}
interface ContactEntry { status: 'none'|'out'|'scheduled'|'toured'; date?: string }
interface SharedState {
  favorites: string[]; notes: Record<string, string>; favoriteOrder: string[]
  archived: string[]; photos: Record<string, string>
  contacts: Record<string, ContactEntry>; customListings: Listing[]
}

// ─── Static listings ──────────────────────────────────────────────────────────

const LISTINGS: Listing[] = [
  { id:'anthem', name:'Anthem PDX', addr:'1313 E Burnside St · Kerns', price:'2BR from $1,953', pn:'studio–2BR · built 2020 · 211 units', type:'apartment', beds:'2BR', score:78, status:'ok', isNew:true, lat:45.5236, lng:-122.6545,
    gradient:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    rows:[{l:'Natural light',v:'Big windows throughout',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'Flooring',v:'Wood-look plank (no concrete)',d:'g'},{l:'2BR',v:'Available',d:'g'},{l:'AC',v:'Included in rent',d:'g'},{l:'Walk / Bike',v:'Walk 97 · Bike 100',d:'g'},{l:'Pets',v:'Yes, breed restrictions',d:'y'},{l:'Parking',v:'Unknown — ask',d:'y'}],
    flags:[{t:'Up to 8 weeks free on select units',c:'fb'},{t:'Utilities not included',c:'fa'}],
    link:'https://www.anthempdx.com', note:"Burnside Corridor — Portland's best eastside food/bar/music strip. Peloton, yoga room, courtyard firepit. Feels more 'corpo' aesthetically but ticks nearly every box.",
    mgmt:{ name:'Avenue5 Residential', phone:'(971) 254-4598', email:'anthem@avenue5apt.com', hours:'M–F 10–6 · Sat–Sun 10–5' } },
  { id:'homma', name:'HOMMA HAUS Mount Tabor', addr:'5115 E Burnside St · North Tabor', price:'$2,995/mo', pn:'2BR/2.5BA · 1,150 sqft · smart home', type:'apartment', beds:'2BR', score:74, status:'ok', isNew:true, lat:45.5232, lng:-122.6044,
    gradient:'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    rows:[{l:'Natural light',v:'Skylight + large windows',d:'g'},{l:'Kitchen',v:'Corian counters · gas · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size upstairs',d:'g'},{l:'2BR',v:'Yes + 2.5 baths',d:'g'},{l:'Seismic',v:'Built 2022 · current code',d:'g'},{l:'Heating',v:'Integrated HVAC',d:'g'},{l:'Pets',v:'2 small dogs/cats ($50/mo)',d:'y'},{l:'Parking',v:'Bike storage · no car parking',d:'y'}],
    flags:[{t:'No availability yet — ask for June',c:'fa'},{t:'Above $2k budget',c:'fa'}],
    link:'https://www.apartments.com/homma-haus-mount-tabor-smart-home-portland-or/stf0wj6/', note:'Built by Green Hammer (sustainable builders). Near Mt Tabor Park, food carts. Up to 8 weeks free. Currently waitlisted — call for June.',
    mgmt:{ name:'Edge Asset Management', phone:'(503) 926-8021', hours:'By appointment' } },
  { id:'aoe', name:'Atomic Orchard Experiment', addr:'2510 NE Sandy Blvd · Kerns', price:'$1,805–$1,999', pn:'1BR · utilities separate', type:'apartment', beds:'1BR', score:72, status:'ok', isNew:false, lat:45.5317, lng:-122.6388,
    gradient:'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)',
    rows:[{l:'Layout',v:'Split-level loft · lofted bedroom w/ stairs',d:'g'},{l:'Natural light',v:'Floor-to-ceiling windows',d:'g'},{l:'Kitchen',v:'Quartz counters · dishwasher',d:'g'},{l:'In-unit W/D',v:'Full-size front-load',d:'g'},{l:'Flooring',v:'Wood laminate + concrete · verify per unit',d:'y'},{l:'2BR',v:'1BR only currently',d:'y'},{l:'Seismic',v:'New build 2025',d:'g'},{l:'Pets',v:'Dogs + cats ($300 dep)',d:'g'}],
    flags:[{t:'Confirmed split-level mezzanine layout',c:'fb'},{t:'⚠ Meritus mgmt — very bad reviews',c:'fr'},{t:'⚠ Was in foreclosure — new mgmt ~Feb 2026',c:'fr'},{t:'No on-site parking · street breakins reported',c:'fr'},{t:'Ask about concrete vs wood floors per unit',c:'fa'}],
    link:'https://www.apartments.com/atomic-orchard-experiment-portland-or/9bwstf4/', note:'Best loft layout in Portland — confirmed split-level with stairs, floor-to-ceiling windows, Kerns. BUT serious management red flags: Meritus property management has very bad rep, building was nearly foreclosed early 2026, new management took over ~Feb 2026. One current tenant (moved in mid-March) says new mgmt seems on top of it. Street parking only — smashed windows reported, though manageable if you leave nothing visible. Call new management, ask directly about foreclosure status and what changed. High ceiling + layout potential vs real operational risk.',
    mgmt:{ name:'New mgmt ~Feb 2026 (prev: Meritus)', phone:'⚠ Call building directly', hours:'Verify — contact spotty historically' } },
  { id:'waldorf', name:'Waldorf Apartments', addr:'833 NE Schuyler St · Irvington', price:'Call for price', pn:'KBC Mgmt · +$105/mo utilities', type:'apartment', beds:'2BR', score:68, status:'ok', isNew:false, lat:45.5381, lng:-122.6471,
    gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rows:[{l:'Kitchen',v:'Retro checkered + built-ins',d:'y'},{l:'In-unit W/D',v:'Not listed — confirm',d:'y'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'Yes',d:'g'},{l:'Heating / AC',v:'AC confirmed',d:'g'},{l:'Pets',v:'Dogs + cats ($250 dep)',d:'g'}],
    flags:[{t:'Price unknown — call 503-287-6876',c:'fa'}],
    link:'https://www.kbcmgmt.com/listings/detail/48b2cfd2-1cd4-45e3-a72a-f1da1f97032f', note:'Best vintage 2BR character on the list. Near NE Broadway. Confirm laundry and price first.',
    mgmt:{ name:'KBC Management', phone:'(503) 287-6876', hours:'M–F business hours' } },
  { id:'parkview', name:'Parkview Apartments', addr:"1640 NE Irving St · Sullivan's Gulch", price:'From $1,495', pn:'2BR 950 sqft · National Historic Registry · 1941', type:'apartment', beds:'2BR', score:64, status:'ok', isNew:true, lat:45.5289, lng:-122.6567,
    gradient:'linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #093637 100%)',
    rows:[{l:'Natural light',v:'Picture windows · tons of light',d:'g'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'No — basement shared',d:'r'},{l:'Flooring',v:'Beautiful hardwood',d:'g'},{l:'2BR',v:'Yes · 950 sqft',d:'g'},{l:'Heating',v:'Steam heat (vintage)',d:'y'},{l:'Storage',v:'5×7 basement unit included',d:'g'},{l:'Courtyard',v:'5-acre garden courtyard',d:'g'}],
    flags:[{t:'No in-unit laundry (basement shared)',c:'fr'},{t:'Steam heat — ask about drafts',c:'fa'}],
    link:'https://www.apartments.com/parkview-apartments-portland-or/sb2rbt6/', note:'Gorgeous historic property with garden courtyard and hardwood floors. Best-priced 2BR on the list. Shared laundry is the main drawback.',
    mgmt:{ name:'See listing for contact', hours:'Contact via apartments.com listing' } },
  { id:'kailash', name:'Kailash Ecovillage', addr:'SE Portland · Creston-Kenilworth', price:'Waitlist', pn:'1–2BR · rental model', type:'cohousing', beds:'1–2BR', score:62, status:'ok', isNew:true, lat:45.493, lng:-122.63,
    gradient:'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    rows:[{l:'Community',v:'Solar intentional community',d:'g'},{l:'Shared spaces',v:'Community room · treehouse · gardens',d:'g'},{l:'In-unit W/D',v:'Building laundry room',d:'y'},{l:'2BR',v:'Some units available',d:'y'},{l:'Eco values',v:'Solar · composting · car share',d:'g'},{l:'Location',v:'SE Portland inner city',d:'g'}],
    flags:[{t:'Waitlist — contact ASAP for June',c:'fa'},{t:'No guaranteed availability',c:'fa'}],
    link:'https://www.kailashecovillage.org/housing', note:'Best cohousing fit for science/left/creative values. Rental model — no ownership needed. Contact immediately at kailashecovillage.org/contact.',
    mgmt:{ name:'Kailash Ecovillage', hours:'Contact via kailashecovillage.org/contact' } },
  { id:'belmont', name:'2121 Belmont', addr:'2121 SE Belmont St · Buckman', price:'From $1,977', pn:'2BR ~$2,500–$3,600', type:'apartment', beds:'1–2BR', score:61, status:'ok', isNew:false, lat:45.5162, lng:-122.643,
    gradient:'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    rows:[{l:'Natural light',v:'Open-concept, glowing',d:'g'},{l:'Kitchen',v:'Condo-grade finishes',d:'g'},{l:'In-unit W/D',v:'Likely (condo build)',d:'y'},{l:'2BR',v:'Available (pricey)',d:'y'},{l:'Seismic',v:'Built 2008',d:'g'},{l:'Parking',v:'Underground garage',d:'g'}],
    flags:[{t:'Up to 6 weeks free running now',c:'fb'}],
    link:'https://www.2121belmontapts.com/', note:'Condo-grade Buckman build. Use the free weeks to offset 2BR cost.',
    mgmt:{ name:'2121 Belmont Leasing', hours:'Contact via 2121belmontapts.com' } },
  { id:'yamhill', name:'2026 SE Yamhill St Unit A', addr:'SE Yamhill · Buckman', price:'~$2,199 est', pn:'2BR/1BA · 1,210 sqft · Zillow est', type:'apartment', beds:'2BR', score:58, status:'ok', isNew:true, lat:45.5126, lng:-122.6454,
    gradient:'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
    rows:[{l:'Natural light',v:'Big front window',d:'g'},{l:'Kitchen',v:'Gas range · dishwasher',d:'g'},{l:'In-unit W/D',v:'Not included',d:'r'},{l:'2BR',v:'Yes + attached garage',d:'g'},{l:'Utilities',v:'Water/sewer/garbage incl',d:'g'}],
    flags:[{t:'Not confirmed available — verify',c:'fa'},{t:"Linoleum floors (shared Don't Want)",c:'fr'}],
    link:'https://www.zillow.com/homedetails/2026-SE-Yamhill-St-APT-A-Portland-OR-97214/2069064308_zpid/', note:'Zillow historical listing — not confirmed live. Buckman, attached garage great for camping gear.',
    mgmt:{ name:'Private landlord', hours:'Contact via Zillow listing' } },
  { id:'alberta', name:'Intentional Community — Alberta Arts', addr:'Alberta Arts / Sabin · NE Portland', price:'$825/mo', pn:'Room in shared house · Craigslist', type:'cohousing', beds:'Room share', score:55, status:'ok', isNew:true, lat:45.56, lng:-122.649,
    gradient:'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    rows:[{l:'Community',v:'Intentional community listing',d:'g'},{l:'Location',v:'Alberta Arts — very cool area',d:'g'},{l:'Price',v:'$825/mo — very affordable',d:'g'},{l:'Private space',v:'Single room, shared home',d:'y'},{l:'2BR',v:'No — shared household',d:'r'}],
    flags:[{t:'Room share only',c:'fb'},{t:'CL listing — check soon',c:'fa'}],
    link:'https://portland.craigslist.org/search/roo', note:'Search "intentional community Alberta" in PDX Craigslist rooms & shares. Great short-term landing spot.',
    mgmt:{ name:'Private landlord', hours:'Contact via Craigslist listing' } },
  { id:'cascadia', name:'Cascadia Commons', addr:'SW Portland · Raleigh Hills (97225)', price:'$1,800/mo', pn:'1BR 675 sqft · water/sewer/HOA incl', type:'cohousing', beds:'1BR', score:58, status:'ok', isNew:true, lat:45.4896, lng:-122.78,
    gradient:'linear-gradient(135deg, #1d976c 0%, #93f9b9 100%)',
    rows:[{l:'Natural light',v:"Vaulted 12' ceilings",d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'1BR only available',d:'r'},{l:'Community',v:'26 households since 1999',d:'g'},{l:'Shared spaces',v:'Dining hall · workshop · gardens',d:'g'}],
    flags:[{t:'SW Portland — less inner-city vibe',c:'fa'},{t:'Monthly work parties required',c:'fb'}],
    link:'https://cascadiacommons.com/units-for-sale-or-rent/', note:'Available now at $1,800/mo all-in. Contact: JwhateverG@gmail.com · 503-512-0662',
    mgmt:{ name:'Cascadia Commons', phone:'(503) 512-0662', email:'JwhateverG@gmail.com' } },
  { id:'silver', name:'Silver Court (KBC)', addr:'2170 NE Hancock St · Irvington', price:'Call for price', pn:'+$85/mo utilities', type:'apartment', beds:'1BR', score:52, status:'ok', isNew:false, lat:45.5381, lng:-122.6432,
    gradient:'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
    rows:[{l:'Flooring',v:'Hardwood',d:'g'},{l:'2BR',v:'1BR only',d:'r'},{l:'Pets',v:'Cats only — no dogs',d:'r'}],
    flags:[{t:'No dogs',c:'fr'},{t:'1BR only',c:'fr'}],
    link:'https://www.kbcmgmt.com/listings/detail/2168d557-94a3-42bc-8f1b-c28146d586aa', note:'Elegant 1920s Irvington. Cats-only and 1BR are likely dealbreakers.',
    mgmt:{ name:'KBC Management', phone:'(503) 287-6876', hours:'M–F business hours' } },
  { id:'granada', name:'Granada Court (Bristol Urban)', addr:'932 NE Pacific St · Hollywood/Kerns', price:'Call for price', pn:'+$95/mo utilities', type:'apartment', beds:'Unknown', score:48, status:'ok', isNew:false, lat:45.531, lng:-122.652,
    gradient:'linear-gradient(135deg, #e96c0e 0%, #f5d020 100%)',
    rows:[{l:'In-unit W/D',v:'Building shared only',d:'r'},{l:'Seismic',v:'1926 — ask about retrofit',d:'y'},{l:'Pets',v:'Dogs + cats, no pet rent',d:'g'}],
    flags:[{t:'No in-unit laundry',c:'fr'},{t:'1926 building',c:'fa'}],
    link:'https://www.bristolurban.com/listings/detail/bf220ceb-8085-4a54-8c85-47508f50ec10', note:'Charming courtyard. No in-unit laundry is a high-priority miss. Lower priority.',
    mgmt:{ name:'Bristol Urban Homes', hours:'Contact via bristolurban.com' } },
  { id:'east12', name:'East 12 Lofts', addr:'1100 SE 12th Ave · Buckman', price:'From $1,195', pn:'Studio/1BR · 380–445 sqft · built 2014', type:'apartment', beds:'Studio/1BR', score:63, status:'ok', isNew:true, lat:45.5159, lng:-122.6583,
    gradient:'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
    rows:[{l:'Natural light',v:'Oversized windows · city views',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless steel',d:'g'},{l:'In-unit W/D',v:'Stacked in-unit',d:'g'},{l:'2BR',v:'No — studio/1BR only',d:'r'},{l:'Flooring',v:'Unknown — ask',d:'y'},{l:'Seismic',v:'Built 2014',d:'g'},{l:'Pets',v:'Dogs + cats (100lb max, $250 dep)',d:'g'},{l:'Amenities',v:'Rooftop deck · fitness · bike room',d:'g'},{l:'Walk / Bike',v:'Walk 96 · very bikeable',d:'g'}],
    flags:[{t:'Studio/1BR only — no 2BR',c:'fr'},{t:'1 month free on select units',c:'fb'}],
    link:'https://www.liveeast12.com/', note:'Buckman location is excellent — steps from food carts, cafes, Hawthorne bridge. Units are small (380–445 sqft) but well finished.',
    mgmt:{ name:'East 12 Lofts Leasing', hours:'Contact via liveeast12.com' } },
  { id:'cookstreet', name:'Cook Street', addr:'107 N Cook St · Williams District', price:'From $1,335', pn:'Studio–2BR · 490–983 sqft · built 2016', type:'apartment', beds:'2BR', score:71, status:'ok', isNew:true, lat:45.545, lng:-122.67,
    gradient:'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    rows:[{l:'Natural light',v:'Picture windows · city views',d:'g'},{l:'Kitchen',v:'Luxury finishes — confirm details',d:'y'},{l:'In-unit W/D',v:'Confirm — not listed explicitly',d:'y'},{l:'2BR',v:'Available · up to 983 sqft',d:'g'},{l:'Eco-friendly',v:'Natural NW materials · green build',d:'g'},{l:'Seismic',v:'Built 2016',d:'g'},{l:'Pets',v:'Dogs + cats (no weight limit!)',d:'g'},{l:'Walk / Bike',v:'Walk 94 · near Mississippi/Alberta',d:'g'}],
    flags:[{t:'Confirm in-unit W/D before touring',c:'fa'}],
    link:'https://cookstreetportland.com/', note:'Williams District — one block from Mississippi Ave, close to Alberta Arts. Picture windows, eco-build, no pet weight limit (rare). Strong 2BR option.',
    mgmt:{ name:'Cook Street Leasing', hours:'Contact via cookstreetportland.com' } },
  { id:'fortyone11', name:'Forty One 11', addr:'4111 NE MLK Blvd · Alberta/King', price:'From $1,199', pn:'Studio–2BR · 394–931 sqft · built 2019', type:'apartment', beds:'2BR', score:62, status:'ok', isNew:true, lat:45.556, lng:-122.664,
    gradient:'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    rows:[{l:'Natural light',v:'Unknown — ask',d:'y'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'Unknown — ask',d:'y'},{l:'2BR',v:'Available · up to 931 sqft',d:'g'},{l:'Area',v:'Alberta Arts / King neighborhood',d:'g'},{l:'Seismic',v:'Built 2019',d:'g'},{l:'Pets',v:'Unknown — ask',d:'y'},{l:'Price',v:'Very affordable for 2BR',d:'g'}],
    flags:[{t:'Many details unknown — call to confirm',c:'fa'}],
    link:'https://www.fortyone11pdx.com/', note:'Alberta Arts / King neighborhood — one of the coolest areas on your list. Very competitive price for 2BR. Worth a call.',
    mgmt:{ name:'Forty One 11 Leasing', hours:'Contact via fortyone11pdx.com' } },
  { id:'kingstreet', name:'King Street Lofts', addr:'405 NE Mason St · Alberta/King', price:'From $1,075', pn:'1BR · 556–667 sqft · in-unit W/D', type:'apartment', beds:'1BR', score:57, status:'ok', isNew:true, lat:45.5562, lng:-122.6606,
    gradient:'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    rows:[{l:'Natural light',v:'Unknown — ask',d:'y'},{l:'Kitchen',v:'Unknown — ask',d:'y'},{l:'In-unit W/D',v:'Yes — confirmed',d:'g'},{l:'2BR',v:'Primarily 1BR',d:'r'},{l:'Area',v:'Alberta Arts — very cool',d:'g'},{l:'Price',v:'Very affordable',d:'g'},{l:'Pets',v:'Unknown — ask',d:'y'}],
    flags:[{t:'Primarily 1BR units',c:'fr'},{t:'Best price on the list',c:'fb'}],
    link:'https://www.apartments.com/king-street-lofts-portland-or/nj2bkkq/', note:'Alberta Arts area, excellent price. Mainly 1BR but worth confirming if any 2BR exist.',
    mgmt:{ name:'King Street Lofts Leasing', hours:'Contact via apartments.com listing' } },
  { id:'moderabelmont', name:'Modera Belmont', addr:'685 SE Belmont St · Buckman', price:'From $1,480', pn:'Studio–2BR · 457–1,230 sqft · built 2018', type:'apartment', beds:'2BR', score:76, status:'ok', isNew:true, lat:45.5155, lng:-122.6500,
    gradient:'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    rows:[{l:'Natural light',v:'Floor-to-ceiling windows throughout',d:'g'},{l:'Kitchen',v:'Quartz counters · eco-friendly floors',d:'g'},{l:'In-unit W/D',v:'Yes',d:'g'},{l:'2BR',v:'Available · up to 1,230 sqft',d:'g'},{l:'Rooftop',v:'Mt. Hood + river views',d:'g'},{l:'Seismic',v:'Built 2018',d:'g'},{l:'Pets',v:'Yes — pet spa on site',d:'g'},{l:'Amenities',v:'Gym · game room · VR room · firepit',d:'g'}],
    flags:[{t:'Price drops seen recently — check current',c:'fb'}],
    link:'https://www.moderabelmont.com/', note:'One of the strongest "big windows" options on the eastside. Floor-to-ceiling windows, rooftop with Mt. Hood views, Buckman neighborhood. Very well-reviewed management. 2BR up to 1,230 sqft.',
    mgmt:{ name:'Mill Creek Residential', hours:'M–F 10–6 · Sat 10–5 · moderabelmont.com' } },
  { id:'belmontdairy', name:'Belmont Dairy Lofts', addr:'3342 SE Morrison St · Sunnyside', price:'From $1,258', pn:'1–2BR · 1,004–1,486 sqft · income-qualified', type:'apartment', beds:'2BR', score:48, status:'ok', isNew:true, lat:45.5180, lng:-122.6390,
    gradient:'linear-gradient(135deg, #d4a373 0%, #a0522d 100%)',
    rows:[{l:'Natural light',v:'22-ft ceilings · oversized skylights',d:'g'},{l:'Kitchen',v:'Stainless steel appliances',d:'y'},{l:'In-unit W/D',v:'No — on-site shared laundry',d:'r'},{l:'2BR',v:'Yes · 1,004–1,486 sqft',d:'g'},{l:'Flooring',v:'Hardwood',d:'g'},{l:'Seismic',v:'Historic conversion',d:'y'},{l:'Pets',v:'Dogs allowed (45lb max)',d:'y'}],
    flags:[{t:'⚠ Income-qualified housing — must verify eligibility',c:'fr'},{t:'Mixed reviews — management complaints',c:'fr'},{t:'No in-unit laundry',c:'fr'}],
    link:'https://www.belmontdairy.com/', note:'Stunning 22-foot ceilings and skylights in a converted dairy building. BUT: affordable housing with income caps — you must qualify. Also shared laundry only and management reviews are very mixed. Verify income eligibility before getting attached.',
    mgmt:{ name:'Cirrus Asset Management', hours:'Contact via belmontdairy.com' } },
  { id:'park19', name:'Park 19', addr:'550 NW 19th Ave · Alphabet District', price:'2BR from $2,512', pn:'Studio–2BR · 529–1,168 sqft · managed by Greystar', type:'apartment', beds:'2BR', score:65, status:'ok', isNew:true, lat:45.5270, lng:-122.6928,
    gradient:'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    rows:[{l:'Natural light',v:'Large windows · park views',d:'g'},{l:'Kitchen',v:'Modern finishes — confirm details',d:'y'},{l:'In-unit W/D',v:'Confirm — not listed explicitly',d:'y'},{l:'2BR',v:'Yes · up to 1,168 sqft',d:'g'},{l:'Area',v:'Alphabet District · NW Portland',d:'g'},{l:'Management',v:'Greystar · excellent reviews',d:'g'},{l:'Walk',v:'Couch Park · Washington Park · Pearl',d:'g'},{l:'Seismic',v:'Established building',d:'y'}],
    flags:[{t:'2BR above $2k budget',c:'fa'},{t:'NW Portland — not eastside',c:'fb'}],
    link:'https://www.livepark19.com/', note:'Exceptionally well-reviewed building — residents stay for years. Overlooks Couch Park, walkable to Washington Park and Forest Park. Alphabet District is charming but less "cool eastside" than your other picks. Worth a tour if NW vibe works for you.',
    mgmt:{ name:'Greystar', hours:'Contact via livepark19.com or greystar.com' } },
  { id:'everettstlofts', name:'Everett Street Lofts', addr:'2821 NE Everett St · Kerns', price:'$1,225–$1,450', pn:'Studio–1BR · in-unit W/D · built 2016', type:'apartment', beds:'1BR', score:78, status:'ok', isNew:true, lat:45.5266, lng:-122.6355,
    gradient:'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
    rows:[{l:'Layout',v:'Split-level loft units available',d:'g'},{l:'Natural light',v:'Energy-efficient windows',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless appliances',d:'g'},{l:'In-unit W/D',v:'Yes · full-size',d:'g'},{l:'Flooring',v:'Hardwood-style throughout',d:'g'},{l:'2BR',v:'Studio + 1BR only',d:'y'},{l:'Area',v:'Kerns · Walk 97 · Bike 99',d:'g'},{l:'Pets',v:'Yes · dog wash on site',d:'g'}],
    flags:[{t:'Split-level units confirmed per Reddit',c:'fb'},{t:'No 2BR — studio/1BR only',c:'fb'}],
    link:'https://www.portland-apartment-living.com/communities/everett-street-lofts/', note:'Kerns neighborhood, same area as AOE. Reddit confirmed split-level units exist here. Great price, in-unit W/D, hardwood-style floors. Studio/1BR only — but if layout is the priority, worth a tour. Walk Score 97, Bike Score 99.',
    mgmt:{ name:'Portland Apartment Living', phone:'(503) 726-7220 ext 1', hours:'Contact via portland-apartment-living.com' } },
  { id:'asalofts', name:'ASA Flats + Lofts', addr:'1200 NW Marshall St · Pearl District', price:'$1,346–$2,853', pn:'Studio–2BR · 15+ split-level units', type:'apartment', beds:'2BR', score:70, status:'ok', isNew:true, lat:45.5289, lng:-122.6832,
    gradient:'linear-gradient(135deg, #232526 0%, #414345 100%)',
    rows:[{l:'Layout',v:'15–20 split-level mezzanine units',d:'g'},{l:'Natural light',v:'Floor-to-ceiling windows · city views',d:'g'},{l:'Kitchen',v:'Quartz counters · stainless',d:'g'},{l:'In-unit W/D',v:'Confirm — not listed explicitly',d:'y'},{l:'2BR',v:'Yes · up to $2,853',d:'g'},{l:'Rooftop',v:'16th floor deck · fire pit · mountain views',d:'g'},{l:'Area',v:'Pearl District · streetcar at door',d:'g'},{l:'Pets',v:'Yes · 75lb max',d:'g'}],
    flags:[{t:'15–20 split-level units confirmed per Reddit',c:'fb'},{t:'Pearl District — higher price tier',c:'fa'},{t:'Confirm in-unit W/D before touring',c:'fa'}],
    link:'https://www.liveatasa.com/asa-flats-lofts-portland-or/', note:'Largest inventory of literal split-level loft units in Portland per the thread. Pearl District is more corporate-feeling than eastside but the building is well-appointed and the loft units are the real thing. Ask specifically for the mezzanine floor plans when you call.',
    mgmt:{ name:'ASA Flats Leasing', phone:'(503) 755-9217', hours:'M–F 9:30–6 · Sat 9–6 · Sun 11–4' } },
  { id:'buckmancourt', name:'Buckman Court', addr:'1955 SE Morrison St · Buckman', price:'$1,250–$1,395', pn:'Studio–2BR + 6 townhomes · built 1970', type:'apartment', beds:'2BR', score:71, status:'ok', isNew:true, lat:45.5188, lng:-122.6452,
    gradient:'linear-gradient(135deg, #5C258D 0%, #4389A2 100%)',
    rows:[{l:'Layout',v:'6 two-story townhomes — likely split-level',d:'g'},{l:'Natural light',v:'Energy-efficient windows',d:'g'},{l:'Kitchen',v:'Black appliances · confirm details',d:'y'},{l:'In-unit W/D',v:'No — shared on-site laundry',d:'r'},{l:'2BR',v:'Yes · townhomes are 2BR',d:'g'},{l:'Pets',v:'No pets allowed',d:'r'},{l:'Area',v:'Heart of Buckman · SE Morrison',d:'g'},{l:'Price',v:'Best-value 2BR on the list',d:'g'}],
    flags:[{t:'Ask specifically for 2BR townhome units',c:'fb'},{t:'No pets allowed',c:'fr'},{t:'No in-unit laundry',c:'fr'}],
    link:'https://www.portland-apartment-living.com/communities/buckman-court/', note:'59-unit building with 6 two-story townhomes that are almost certainly the split-level layout you want. Best price on the list for a 2BR. Heart of Buckman neighborhood. Hard no on pets and no in-unit laundry are the main drawbacks — call 503-726-7220 ext 1 and ask specifically about the townhome units and whether stairs lead to a lofted bedroom.',
    mgmt:{ name:'Portland Apartment Living', phone:'(503) 726-7220 ext 1', hours:'Contact via portland-apartment-living.com' } },
  { id:'revere', name:'Revere', addr:'3309 N Mississippi Ave · Boise/Mississippi', price:'$1,356–$2,464+', pn:'Studio–2BR · 570–1,097 sqft · built 2019', type:'apartment', beds:'2BR', score:67, status:'ok', isNew:true, lat:45.5476, lng:-122.6741,
    gradient:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    rows:[{l:'Layout',v:'Ground-floor split-level 1BR units',d:'g'},{l:'Natural light',v:'Confirm per unit type',d:'y'},{l:'Kitchen',v:'Stainless appliances · gas stove',d:'g'},{l:'In-unit W/D',v:'Yes — confirmed',d:'g'},{l:'2BR',v:'Yes · from $2,464',d:'y'},{l:'Amenities',v:'Bouldering wall · sauna · rooftop',d:'g'},{l:'Area',v:'N Mississippi Ave corridor',d:'g'},{l:'Pets',v:'Yes · no weight limit · $45/mo',d:'g'}],
    flags:[{t:'Split-level units are ground floor 1BR only',c:'fb'},{t:'Car break-ins reported — street parking',c:'fr'},{t:'N Portland — further from SE/NE cluster',c:'fa'}],
    link:'https://www.reverepdx.com/', note:'Mississippi Ave is a fantastic neighborhood — best food/drink strip in N Portland. Bouldering wall on-site is a rare amenity. The split-level units are specifically ground-floor 1BRs per the Reddit thread, and a former resident mentioned street crime (bike stolen, car broken into). Ask specifically about which units have the lofted layout. 2BR from $2,464 is above budget. Up to 6 weeks free.',
    mgmt:{ name:'Avenue5 Residential', phone:'(503) 227-2787', email:'revere@avenue5apt.com', hours:'M–F 9–6 · Sat 10–5' } },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIEWS = [
  { key:'all',       label:'All',        path:'/apartments' },
  { key:'map',       label:'Map',        path:'/apartments/map' },
  { key:'loft',      label:'Loft layout', path:'/apartments/loft' },
  { key:'2br',       label:'2BR',        path:'/apartments/2br' },
  { key:'favorited', label:'Favorited',   path:'/apartments/favorited' },
  { key:'apartment', label:'Apartments', path:'/apartments/apartment' },
  { key:'cohousing', label:'Cohousing',  path:'/apartments/cohousing' },
  { key:'archived',  label:'Archived',   path:'/apartments/archived' },
]

const CUSTOM_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
  'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
]

const scColor = (s: number) => s >= 70 ? '#16a34a' : s >= 55 ? '#d97706' : '#dc2626'
const dotColor = (d: string) => d === 'g' ? '#16a34a' : d === 'y' ? '#d97706' : d === 'r' ? '#dc2626' : '#d1d5db'
const contactColors = { none: 'transparent', out: '#3b82f6', scheduled: '#f59e0b', toured: '#16a34a' }
const flagBg = (c: string) => c === 'fr' ? '#fef2f2' : c === 'fa' ? '#fffbeb' : '#eff6ff'
const flagText = (c: string) => c === 'fr' ? '#b91c1c' : c === 'fa' ? '#b45309' : '#1d4ed8'

// ─── Card Photo ───────────────────────────────────────────────────────────────

function CardPhoto({ listing, photo, isArchived, onUpload }: {
  listing: Listing; photo: string; isArchived: boolean
  onUpload: (id: string, url: string) => void
}) {
  const [hov, setHov] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { if (typeof r.result === 'string') onUpload(listing.id, r.result) }
    r.readAsDataURL(f); e.target.value = ''
  }
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:'relative', height:148, borderRadius:'12px 12px 0 0', overflow:'hidden', flexShrink:0, cursor:'pointer' }}
      onClick={() => ref.current?.click()}>
      {photo
        ? <img src={photo} alt={listing.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter: isArchived ? 'grayscale(70%)' : 'none' }} />
        : <div style={{ width:'100%', height:'100%', background: listing.gradient, opacity: isArchived ? 0.5 : 1 }} />
      }
      {/* Score badge */}
      {listing.score > 0 && (
        <div style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', borderRadius:99, padding:'3px 9px', display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: scColor(listing.score), boxShadow:`0 0 6px ${scColor(listing.score)}` }} />
          <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'#fff', letterSpacing:'0.02em' }}>{listing.score}</span>
        </div>
      )}
      {/* Photo overlay */}
      <div style={{ position:'absolute', inset:0, background: hov ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)', transition:'background 0.18s', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {hov && <span style={{ color:'rgba(255,255,255,0.9)', fontSize:11, fontFamily:'monospace', letterSpacing:'0.06em' }}>{photo ? '↑ replace photo' : '↑ add photo'}</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ listing, isFav, isArchived, isTopPick, note, photo, contact,
  onToggleFav, onToggleArchive, onNoteChange, onPhotoUpload, onContactUpdate, onEdit,
  isDragging, isOver }:
  { listing: Listing; isFav: boolean; isArchived: boolean; isTopPick: boolean
    note: string; photo: string; contact: ContactEntry
    onToggleFav:(id:string)=>void; onToggleArchive:(id:string)=>void
    onNoteChange:(id:string,v:string)=>void; onPhotoUpload:(id:string,url:string)=>void
    onContactUpdate:(id:string,e:ContactEntry)=>void; onEdit?:()=>void
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

  const contactStripeColor = contactColors[contact.status]
  const topRows = listing.rows.slice(0, 4)

  const cardStyle: React.CSSProperties = {
    background: isArchived ? '#f9f9f8' : '#fff',
    border: isTopPick ? '1.5px solid #16a34a' : isOver ? '1.5px solid #7c3aed' : '1px solid #e8e8e5',
    borderRadius: 12,
    boxShadow: isDragging ? 'none' : isOver ? '0 0 0 3px #7c3aed30, 0 8px 24px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
    opacity: isDragging ? 0.35 : isArchived ? 0.7 : 1,
    transform: isOver ? 'scale(1.01)' : 'none',
    transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
    overflow: 'hidden', display:'flex', flexDirection:'column',
  }

  return (
    <div style={cardStyle}>
      {!flipped && <CardPhoto listing={listing} photo={photo} isArchived={isArchived} onUpload={onPhotoUpload} />}

      {/* Contact progress stripe */}
      {contactStripeColor !== 'transparent' && !flipped && (
        <div style={{ height:3, background: contactStripeColor, flexShrink:0 }} />
      )}

      <div style={{ position:'relative', flex:1 }}>
        <div style={{ transition:'transform 0.38s cubic-bezier(0.4,0,0.2,1)', transformStyle:'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height:'100%' }}>

          {/* ── FRONT ────────────────────────────── */}
          <div style={{ backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', padding:'14px 16px 14px', display:'flex', flexDirection:'column', gap:0 }}>

            {/* Type + beds tags */}
            <div style={{ display:'flex', gap:5, marginBottom:10, flexWrap:'wrap' }}>
              {isTopPick && <Tag label="★ top pick" bg="#dcfce7" col="#15803d" />}
              {listing.type === 'cohousing' && <Tag label="cohousing" bg="#f5f3ff" col="#6d28d9" />}
              {listing.beds && listing.beds !== 'Unknown' && <Tag label={listing.beds} bg="#f3f4f6" col="#374151" />}
              {isFav && !isTopPick && <Tag label="★" bg="#fefce8" col="#a16207" />}
              {contact.status === 'out' && <Tag label="reached out" bg="#eff6ff" col="#1d4ed8" />}
              {contact.status === 'scheduled' && <Tag label="tour set" bg="#fef9c3" col="#854d0e" />}
              {contact.status === 'toured' && <Tag label="✓ toured" bg="#dcfce7" col="#15803d" />}
              {listing.isCustom && <Tag label="custom" bg="#fdf4ff" col="#a21caf" />}
            </div>

            {/* Name */}
            <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600, color: isArchived ? '#9ca3af' : '#111111', lineHeight:1.2, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {listing.name}
            </div>

            {/* Address */}
            <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:10, letterSpacing:'0.02em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {listing.addr}
            </div>

            {/* Price */}
            <div style={{ fontSize:19, fontWeight:500, color:'#111111', marginBottom:12, letterSpacing:'-0.01em' }}>
              {listing.price}
              {listing.pn && <span style={{ fontSize:11, color:'#9ca3af', fontWeight:400, marginLeft:6 }}>{listing.pn}</span>}
            </div>

            {/* Attribute grid */}
            {topRows.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 8px', marginBottom:12 }}>
                {topRows.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:7, background: r.d === 'g' ? '#f0fdf4' : r.d === 'r' ? '#fef2f2' : '#fafaf9', border:`1px solid ${r.d === 'g' ? '#bbf7d0' : r.d === 'r' ? '#fecaca' : '#e8e8e5'}` }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background: dotColor(r.d), flexShrink:0 }} />
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <div style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.2 }}>{r.l}</div>
                      <div style={{ fontSize:10, color:'#374151', fontWeight:500, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.v}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Flags — max 2 */}
            {listing.flags.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                {listing.flags.slice(0, 2).map((f, i) => (
                  <span key={i} style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background: flagBg(f.c), color: flagText(f.c) }}>{f.t}</span>
                ))}
                {listing.flags.length > 2 && (
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#f3f4f6', color:'#9ca3af' }}>+{listing.flags.length - 2}</span>
                )}
              </div>
            )}

            {note && (
              <div style={{ fontSize:10, color:'#7c3aed', fontFamily:'monospace', marginBottom:8 }}>✏ notes added</div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #f0f0ee', marginTop:'auto' }}>
              <a href={listing.link} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', textDecoration:'none', letterSpacing:'0.04em' }}>
                listing →
              </a>
              <div style={{ display:'flex', gap:2 }}>
                <IconBtn title="Notes & contact" onClick={() => setFlipped(true)}>✏</IconBtn>
                <IconBtn title={isFav ? 'Unfavorite' : 'Favorite'} onClick={() => onToggleFav(listing.id)}
                  style={{ color: isFav ? '#eab308' : '#d1d5db' }}>★</IconBtn>
                <IconBtn title={isArchived ? 'Unarchive' : 'Archive'} onClick={() => onToggleArchive(listing.id)}
                  style={{ color: isArchived ? '#dc2626' : '#d1d5db', fontSize:13 }}>
                  {isArchived ? '↺' : '✕'}
                </IconBtn>
              </div>
            </div>
          </div>

          {/* ── BACK ─────────────────────────────── */}
          <div style={{ backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', position:'absolute', inset:0, transform:'rotateY(180deg)', display:'flex', flexDirection:'column', padding:16, background: isArchived ? '#fff8f8' : '#fff', overflowY:'auto' }}>

            {/* Back header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:14, fontWeight:600, color:'#111111' }}>{listing.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginTop:1 }}>{listing.addr}</div>
              </div>
              <button onClick={() => setFlipped(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:16, padding:'4px 6px', borderRadius:6 }}>←</button>
            </div>

            {/* Management contact */}
            {listing.mgmt && (
              <div style={{ background:'#f9f9f8', borderRadius:10, padding:'11px 13px', marginBottom:12, border:'1px solid #e8e8e5' }}>
                {listing.mgmt.name && <div style={{ fontSize:11, fontWeight:600, color:'#374151', marginBottom:6 }}>{listing.mgmt.name}</div>}
                {listing.mgmt.phone && (
                  <a href={`tel:${listing.mgmt.phone.replace(/\D/g,'')}`}
                    style={{ display:'block', fontSize:15, color:'#16a34a', fontWeight:600, textDecoration:'none', marginBottom:3, letterSpacing:'-0.01em' }}>
                    {listing.mgmt.phone}
                  </a>
                )}
                {listing.mgmt.email && (
                  <a href={`mailto:${listing.mgmt.email}`}
                    style={{ display:'block', fontSize:11, color:'#2563eb', textDecoration:'none', marginBottom:4 }}>
                    {listing.mgmt.email}
                  </a>
                )}
                {listing.mgmt.hours && <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>{listing.mgmt.hours}</div>}
                <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #e8e8e5' }}>
                  <a href={listing.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:10, fontFamily:'monospace', color:'#16a34a', textDecoration:'none' }}>view listing →</a>
                </div>
              </div>
            )}

            {/* Contact status */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:6 }}>Status</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {([
                  { s:'none', label:'Not contacted', bg:'#f3f4f6', col:'#9ca3af' },
                  { s:'out',  label:'📞 Reached out', bg:'#eff6ff', col:'#1d4ed8' },
                  { s:'scheduled', label:'📅 Tour set',  bg:'#fef9c3', col:'#854d0e' },
                  { s:'toured',    label:'✓ Toured',     bg:'#dcfce7', col:'#15803d' },
                ] as { s: ContactEntry['status']; label:string; bg:string; col:string }[]).map(opt => (
                  <button key={opt.s}
                    onClick={() => onContactUpdate(listing.id, { status: opt.s, date: opt.s !== 'none' ? new Date().toLocaleDateString() : undefined })}
                    style={{ fontFamily:'monospace', fontSize:9, padding:'4px 8px', borderRadius:99, border:'1px solid', cursor:'pointer',
                      background: contact.status === opt.s ? opt.bg : '#fff',
                      color: contact.status === opt.s ? opt.col : '#9ca3af',
                      borderColor: contact.status === opt.s ? opt.col : '#e5e5e5',
                      fontWeight: contact.status === opt.s ? 600 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color: isArchived ? '#dc2626' : '#9ca3af', marginBottom:5 }}>
              {isArchived ? 'Why ruled out' : 'Notes (shared with Reese)'}
            </div>
            <textarea value={local} onChange={e => handleNote(e.target.value)}
              placeholder="pros, cons, questions to ask on tour…"
              style={{ flex:1, minHeight:90, fontSize:12, color:'#374151', background: isArchived ? '#fff1f1' : '#f9f9f8', border:`1px solid ${isArchived ? '#fecaca' : '#e8e8e5'}`, borderRadius:8, padding:10, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.6 }}
            />

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af' }}>auto-saves</span>
                {listing.isCustom && onEdit && (
                  <button onClick={onEdit} style={{ fontFamily:'monospace', fontSize:9, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', padding:0 }}>edit listing ✏</button>
                )}
              </div>
              <button onClick={() => setFlipped(false)} style={{ fontFamily:'monospace', fontSize:10, color:'#16a34a', background:'none', border:'none', cursor:'pointer' }}>done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tag({ label, bg, col }: { label:string; bg:string; col:string }) {
  return <span style={{ fontFamily:'monospace', fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.04em', background:bg, color:col }}>{label}</span>
}

function IconBtn({ title, onClick, style: s, children }: { title?:string; onClick:()=>void; style?:React.CSSProperties; children?:React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, lineHeight:1, padding:'5px 6px', borderRadius:6, color:'#9ca3af', transition:'color 0.1s', ...s }}>
      {children}
    </button>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface FormState {
  name: string; addr: string; price: string; link: string
  type: 'apartment'|'cohousing'; beds: string; score: number; note: string
  lat: string; lng: string
  mgmtName: string; mgmtPhone: string; mgmtEmail: string; mgmtHours: string
  wd: 'yes'|'no'|'unknown'; twobrm: 'yes'|'no'|'unknown'; loft: 'yes'|'no'|'unknown'
  light: 'yes'|'no'|'unknown'; pets: 'yes'|'no'|'unknown'
}

const emptyForm = (): FormState => ({
  name:'', addr:'', price:'', link:'', type:'apartment', beds:'', score:65, note:'',
  lat:'', lng:'', mgmtName:'', mgmtPhone:'', mgmtEmail:'', mgmtHours:'',
  wd:'unknown', twobrm:'unknown', loft:'unknown', light:'unknown', pets:'unknown',
})

function formToListing(f: FormState, existingId?: string, existingGradient?: string): Listing {
  const toD = (v: string): 'g'|'y'|'r' => v === 'yes' ? 'g' : v === 'no' ? 'r' : 'y'
  const rows: Row[] = [
    f.wd !== 'unknown' || true ? { l:'In-unit W/D', v: f.wd === 'yes' ? 'Yes' : f.wd === 'no' ? 'No' : 'Unknown — ask', d: toD(f.wd) } : null,
    f.loft !== 'unknown' || true ? { l:'Layout', v: f.loft === 'yes' ? 'Split-level / loft stairs' : f.loft === 'no' ? 'Standard' : 'Unknown — ask', d: toD(f.loft) } : null,
    f.light !== 'unknown' || true ? { l:'Natural light', v: f.light === 'yes' ? 'Good' : f.light === 'no' ? 'Poor' : 'Unknown — ask', d: toD(f.light) } : null,
    f.twobrm !== 'unknown' || true ? { l:'2BR', v: f.twobrm === 'yes' ? 'Available' : f.twobrm === 'no' ? 'Not available' : 'Unknown — ask', d: toD(f.twobrm) } : null,
    f.pets !== 'unknown' || true ? { l:'Pets', v: f.pets === 'yes' ? 'Yes' : f.pets === 'no' ? 'No' : 'Unknown — ask', d: toD(f.pets) } : null,
  ].filter(Boolean) as Row[]
  return {
    id: existingId || `custom_${Date.now()}`,
    name: f.name || 'Untitled listing',
    addr: f.addr,
    price: f.price,
    pn: f.beds,
    type: f.type,
    beds: f.beds || 'Unknown',
    score: f.score,
    status: 'ok',
    isNew: true,
    lat: parseFloat(f.lat) || 45.523,
    lng: parseFloat(f.lng) || -122.676,
    gradient: existingGradient || CUSTOM_GRADIENTS[Math.floor(Math.random() * CUSTOM_GRADIENTS.length)],
    rows,
    flags: [],
    link: f.link,
    note: f.note,
    mgmt: (f.mgmtName || f.mgmtPhone || f.mgmtEmail) ? {
      name: f.mgmtName || undefined, phone: f.mgmtPhone || undefined,
      email: f.mgmtEmail || undefined, hours: f.mgmtHours || undefined,
    } : undefined,
    isCustom: true,
  }
}

function listingToForm(l: Listing): FormState {
  const get = (label: string) => l.rows.find(r => r.l === label)
  const toV = (row: Row|undefined): 'yes'|'no'|'unknown' => row?.d === 'g' ? 'yes' : row?.d === 'r' ? 'no' : 'unknown'
  return {
    name: l.name, addr: l.addr, price: l.price, link: l.link,
    type: l.type, beds: l.pn || l.beds, score: l.score, note: l.note,
    lat: String(l.lat), lng: String(l.lng),
    mgmtName: l.mgmt?.name || '', mgmtPhone: l.mgmt?.phone || '',
    mgmtEmail: l.mgmt?.email || '', mgmtHours: l.mgmt?.hours || '',
    wd: toV(get('In-unit W/D')), twobrm: toV(get('2BR')), loft: toV(get('Layout')),
    light: toV(get('Natural light')), pets: toV(get('Pets')),
  }
}

function AddEditModal({ listing, onSave, onDelete, onClose }: {
  listing?: Listing; onSave: (l: Listing) => void; onDelete?: () => void; onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(listing ? listingToForm(listing) : emptyForm())
  const set = (k: keyof FormState, v: string|number) => setForm(p => ({ ...p, [k]: v }))

  const triToggle = (k: keyof FormState) => {
    const cycle: Record<string,string> = { unknown:'yes', yes:'no', no:'unknown' }
    set(k, cycle[form[k] as string] || 'unknown')
  }
  const triLabel = (v: string) => v === 'yes' ? '✓ Yes' : v === 'no' ? '✗ No' : '? Unknown'
  const triStyle = (v: string): React.CSSProperties => ({
    padding:'5px 12px', borderRadius:8, fontSize:11, fontFamily:'monospace', fontWeight:600, cursor:'pointer', border:'1px solid',
    background: v === 'yes' ? '#f0fdf4' : v === 'no' ? '#fef2f2' : '#f9f9f8',
    color: v === 'yes' ? '#15803d' : v === 'no' ? '#b91c1c' : '#6b7280',
    borderColor: v === 'yes' ? '#bbf7d0' : v === 'no' ? '#fecaca' : '#e5e5e5',
  })

  function handleSave() {
    if (!form.name.trim()) return
    onSave(formToListing(form, listing?.id, listing?.gradient))
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:'16px 16px 0 0', width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', padding:'24px 24px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:'#111', margin:0 }}>
            {listing ? 'Edit listing' : 'Add listing'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>✕</button>
        </div>

        {/* Basic info */}
        <Section label="Basic info">
          <Row2>
            <Field label="Name *" value={form.name} onChange={v => set('name', v)} placeholder="Apartment name" />
            <Field label="Address" value={form.addr} onChange={v => set('addr', v)} placeholder="123 SE Burnside · Kerns" />
          </Row2>
          <Row2>
            <Field label="Price" value={form.price} onChange={v => set('price', v)} placeholder="From $1,800" />
            <Field label="Beds / size" value={form.beds} onChange={v => set('beds', v)} placeholder="2BR · 900 sqft" />
          </Row2>
          <Field label="Website / listing URL" value={form.link} onChange={v => set('link', v)} placeholder="https://..." />
          <Row2>
            <div>
              <FieldLabel>Type</FieldLabel>
              <div style={{ display:'flex', gap:6 }}>
                {(['apartment','cohousing'] as const).map(t => (
                  <button key={t} onClick={() => set('type', t)}
                    style={{ ...triStyle(form.type === t ? 'yes' : 'unknown'), fontFamily:'monospace', fontSize:11 }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Fit score (0–100)</FieldLabel>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="range" min={0} max={100} value={form.score} onChange={e => set('score', Number(e.target.value))} style={{ flex:1 }} />
                <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:600, color: scColor(form.score), width:28 }}>{form.score}</span>
              </div>
            </div>
          </Row2>
        </Section>

        {/* Key attributes */}
        <Section label="Key attributes">
          {([
            ['wd', 'In-unit W/D'],['loft', 'Loft / split-level'],
            ['light', 'Natural light'],['twobrm', '2BR available'],['pets', 'Pets allowed'],
          ] as [keyof FormState, string][]).map(([k, label]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'#374151' }}>{label}</span>
              <button onClick={() => triToggle(k)} style={triStyle(form[k] as string)}>{triLabel(form[k] as string)}</button>
            </div>
          ))}
        </Section>

        {/* Management */}
        <Section label="Management contact">
          <Row2>
            <Field label="Company / manager" value={form.mgmtName} onChange={v => set('mgmtName', v)} placeholder="Property Management Co." />
            <Field label="Phone" value={form.mgmtPhone} onChange={v => set('mgmtPhone', v)} placeholder="(503) 555-0100" />
          </Row2>
          <Row2>
            <Field label="Email" value={form.mgmtEmail} onChange={v => set('mgmtEmail', v)} placeholder="leasing@..." />
            <Field label="Hours" value={form.mgmtHours} onChange={v => set('mgmtHours', v)} placeholder="M–F 10–6" />
          </Row2>
        </Section>

        {/* Map coords */}
        <Section label="Map pin (optional)">
          <Row2>
            <Field label="Latitude" value={form.lat} onChange={v => set('lat', v)} placeholder="45.523" />
            <Field label="Longitude" value={form.lng} onChange={v => set('lng', v)} placeholder="-122.676" />
          </Row2>
        </Section>

        {/* Notes */}
        <Section label="Notes">
          <textarea value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="Why are you interested? What to ask on tour? Key flags…"
            style={{ width:'100%', minHeight:80, fontSize:12, color:'#374151', background:'#f9f9f8', border:'1px solid #e5e5e5', borderRadius:8, padding:10, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }} />
        </Section>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, paddingTop:4 }}>
          <button onClick={handleSave}
            style={{ flex:1, padding:'11px 0', background:'#111111', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {listing ? 'Save changes' : 'Add listing'}
          </button>
          <button onClick={onClose}
            style={{ padding:'11px 20px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          {listing && onDelete && (
            <button onClick={() => { onDelete(); onClose() }}
              style={{ padding:'11px 14px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label:string; children?:React.ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:10 }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{children}</div>
    </div>
  )
}
function Row2({ children }: { children?:React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>{children}</div>
}
function FieldLabel({ children }: { children?:React.ReactNode }) {
  return <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>{children}</div>
}
function KanbanGroup({ label, count, empty, children }: { label:string; count:number; empty:string; children?:React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e5e5', borderRadius:7, fontSize:12, color:'#111', background:'#fafaf9', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
    </div>
  )
}

// ─── Map View ─────────────────────────────────────────────────────────────────

function MapView({ listings, favorites, archived, topPickId, notes }: {
  listings: Listing[]; favorites: string[]; archived: string[]; topPickId: string | null; notes: Record<string,string>
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = () => initMap()
    document.head.appendChild(script)
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }
  }, [])
  useEffect(() => { if (leafletMap.current) renderMarkers() }, [favorites, archived, topPickId])

  function initMap() {
    const L = (window as any).L; if (!mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView([45.528, -122.654], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution:'© OpenStreetMap contributors © CARTO', maxZoom:19 }).addTo(map)
    leafletMap.current = map; renderMarkers()
  }

  function renderMarkers() {
    const L = (window as any).L; const map = leafletMap.current; if (!L || !map) return
    map.eachLayer((layer: any) => { if (layer.options?.isAptMarker) map.removeLayer(layer) })
    listings.filter(l => !archived.includes(l.id)).forEach(l => {
      const isFav = favorites.includes(l.id), isTop = l.id === topPickId
      const hasNote = !!(notes[l.id]?.trim())
      const color = isTop ? '#16a34a' : isFav ? '#eab308' : hasNote ? '#d97706' : '#6b7280'
      const size = isTop ? 18 : isFav ? 15 : 12
      const icon = L.divIcon({
        html: `<div style="width:${size*2}px;height:${size*2}px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:${size*.7}px;color:white;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer">${isTop?'★':isFav?'♥':''}</div>`,
        className:'', iconSize:[size*2,size*2], iconAnchor:[size,size], popupAnchor:[0,-size-4],
      })
      const popup = `<div style="font-family:'Helvetica Neue',sans-serif;min-width:190px;max-width:250px"><div style="font-size:13px;font-weight:600;color:#111;margin-bottom:2px">${l.name}</div><div style="font-size:10px;color:#9ca3af;margin-bottom:7px">${l.addr}</div><div style="font-size:14px;font-weight:500;color:#111;margin-bottom:5px">${l.price}</div>${notes[l.id]?`<div style="font-size:11px;color:#7c3aed">${notes[l.id].slice(0,70)}…</div>`:''}<a href="${l.link}" target="_blank" style="font-size:10px;color:#16a34a;text-decoration:none;font-family:monospace">listing →</a></div>`
      const marker = L.marker([l.lat, l.lng], { icon, isAptMarker:true }).addTo(map)
      marker.bindPopup(popup, { maxWidth:270, className:'apt-popup' })
    })
  }

  const vis = listings.filter(l => !archived.includes(l.id)).length
  const favCount = listings.filter(l => favorites.includes(l.id) && !archived.includes(l.id)).length
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 108px)', minHeight:500 }}>
      <div style={{ padding:'8px 24px', background:'#fff', borderBottom:'1px solid #e8e8e5', display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
        {[{color:'#16a34a',label:'Top pick',size:18},{color:'#eab308',label:'Favorited',size:15},{color:'#d97706',label:'Has notes',size:12},{color:'#6b7280',label:'New',size:12}].map(item=>(
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:item.size, height:item.size, borderRadius:'50%', background:item.color, border:'2px solid white', boxShadow:'0 1px 4px rgba(0,0,0,.2)', flexShrink:0 }} />
            <span style={{ fontFamily:'monospace', fontSize:10, color:'#6b7280' }}>{item.label}</span>
          </div>
        ))}
        <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:10, color:'#9ca3af' }}>{vis} shown · {favCount} favorited</span>
      </div>
      <div ref={mapRef} style={{ flex:1 }} />
      <style>{`.apt-popup .leaflet-popup-content-wrapper{border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:0}.apt-popup .leaflet-popup-content{margin:12px 14px}.apt-popup .leaflet-popup-tip-container{margin-top:-1px}`}</style>
    </div>
  )
}

// ─── Kanban Group ─────────────────────────────────────────────────────────────

function KanbanGroup({ label, count, empty, children }: { label:string; count:number; empty:string; children:React.ReactNode[] }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <span style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600, color:'#111' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', background:'#f3f4f6', padding:'2px 8px', borderRadius:99 }}>{count}</span>
        <div style={{ flex:1, height:1, background:'#e8e8e5' }} />
      </div>
      {count === 0
        ? <div style={{ fontFamily:'Georgia,serif', fontSize:15, fontStyle:'italic', color:'#d1d5db', padding:'12px 0' }}>{empty}</div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14 }}>{children}</div>
      }
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: SharedState = { favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{}, customListings:[] }

export default function ApartmentsPage() {
  const params = useParams()
  const router = useRouter()
  const currentView = (params?.view as string[])?.[0] ?? 'all'

  const [state, setState] = useState<SharedState>(DEFAULT_STATE)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date|null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const pendingSave = useRef(false)
  const pendingSaveTimeout = useRef<ReturnType<typeof setTimeout>|null>(null)
  const stateRef = useRef<SharedState>(DEFAULT_STATE)
  const dragId = useRef<string|null>(null)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overId, setOverId] = useState<string|null>(null)
  const [editingListing, setEditingListing] = useState<Listing|null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { loadState(); const iv = setInterval(loadState, 8000); return () => clearInterval(iv) }, [])

  function setPending(val: boolean) {
    pendingSave.current = val
    if (pendingSaveTimeout.current) clearTimeout(pendingSaveTimeout.current)
    if (val) pendingSaveTimeout.current = setTimeout(() => { pendingSave.current = false }, 10000)
  }

  async function loadState(force = false) {
    if (!force && pendingSave.current) return
    try {
      const { data, error } = await supabase.from('apartment_state').select('data').eq('key','shared').single()
      if (error) { setSyncError(true); return }
      if (data?.data) {
        const merged: SharedState = { ...DEFAULT_STATE, ...(data.data as SharedState) }
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
        if (error) { setSyncError(true) } else { setLastSynced(new Date()); setSyncError(false) }
      } catch { setSyncError(true) }
      finally { setSyncing(false); setPending(false) }
    }, 600)
  }, [])

  function updatePhoto(id: string, dataUrl: string) {
    setState(prev => { const next = { ...prev, photos:{ ...prev.photos, [id]:dataUrl } }; stateRef.current = next; return next })
    setPending(true); setSyncing(true)
    const toSave = { ...stateRef.current, photos:{ ...stateRef.current.photos, [id]:dataUrl } }
    stateRef.current = toSave
    supabase.from('apartment_state').upsert({ key:'shared', data:toSave, updated_at:new Date().toISOString() })
      .then(({ error }) => { if (error) setSyncError(true); else { setLastSynced(new Date()); setSyncError(false) } })
      .catch(() => setSyncError(true))
      .finally(() => { setSyncing(false); setPending(false) })
  }

  const toggleFav = (id: string) => setState(prev => {
    const has = prev.favorites.includes(id)
    const favorites = has ? prev.favorites.filter(f=>f!==id) : [...prev.favorites, id]
    const favoriteOrder = has ? prev.favoriteOrder.filter(f=>f!==id) : [...prev.favoriteOrder, id]
    const next = { ...prev, favorites, favoriteOrder }; persist(next); return next
  })
  const updateNote = (id: string, v: string) => setState(prev => { const next = { ...prev, notes:{ ...prev.notes, [id]:v } }; persist(next); return next })
  const updateContact = (id: string, e: ContactEntry) => setState(prev => { const next = { ...prev, contacts:{ ...(prev.contacts||{}), [id]:e } }; persist(next); return next })
  const toggleArchive = (id: string) => setState(prev => {
    const has = (prev.archived||[]).includes(id)
    const archived = has ? prev.archived.filter(a=>a!==id) : [...(prev.archived||[]), id]
    const favorites = has ? prev.favorites : prev.favorites.filter(f=>f!==id)
    const favoriteOrder = has ? prev.favoriteOrder : prev.favoriteOrder.filter(f=>f!==id)
    const next = { ...prev, archived, favorites, favoriteOrder }; persist(next); return next
  })

  const saveCustom = (l: Listing) => setState(prev => {
    const existing = (prev.customListings||[]).findIndex(c => c.id === l.id)
    const customListings = existing >= 0
      ? prev.customListings.map((c,i) => i === existing ? l : c)
      : [...(prev.customListings||[]), l]
    const next = { ...prev, customListings }; persist(next); return next
  })
  const deleteCustom = (id: string) => setState(prev => {
    const next = { ...prev, customListings:(prev.customListings||[]).filter(c=>c.id!==id) }; persist(next); return next
  })

  function onDragStart(id: string) { dragId.current = id; setDraggingId(id) }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setOverId(id) }
  function onDrop(targetId: string) {
    if (!dragId.current || dragId.current === targetId) { setDraggingId(null); setOverId(null); return }
    setState(prev => {
      const order = prev.favoriteOrder.length > 0 ? [...prev.favoriteOrder] : [...prev.favorites]
      const from = order.indexOf(dragId.current!), to = order.indexOf(targetId)
      if (from < 0 || to < 0) return prev
      order.splice(from, 1); order.splice(to, 0, dragId.current!)
      const next = { ...prev, favoriteOrder:order, favorites:order }; persist(next); return next
    })
    dragId.current = null; setDraggingId(null); setOverId(null)
  }
  function onDragEnd() { dragId.current = null; setDraggingId(null); setOverId(null) }

  // All listings (static + custom)
  const allListings = useMemo(() => [...LISTINGS, ...(state.customListings||[])], [state.customListings])
  const LMAP = useMemo(() => Object.fromEntries(allListings.map(l=>[l.id,l])), [allListings])

  const archived = state.archived||[]
  const favOrder = state.favoriteOrder.length > 0 ? state.favoriteOrder : state.favorites
  const topPickId = favOrder[0]||null
  const contacts = state.contacts as Record<string,ContactEntry>

  // Filtering
  const kanbanFav = favOrder.map(id=>LMAP[id]).filter(l=>l&&!archived.includes(l.id))
  const unfav = allListings.filter(l=>!archived.includes(l.id)&&!favOrder.includes(l.id))
  const kanbanConsidering = unfav.filter(l=>!!(state.notes[l.id]?.trim()))
  const kanbanNew = unfav.filter(l=>!state.notes[l.id]?.trim())

  const visibleListings = (() => {
    const view = currentView
    if (view === 'archived') return allListings.filter(l=>archived.includes(l.id))
    if (view === 'favorited') return favOrder.map(id=>LMAP[id]).filter(l=>l&&!archived.includes(l.id))
    if (view === 'all' || view === 'map') return []
    return allListings.filter(l => {
      if (archived.includes(l.id)) return false
      if (view === 'apartment') return l.type === 'apartment'
      if (view === 'cohousing') return l.type === 'cohousing'
      if (view === '2br') return l.beds.includes('2BR') || l.beds.includes('2br')
      if (view === 'loft') return l.rows.some(r => r.l.toLowerCase().includes('layout') && r.d === 'g')
      return true
    })
  })()

  const statsBase = (currentView === 'all' || currentView === 'map')
    ? [...kanbanFav, ...kanbanConsidering, ...kanbanNew]
    : currentView === 'archived' ? allListings.filter(l=>archived.includes(l.id)) : visibleListings
  const avgScore = statsBase.filter(l=>l.score>0).reduce((a,b,_,arr)=>a+b.score/arr.length,0)|0
  const contactedCount = Object.values(contacts||{}).filter(c=>c.status!=='none').length
  const touredCount = Object.values(contacts||{}).filter(c=>c.status==='toured').length

  function renderCard(l: Listing, i: number, draggable = false, showRank = false) {
    return (
      <div key={l.id} draggable={draggable}
        onDragStart={draggable ? () => onDragStart(l.id) : undefined}
        onDragOver={draggable ? (e) => onDragOver(e, l.id) : undefined}
        onDrop={draggable ? () => onDrop(l.id) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        style={{ cursor: draggable ? 'grab' : 'default', animation:`fadeUp 0.22s ease ${i*25}ms both` }}>
        {showRank && (
          <div style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', marginBottom:4, textAlign:'center' }}>#{favOrder.indexOf(l.id)+1}</div>
        )}
        <Card listing={l} isFav={state.favorites.includes(l.id)} isArchived={archived.includes(l.id)}
          isTopPick={l.id===topPickId} note={state.notes[l.id]||''} photo={(state.photos||{})[l.id]||''}
          contact={(contacts||{})[l.id]||{status:'none'}}
          onToggleFav={toggleFav} onToggleArchive={toggleArchive} onNoteChange={updateNote}
          onPhotoUpload={updatePhoto} onContactUpdate={updateContact}
          onEdit={l.isCustom ? () => setEditingListing(l) : undefined}
          isDragging={draggingId===l.id} isOver={overId===l.id&&draggingId!==l.id}
        />
      </div>
    )
  }

  const isAllView = currentView === 'all'
  const isMapView = currentView === 'map'
  const isFavView = currentView === 'favorited'
  const isArchiveView = currentView === 'archived'

  return (
    <div style={{ background:'#F5F4F1', minHeight:'100vh', fontFamily:"'Helvetica Neue', Arial, sans-serif" }}>

      {/* Header */}
      <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid #e8e8e5' }}>
        <div style={{ padding:'12px 24px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:14 }}>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', color:'#9ca3af', marginBottom:2 }}>Portland · June 2026</div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:400, fontFamily:'Georgia,serif', color:'#111' }}>
              Marvin & Reese&rsquo;s <em style={{ fontStyle:'italic', color:'#16a34a' }}>Housing Shortlist</em>
            </h1>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:18, alignItems:'baseline' }}>
            {[
              { n: statsBase.length, l:'listings' },
              { n: avgScore, l:'avg score' },
              { n: state.favorites.length, l:'starred' },
              { n: contactedCount, l:'contacted' },
              { n: touredCount, l:'toured' },
            ].map(s => (
              <div key={s.l} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                <span style={{ fontFamily:'Georgia,serif', fontSize:18, lineHeight:1, color:'#111' }}>{s.n||'—'}</span>
                <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* Sync */}
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {syncError && (
              <button onClick={() => loadState(true)}
                style={{ fontFamily:'monospace', fontSize:9, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', padding:'3px 9px' }}>
                ⚠ retry sync
              </button>
            )}
            {syncing ? <span style={{ fontFamily:'monospace', fontSize:9, color:'#7c3aed' }}>saving…</span>
              : lastSynced && !syncError && <span style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af' }}>{lastSynced.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
            <div style={{ width:6, height:6, borderRadius:'50%', background: syncError ? '#dc2626' : syncing ? '#7c3aed' : '#16a34a' }} />
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ padding:'0 24px 0', display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
          {VIEWS.map(v => {
            const active = currentView === v.key
            const isArchive = v.key === 'archived'
            return (
              <button key={v.key} onClick={() => router.push(v.path)}
                style={{ fontFamily:'monospace', fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase',
                  padding:'9px 14px', border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.12s', background:'transparent',
                  color: active ? (isArchive ? '#dc2626' : '#111111') : '#9ca3af',
                  borderBottom: active ? `2px solid ${isArchive ? '#dc2626' : '#111111'}` : '2px solid transparent',
                  marginBottom:-1,
                }}>
                {v.label}{v.key==='archived'&&archived.length>0?` (${archived.length})`:''}
                {v.key==='favorited'&&state.favorites.length>0?` (${state.favorites.length})`:''}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      {isMapView && (
        <MapView listings={allListings} favorites={state.favorites} archived={archived} topPickId={topPickId} notes={state.notes} />
      )}

      {isAllView && (
        <div style={{ padding:'24px 24px 80px', display:'flex', flexDirection:'column', gap:44 }}>
          <KanbanGroup label="Favorited" count={kanbanFav.length} empty="Star listings to add them here">
            {kanbanFav.map((l,i) => renderCard(l, i, true, true))}
          </KanbanGroup>
          <KanbanGroup label="Considering" count={kanbanConsidering.length} empty="Listings you've added notes to will appear here">
            {kanbanConsidering.map((l,i) => renderCard(l, i))}
          </KanbanGroup>
          <KanbanGroup label="Not yet reviewed" count={kanbanNew.length} empty="You've reviewed everything!">
            {kanbanNew.map((l,i) => renderCard(l, i))}
          </KanbanGroup>
        </div>
      )}

      {!isAllView && !isMapView && (
        <div style={{ padding:'20px 24px 80px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14 }}>
          {visibleListings.map((l,i) => renderCard(l, i, isFavView, isFavView))}
          {visibleListings.length === 0 && (
            <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', fontFamily:'Georgia,serif', fontSize:20, fontStyle:'italic', color:'#9ca3af' }}>
              {isArchiveView ? 'Nothing archived yet.' : isFavView ? 'No favorites yet — star some listings.' : 'No listings match this filter.'}
            </div>
          )}
        </div>
      )}

      {/* Add listing FAB */}
      {!isMapView && (
        <button onClick={() => setShowAddModal(true)}
          style={{ position:'fixed', bottom:28, right:28, width:52, height:52, borderRadius:'50%', background:'#111111', color:'#fff', border:'none', fontSize:22, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.22)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, transition:'transform 0.15s, box-shadow 0.15s' }}
          title="Add a listing">
          +
        </button>
      )}

      {/* Add / Edit modal */}
      {(showAddModal || editingListing) && (
        <AddEditModal
          listing={editingListing||undefined}
          onSave={saveCustom}
          onDelete={editingListing ? () => deleteCustom(editingListing.id) : undefined}
          onClose={() => { setShowAddModal(false); setEditingListing(null) }}
        />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        textarea:focus, input:focus { border-color: #a5b4fc !important; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  )
}
