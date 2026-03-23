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
  lat: number; lng: number
  mgmt?: { name?: string; phone?: string; email?: string; hours?: string }
}
interface ContactEntry { status: 'none'|'out'|'scheduled'|'toured'; date?: string }
interface SharedState {
  favorites: string[]
  notes: Record<string, string>
  favoriteOrder: string[]
  archived: string[]
  photos: Record<string, string>
  contacts: Record<string, ContactEntry>
}

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

const LMAP = Object.fromEntries(LISTINGS.map(l => [l.id, l]))

const FILTERS = [
  { key:'all', label:'All' },
  { key:'map', label:'🗺 Map' },
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
function Card({ listing, isFav, isArchived, isTopPick, note, photo, contact, onToggleFav, onToggleArchive, onNoteChange, onPhotoUpload, onContactUpdate, isDragging, isOver }:
  { listing: Listing; isFav: boolean; isArchived: boolean; isTopPick: boolean; note: string; photo: string
    contact: ContactEntry
    onToggleFav: (id:string)=>void; onToggleArchive: (id:string)=>void
    onNoteChange:(id:string,v:string)=>void; onPhotoUpload:(id:string,url:string)=>void
    onContactUpdate:(id:string,entry:ContactEntry)=>void
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
              {contact.status === 'out' && <Badge label="📞 reached out" color="#eff6ff" text="#1d4ed8" />}
              {contact.status === 'scheduled' && <Badge label="📅 tour scheduled" color="#fef9c3" text="#854d0e" />}
              {contact.status === 'toured' && <Badge label="✓ toured" color="#dcfce7" text="#15803d" />}
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
            {/* Contact info */}
            {listing.mgmt && (
              <div style={{ marginBottom:12, padding:10, background:'#f8f7f5', borderRadius:8, border:'1px solid #e5e7eb' }}>
                <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:6 }}>Management contact</div>
                {listing.mgmt.name && <div style={{ fontSize:12, fontWeight:600, color:'#111827', marginBottom:4 }}>{listing.mgmt.name}</div>}
                {listing.mgmt.phone && (
                  <a href={`tel:${listing.mgmt.phone.replace(/\D/g,'')}`} style={{ display:'block', fontSize:13, color:'#16a34a', textDecoration:'none', fontWeight:500, marginBottom:2 }}>
                    📞 {listing.mgmt.phone}
                  </a>
                )}
                {listing.mgmt.email && (
                  <a href={`mailto:${listing.mgmt.email}`} style={{ display:'block', fontSize:12, color:'#1d4ed8', textDecoration:'none', marginBottom:2 }}>
                    ✉ {listing.mgmt.email}
                  </a>
                )}
                {listing.mgmt.hours && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{listing.mgmt.hours}</div>}
                <a href={listing.link} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-block', marginTop:6, fontFamily:'monospace', fontSize:10, color:'#7c3aed', textDecoration:'none' }}>
                  View listing →
                </a>
              </div>
            )}
            <textarea
              value={local}
              onChange={e => handleNote(e.target.value)}
              placeholder="Leave notes for each other… pros, cons, questions to ask…"
              style={{ flex:1, width:'100%', minHeight:100, fontSize:13, color:'#374151', background: isArchived ? '#fff1f1' : '#f9fafb', border:`1px solid ${isArchived ? '#fca5a5' : '#e5e7eb'}`, borderRadius:10, padding:12, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.55 }}
            />
            {/* Contact tracker */}
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #f3f4f6' }}>
              <div style={{ fontFamily:'monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:6 }}>Contact status</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {([
                  { s:'none',     label:'Not contacted', bg:'#f3f4f6', col:'#9ca3af' },
                  { s:'out',      label:'📞 Reached out', bg:'#eff6ff', col:'#1d4ed8' },
                  { s:'scheduled',label:'📅 Tour scheduled', bg:'#fef9c3', col:'#854d0e' },
                  { s:'toured',   label:'✓ Toured',       bg:'#dcfce7', col:'#15803d' },
                ] as { s: ContactEntry['status']; label:string; bg:string; col:string }[]).map(opt => (
                  <button key={opt.s} onClick={() => onContactUpdate(listing.id, { status: opt.s, date: opt.s !== 'none' ? new Date().toLocaleDateString() : undefined })}
                    style={{ fontFamily:'monospace', fontSize:9, padding:'4px 9px', borderRadius:99, border:'1px solid', cursor:'pointer', letterSpacing:'0.03em',
                      background: contact.status === opt.s ? opt.bg : '#ffffff',
                      color: contact.status === opt.s ? opt.col : '#9ca3af',
                      borderColor: contact.status === opt.s ? opt.col : '#e5e7eb',
                      fontWeight: contact.status === opt.s ? 600 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {contact.date && contact.status !== 'none' && (
                <div style={{ fontFamily:'monospace', fontSize:9, color:'#9ca3af', marginTop:5 }}>updated {contact.date}</div>
              )}
            </div>
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

// ── Map View ──────────────────────────────────────────────────────────────────
function MapView({ listings, favorites, archived, topPickId, notes }: {
  listings: Listing[]; favorites: string[]; archived: string[]; topPickId: string | null; notes: Record<string,string>
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS dynamically
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }
  }, [])

  // Re-render markers when state changes
  useEffect(() => {
    if (leafletMap.current) renderMarkers()
  }, [favorites, archived, topPickId])

  function initMap() {
    const L = (window as any).L
    if (!mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView([45.528, -122.654], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map)
    leafletMap.current = map
    renderMarkers()
  }

  function renderMarkers() {
    const L = (window as any).L
    const map = leafletMap.current
    if (!L || !map) return

    // Clear existing markers
    map.eachLayer((layer: any) => { if (layer.options?.isAptMarker) map.removeLayer(layer) })

    listings.filter(l => !archived.includes(l.id)).forEach(l => {
      const isFav = favorites.includes(l.id)
      const isTop = l.id === topPickId
      const hasNote = !!(notes[l.id]?.trim())

      const color = isTop ? '#16a34a' : isFav ? '#eab308' : hasNote ? '#d97706' : '#6b7280'
      const size = isTop ? 18 : isFav ? 15 : 12
      const ring = isFav ? `box-shadow: 0 0 0 3px ${color}40, 0 2px 8px rgba(0,0,0,0.25);` : 'box-shadow: 0 1px 4px rgba(0,0,0,0.3);'
      const label = isTop ? '★' : isFav ? '♥' : ''

      const icon = L.divIcon({
        html: `<div style="
          width:${size * 2}px; height:${size * 2}px; border-radius:50%;
          background:${color}; border: 2.5px solid white;
          display:flex; align-items:center; justify-content:center;
          font-size:${size * 0.7}px; color:white; font-weight:700;
          ${ring} cursor:pointer; transition:transform 0.15s;
        ">${label}</div>`,
        className: '',
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
        popupAnchor: [0, -size - 4],
      })

      const popupContent = `
        <div style="font-family: 'Helvetica Neue', sans-serif; min-width: 200px; max-width: 260px;">
          <div style="font-size:13px; font-weight:600; color:#111827; margin-bottom:3px;">${l.name}</div>
          <div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">${l.addr}</div>
          <div style="font-size:14px; color:#111827; font-weight:500; margin-bottom:6px;">${l.price}</div>
          ${isFav ? `<div style="font-size:10px; background:#fefce8; color:#a16207; padding:2px 8px; border-radius:99px; display:inline-block; margin-bottom:6px;">★ Favorited</div>` : ''}
          ${isTop ? `<div style="font-size:10px; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:99px; display:inline-block; margin-bottom:6px;">★ Top pick</div>` : ''}
          ${notes[l.id] ? `<div style="font-size:11px; color:#7c3aed; margin-bottom:6px;">✏ ${notes[l.id].slice(0, 80)}${notes[l.id].length > 80 ? '…' : ''}</div>` : ''}
          <a href="${l.link}" target="_blank" style="font-size:11px; color:#16a34a; text-decoration:none; font-family:monospace;">View listing →</a>
        </div>
      `

      const marker = L.marker([l.lat, l.lng], { icon, isAptMarker: true }).addTo(map)
      marker.bindPopup(popupContent, { maxWidth: 280, className: 'apt-popup' })
    })
  }

  const visibleCount = listings.filter(l => !archived.includes(l.id)).length
  const favCount = listings.filter(l => favorites.includes(l.id) && !archived.includes(l.id)).length

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', minHeight:500 }}>
      {/* Legend */}
      <div style={{ padding:'10px 28px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
        {[
          { color:'#16a34a', label:'Top pick (★)', size:18 },
          { color:'#eab308', label:'Favorited (♥)', size:15 },
          { color:'#d97706', label:'Has notes', size:12 },
          { color:'#6b7280', label:'New / considering', size:12 },
        ].map(item => (
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:item.size, height:item.size, borderRadius:'50%', background:item.color, border:'2px solid white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', flexShrink:0 }} />
            <span style={{ fontFamily:'monospace', fontSize:11, color:'#6b7280' }}>{item.label}</span>
          </div>
        ))}
        <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:11, color:'#9ca3af' }}>
          {visibleCount} shown · {favCount} favorited
        </span>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ flex:1 }} />

      <style>{`
        .apt-popup .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 0; }
        .apt-popup .leaflet-popup-content { margin: 14px 16px; }
        .apt-popup .leaflet-popup-tip-container { margin-top: -1px; }
      `}</style>
    </div>
  )
}

// ── Kanban group ──────────────────────────────────────────────────────────────
function KanbanGroup({ label, sublabel, empty, accentColor, children }: {
  label: string; sublabel: string; empty: string; accentColor: string; children: React.ReactNode[]
}) {
  const hasChildren = children.length > 0
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:3, height:18, borderRadius:99, background:accentColor, flexShrink:0 }} />
        <span style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:'#111827' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', letterSpacing:'0.08em' }}>{sublabel}</span>
        <div style={{ flex:1, height:1, background:'#e5e7eb' }} />
      </div>
      {!hasChildren ? (
        <div style={{ fontFamily:'Georgia,serif', fontSize:15, fontStyle:'italic', color:'#d1d5db', padding:'20px 0' }}>
          {empty}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(296px, 1fr))', gap:16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ApartmentsPage() {
  const [filter, setFilter] = useState('all')
  const [state, setState] = useState<SharedState>({ favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{} })
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date|null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const pendingSave = useRef(false)   // true while a debounced save is queued or in-flight
  const stateRef = useRef<SharedState>({ favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{} })

  const dragId = useRef<string|null>(null)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overId, setOverId] = useState<string|null>(null)

  useEffect(() => {
    loadState()
    const iv = setInterval(loadState, 8000)
    return () => clearInterval(iv)
  }, [])

  async function loadState() {
    // Never overwrite local state while a save is pending — we'd lose unsaved changes
    if (pendingSave.current) return
    const { data, error } = await supabase.from('apartment_state').select('data').eq('key','shared').single()
    if (!error && data?.data) {
      const merged: SharedState = { favorites:[], notes:{}, favoriteOrder:[], archived:[], photos:{}, contacts:{}, ...(data.data as SharedState) }
      stateRef.current = merged
      setState(merged)
      setLastSynced(new Date())
    }
  }

  const persist = useCallback((next: SharedState) => {
    stateRef.current = next   // always keep ref current so save uses latest state
    pendingSave.current = true
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      await supabase.from('apartment_state').upsert({ key:'shared', data:stateRef.current, updated_at:new Date().toISOString() })
      setSyncing(false)
      setLastSynced(new Date())
      pendingSave.current = false
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
    setState(prev => {
      const next = { ...prev, photos:{ ...prev.photos, [id]:dataUrl } }
      stateRef.current = next
      // Photos are large — save immediately, don't debounce
      pendingSave.current = true
      setSyncing(true)
      supabase.from('apartment_state').upsert({ key:'shared', data:next, updated_at:new Date().toISOString() })
        .then(() => { setSyncing(false); setLastSynced(new Date()); pendingSave.current = false })
      return next
    })
  }

  function updateContact(id: string, entry: ContactEntry) {
    setState(prev => { const next = { ...prev, contacts:{ ...(prev.contacts||{}), [id]:entry } }; persist(next); return next })
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
  const isMapView = filter === 'map'
  const topPickId = favOrder[0] || null

  // Kanban groups (only used in All view)
  const kanbanFavorited = favOrder.map(id => LMAP[id]).filter(l => l && !archived.includes(l.id))
  const unfavorited = LISTINGS.filter(l => !archived.includes(l.id) && !favOrder.includes(l.id))
  const kanbanConsidering = unfavorited.filter(l => !!(state.notes[l.id]?.trim()))
  const kanbanNew = unfavorited.filter(l => !state.notes[l.id]?.trim())

  const visibleListings = (() => {
    if (isArchiveView) return LISTINGS.filter(l => archived.includes(l.id))
    if (isFavView) return favOrder.map(id => LMAP[id]).filter(l => l && !archived.includes(l.id))
    if (isAllView || isMapView) return [] // handled separately
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

  const allForStats = (isAllView || isMapView)
    ? [...kanbanFavorited, ...kanbanConsidering, ...kanbanNew]
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
          contact={(state.contacts || {})[l.id] || { status: 'none' }}
          onToggleFav={toggleFav}
          onToggleArchive={toggleArchive}
          onNoteChange={updateNote}
          onPhotoUpload={updatePhoto}
          onContactUpdate={updateContact}
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
        {[{n:allForStats.length,l:'listings'},{n:avgScore||0,l:'avg fit score'},{n:allForStats.filter(l=>l.beds.includes('2BR')).length,l:'have 2BR'},{n:state.favorites.length,l:'favorited'},{n:Object.values(state.contacts as Record<string,ContactEntry>||{}).filter(c=>c.status!=='none').length,l:'contacted'},{n:Object.values(state.contacts as Record<string,ContactEntry>||{}).filter(c=>c.status==='toured').length,l:'toured'}].map(s=>(
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

      {/* ── MAP VIEW ── */}
      {isMapView && (
        <MapView
          listings={LISTINGS}
          favorites={state.favorites}
          archived={archived}
          topPickId={topPickId}
          notes={state.notes}
        />
      )}

      {/* ── KANBAN (All view) ── */}
      {isAllView && (
        <div style={{ padding:'24px 28px 60px', display:'flex', flexDirection:'column', gap:48 }}>

          {/* Favorited */}
          <KanbanGroup
            label="Favorited"
            sublabel={`${kanbanFavorited.length} · drag to reorder`}
            empty="Star a listing to add it here"
            accentColor="#16a34a"
          >
            {kanbanFavorited.map((l, i) => renderCard(l, i, true, true))}
          </KanbanGroup>

          {/* Considering */}
          <KanbanGroup
            label="Considering"
            sublabel={`${kanbanConsidering.length} listings with notes`}
            empty="Listings you've left notes on will appear here"
            accentColor="#d97706"
          >
            {kanbanConsidering.map((l, i) => renderCard(l, i, false, false))}
          </KanbanGroup>

          {/* New */}
          <KanbanGroup
            label="New"
            sublabel={`${kanbanNew.length} not yet reviewed`}
            empty="Nothing new — you've looked at everything!"
            accentColor="#9ca3af"
          >
            {kanbanNew.map((l, i) => renderCard(l, i, false, false))}
          </KanbanGroup>

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
