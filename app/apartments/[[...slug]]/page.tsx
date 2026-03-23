'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrynqscwtctqbasivcvb.supabase.co'
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeW5xc2N3dGN0cWJhc2l2Y3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MDU3MywiZXhwIjoyMDU2MTY2NTczfQ.c2nnOxrj98uIGzAHBFodsEh6VWlWavjgM75WGYBgcYA'
const supabase = createClient(SUPA_URL, SUPA_KEY)

interface Row  { l: string; v: string; d: 'g'|'y'|'r'|'_' }
interface Flag { t: string; c: 'fr'|'fa'|'fb' }
interface Mgmt { name?: string; phone?: string; email?: string; hours?: string }
interface Listing {
  id: string; name: string; addr: string; price: string; pn: string
  type: 'apartment'|'cohousing'; beds: string; score: number
  status: 'top'|'ok'|'dead'; isNew: boolean
  rows: Row[]; flags: Flag[]; link: string; note: string
  gradient: string; lat: number; lng: number; mgmt?: Mgmt
}
interface ContactEntry { status: 'none'|'out'|'scheduled'|'toured'; date?: string }
// State = lightweight: no photos blobs, no full listing data. Just IDs and short strings.
interface SharedState {
  favorites: string[]; notes: Record<string,string>
  favoriteOrder: string[]; archived: string[]
  photoUrls: Record<string,string>  // Storage public URLs ~100 chars each
  contacts: Record<string,ContactEntry>
}

async function compressToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 900
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim/width, maxDim/height)
        width = Math.round(width*r); height = Math.round(height*r)
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.7)
    }
    img.onerror = reject; img.src = dataUrl
  })
}

const scoreColor = (s: number) => s>=70?'#16a34a':s>=55?'#d97706':'#dc2626'
const dotBg = (d: string) => d==='g'?'#16a34a':d==='y'?'#d97706':d==='r'?'#dc2626':'#d1d5db'

function getChips(l: Listing) {
  const chips: {label:string;color:string;bg:string}[] = []
  if (l.rows.find(r=>r.l==='Layout')) chips.push({label:'\u2B06 loft',color:'#7c3aed',bg:'#f5f3ff'})
  const wd = l.rows.find(r=>r.l==='In-unit W/D')
  if (wd) chips.push({
    label: wd.d==='g'?'W/D \u2713':wd.d==='r'?'no W/D':'W/D?',
    color: wd.d==='g'?'#15803d':wd.d==='r'?'#b91c1c':'#b45309',
    bg: wd.d==='g'?'#dcfce7':wd.d==='r'?'#fef2f2':'#fffbeb',
  })
  if (l.beds) chips.push({label:l.beds,color:'#1d4ed8',bg:'#eff6ff'})
  return chips.slice(0,3)
}

const CONTACT_OPTS: {s:ContactEntry['status'];label:string;color:string;bg:string}[] = [
  {s:'none',label:'Not contacted',color:'#9ca3af',bg:'#f3f4f6'},
  {s:'out',label:'Reached out',color:'#1d4ed8',bg:'#eff6ff'},
  {s:'scheduled',label:'Tour scheduled',color:'#854d0e',bg:'#fef9c3'},
  {s:'toured',label:'Toured',color:'#15803d',bg:'#dcfce7'},
]

const VIEWS = [
  {key:'all',slug:'',label:'All'},
  {key:'map',slug:'map',label:'Map'},
  {key:'favorites',slug:'favorites',label:'Favorites'},
  {key:'loft',slug:'loft',label:'Loft layout'},
  {key:'2br',slug:'2br',label:'2BR'},
  {key:'cohousing',slug:'cohousing',label:'Cohousing'},
  {key:'new',slug:'new',label:'New'},
  {key:'archived',slug:'archived',label:'Archived'},
]

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#2d1b69,#11998e)',
  'linear-gradient(135deg,#1a1a2e,#0f3460)',
  'linear-gradient(135deg,#0f2027,#2c5364)',
  'linear-gradient(135deg,#d4a373,#a0522d)',
  'linear-gradient(135deg,#56ab2f,#a8e063)',
]

// ===================== CARD =====================
function Card({l,isFav,isTop,isArchived,note,photoUrl,contact,rank,onFav,onArchive,onNote,onPhoto,onContact,isDragging,isOver,onEdit}:{
  l:Listing;isFav:boolean;isTop:boolean;isArchived:boolean;note:string;photoUrl:string
  contact:ContactEntry;rank?:number;onFav:(id:string)=>void;onArchive:(id:string)=>void
  onNote:(id:string,v:string)=>void;onPhoto:(id:string,file:File)=>void
  onContact:(id:string,e:ContactEntry)=>void;isDragging?:boolean;isOver?:boolean;onEdit:(l:Listing)=>void
}) {
  const [expanded,setExpanded] = useState(isArchived)
  const [localNote,setLocalNote] = useState(note)
  const [imgHover,setImgHover] = useState(false)
  const [uploading,setUploading] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(()=>{if(!expanded)setLocalNote(note)},[note,expanded])
  function handleNote(v:string){setLocalNote(v);if(noteTimer.current)clearTimeout(noteTimer.current);noteTimer.current=setTimeout(()=>onNote(l.id,v),800)}
  function handleFile(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;setUploading(true);onPhoto(l.id,file);e.target.value='';setTimeout(()=>setUploading(false),3000)}
  const copt=CONTACT_OPTS.find(o=>o.s===contact.status)||CONTACT_OPTS[0]
  const chips=getChips(l)
  return (
    <div style={{background:'#fff',borderRadius:16,border:isTop?'1.5px solid #16a34a':isArchived?'1px solid #e5e7eb':'1px solid #ebebeb',boxShadow:isOver?'0 0 0 2px #7c3aed,0 8px 32px rgba(0,0,0,.1)':'0 1px 4px rgba(0,0,0,.07)',opacity:isDragging?.4:isArchived?.7:1,transform:isOver?'scale(1.02)':'none',transition:'box-shadow .15s,transform .15s',overflow:'hidden'}}>
      <div style={{position:'relative',height:160,overflow:'hidden',cursor:'pointer'}} onMouseEnter={()=>setImgHover(true)} onMouseLeave={()=>setImgHover(false)} onClick={()=>fileRef.current?.click()}>
        {photoUrl?<img src={photoUrl} alt={l.name} style={{width:'100%',height:'100%',objectFit:'cover',filter:isArchived?'grayscale(50%)':'none'}}/>:<div style={{width:'100%',height:'100%',background:l.gradient}}/>}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 55%)',pointerEvents:'none'}}/>
        {isTop&&<div style={{position:'absolute',top:10,left:10,background:'#16a34a',color:'#fff',fontSize:10,fontFamily:'monospace',padding:'3px 8px',borderRadius:99}}>TOP PICK</div>}
        {rank&&!isTop&&<div style={{position:'absolute',top:10,left:10,background:'rgba(0,0,0,.45)',color:'#fff',fontSize:10,fontFamily:'monospace',padding:'3px 8px',borderRadius:99}}>#{rank}</div>}
        {l.isNew&&!isTop&&!rank&&<div style={{position:'absolute',top:10,left:10,background:'rgba(255,255,255,.15)',backdropFilter:'blur(6px)',color:'#fff',fontSize:9,fontFamily:'monospace',padding:'2px 7px',borderRadius:99}}>NEW</div>}
        <div style={{position:'absolute',bottom:10,left:14,right:10}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,color:'#fff',lineHeight:1.2,textShadow:'0 1px 3px rgba(0,0,0,.4)'}}>{l.name}</div>
        </div>
        {(imgHover||uploading)&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'#fff',fontSize:11,fontFamily:'monospace'}}>{uploading?'uploading...':`${photoUrl?'replace':'add'} photo`}</div>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}}/>
      </div>
      <div style={{padding:'12px 14px 0'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8,marginBottom:2}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:18,color:'#111827',fontWeight:500}}>{l.price}</div>
          {l.score>0&&<div style={{fontFamily:'monospace',fontSize:10,color:scoreColor(l.score),fontWeight:600}}>{l.score}</div>}
        </div>
        <div style={{fontFamily:'monospace',fontSize:10,color:'#9ca3af',marginBottom:10}}>{l.addr}</div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
          {chips.map((c,i)=><span key={i} style={{fontSize:10,fontFamily:'monospace',padding:'3px 8px',borderRadius:99,background:c.bg,color:c.color,fontWeight:500}}>{c.label}</span>)}
          {contact.status!=='none'&&<span style={{fontSize:10,fontFamily:'monospace',padding:'3px 8px',borderRadius:99,background:copt.bg,color:copt.color,fontWeight:500}}>{copt.label}</span>}
        </div>
        {note&&!expanded&&<div style={{fontSize:11,color:'#7c3aed',fontFamily:'monospace',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{note}</div>}
      </div>
      <div style={{padding:'10px 14px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid #f5f5f5'}}>
        <div style={{display:'flex',alignItems:'center',gap:2}}>
          <button onClick={()=>onFav(l.id)} style={{fontSize:18,background:'none',border:'none',cursor:'pointer',color:isFav?'#eab308':'#d1d5db',padding:'2px 4px',lineHeight:1}}>&#9733;</button>
          <a href={l.link} target="_blank" rel="noopener noreferrer" style={{fontFamily:'monospace',fontSize:10,color:'#9ca3af',textDecoration:'none',padding:'2px 6px'}}>&#x2197;</a>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:2}}>
          <button onClick={()=>onEdit(l)} style={{fontFamily:'monospace',fontSize:10,color:'#9ca3af',background:'none',border:'none',cursor:'pointer',padding:'3px 6px'}}>edit</button>
          <button onClick={()=>setExpanded(e=>!e)} style={{fontFamily:'monospace',fontSize:10,color:expanded?'#111827':note?'#7c3aed':'#9ca3af',background:expanded?'#f3f4f6':'none',border:'none',cursor:'pointer',padding:'3px 8px',borderRadius:6}}>{expanded?'close':note?'notes':'notes'}</button>
          <button onClick={()=>onArchive(l.id)} style={{fontFamily:'monospace',fontSize:10,color:isArchived?'#ef4444':'#9ca3af',background:isArchived?'#fff1f1':'none',border:'1px solid',borderColor:isArchived?'#fca5a5':'transparent',cursor:'pointer',padding:'3px 8px',borderRadius:6}}>{isArchived?'restore':'x'}</button>
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:'1px solid #f0f0f0',padding:14,background:isArchived?'#fffafa':'#fafafa'}}>
          {l.mgmt&&(l.mgmt.phone||l.mgmt.email||l.mgmt.name)&&(
            <div style={{marginBottom:14,padding:'10px 12px',background:'#fff',borderRadius:10,border:'1px solid #ebebeb'}}>
              {l.mgmt.name&&<div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:5}}>{l.mgmt.name}</div>}
              {l.mgmt.phone&&<a href={`tel:${l.mgmt.phone.replace(/\D/g,'')}`} style={{display:'block',fontSize:13,color:'#16a34a',fontWeight:600,textDecoration:'none',marginBottom:3}}>{l.mgmt.phone}</a>}
              {l.mgmt.email&&<a href={`mailto:${l.mgmt.email}`} style={{display:'block',fontSize:11,color:'#1d4ed8',textDecoration:'none',marginBottom:3}}>{l.mgmt.email}</a>}
              {l.mgmt.hours&&<div style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace'}}>{l.mgmt.hours}</div>}
            </div>
          )}
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>
            {CONTACT_OPTS.map(opt=>(
              <button key={opt.s} onClick={()=>onContact(l.id,{status:opt.s,date:opt.s!=='none'?new Date().toLocaleDateString():undefined})}
                style={{fontSize:10,fontFamily:'monospace',padding:'4px 9px',borderRadius:99,border:'1px solid',cursor:'pointer',background:contact.status===opt.s?opt.bg:'#fff',color:contact.status===opt.s?opt.color:'#9ca3af',borderColor:contact.status===opt.s?opt.color:'#e5e7eb',fontWeight:contact.status===opt.s?600:400}}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',color:isArchived?'#ef4444':'#9ca3af',marginBottom:5}}>{isArchived?'Ruled out':'Notes (synced)'}</div>
          <textarea value={localNote} onChange={e=>handleNote(e.target.value)} placeholder="Pros, cons, questions to ask..."
            style={{width:'100%',minHeight:90,fontSize:12,color:'#374151',background:isArchived?'#fff5f5':'#fff',border:`1px solid ${isArchived?'#fecaca':'#e5e7eb'}`,borderRadius:8,padding:'10px 12px',resize:'none',outline:'none',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box' as const}}/>
          {l.flags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:10}}>{l.flags.map((f,i)=><span key={i} style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:f.c==='fr'?'#fef2f2':f.c==='fa'?'#fffbeb':'#eff6ff',color:f.c==='fr'?'#b91c1c':f.c==='fa'?'#b45309':'#1d4ed8',border:`1px solid ${f.c==='fr'?'#fecaca':f.c==='fa'?'#fde68a':'#bfdbfe'}`}}>{f.t}</span>)}</div>}
          {l.rows.length>0&&<div style={{marginTop:12,borderTop:'1px solid #f0f0f0',paddingTop:10}}>{l.rows.map((r,i)=><div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 0',gap:8}}><span style={{fontSize:11,color:'#9ca3af',minWidth:90,flexShrink:0}}>{r.l}</span><span style={{fontSize:11,color:'#374151',fontWeight:500,flex:1,textAlign:'right'}}>{r.v}</span><div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:dotBg(r.d)}}/></div>)}</div>}
        </div>
      )}
    </div>
  )
}

// ===================== MODAL =====================
interface MF{name:string;addr:string;price:string;pn:string;beds:string;type:'apartment'|'cohousing';score:string;link:string;note:string;gradient:string;mgmtName:string;mgmtPhone:string;mgmtEmail:string;mgmtHours:string;lat:string;lng:string;flagsText:string}
const emptyMF=():MF=>({name:'',addr:'',price:'',pn:'',beds:'',type:'apartment',score:'',link:'',note:'',gradient:GRADIENTS[0],mgmtName:'',mgmtPhone:'',mgmtEmail:'',mgmtHours:'',lat:'',lng:'',flagsText:''})
const toMF=(l:Listing):MF=>({name:l.name,addr:l.addr,price:l.price,pn:l.pn,beds:l.beds,type:l.type,score:String(l.score||''),link:l.link,note:l.note,gradient:l.gradient,mgmtName:l.mgmt?.name||'',mgmtPhone:l.mgmt?.phone||'',mgmtEmail:l.mgmt?.email||'',mgmtHours:l.mgmt?.hours||'',lat:String(l.lat||''),lng:String(l.lng||''),flagsText:l.flags.map(f=>`${f.c}:${f.t}`).join('\n')})
const fromMF=(f:MF,id?:string):Listing=>({id:id||`listing_${Date.now()}`,name:f.name.trim(),addr:f.addr.trim(),price:f.price,pn:f.pn,beds:f.beds,type:f.type,score:parseInt(f.score)||0,status:'ok',isNew:true,rows:[],flags:f.flagsText.split('\n').filter(Boolean).map(line=>{const[c,...rest]=line.split(':');return{c:(['fr','fa','fb'].includes(c)?c:'fb') as 'fr'|'fa'|'fb',t:rest.join(':').trim()}}),link:f.link,note:f.note,gradient:f.gradient,lat:parseFloat(f.lat)||45.5231,lng:parseFloat(f.lng)||-122.6765,mgmt:(f.mgmtName||f.mgmtPhone||f.mgmtEmail)?{name:f.mgmtName||undefined,phone:f.mgmtPhone||undefined,email:f.mgmtEmail||undefined,hours:f.mgmtHours||undefined}:undefined})

function Modal({initial,onSave,onDelete,onClose}:{initial?:Listing;onSave:(l:Listing)=>void;onDelete?:()=>void;onClose:()=>void}){
  const [f,setF]=useState<MF>(()=>initial?toMF(initial):emptyMF())
  const s=(k:keyof MF,v:string)=>setF(p=>({...p,[k]:v}))
  const inp:React.CSSProperties={width:'100%',fontSize:13,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,outline:'none',fontFamily:'inherit',color:'#111827',background:'#fff',boxSizing:'border-box' as const}
  const lbl:React.CSSProperties={fontSize:10,fontFamily:'monospace',color:'#9ca3af',textTransform:'uppercase' as const,letterSpacing:'0.1em',display:'block',marginBottom:4}
  return(
    <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',padding:'24px 24px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:20}}>{initial?'Edit listing':'Add listing'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,color:'#9ca3af',cursor:'pointer'}}>x</button>
        </div>
        <div style={{marginBottom:18}}>
          <label style={lbl}>Card color</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{GRADIENTS.map(g=><div key={g} onClick={()=>s('gradient',g)} style={{width:32,height:32,borderRadius:8,background:g,cursor:'pointer',border:f.gradient===g?'2.5px solid #111827':'2.5px solid transparent'}}/>)}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><label style={lbl}>Name *</label><input style={inp} value={f.name} onChange={e=>s('name',e.target.value)} placeholder="Anthem PDX"/></div>
          <div><label style={lbl}>Address *</label><input style={inp} value={f.addr} onChange={e=>s('addr',e.target.value)} placeholder="123 NE Burnside - Kerns"/></div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}><label style={lbl}>Price</label><input style={inp} value={f.price} onChange={e=>s('price',e.target.value)} placeholder="From $1,800"/></div>
            <div style={{flex:1}}><label style={lbl}>Details</label><input style={inp} value={f.pn} onChange={e=>s('pn',e.target.value)} placeholder="2BR built 2020"/></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}><label style={lbl}>Type</label><select style={inp} value={f.type} onChange={e=>s('type',e.target.value as any)}><option value="apartment">Apartment</option><option value="cohousing">Cohousing</option></select></div>
            <div style={{flex:1}}><label style={lbl}>Beds</label><input style={inp} value={f.beds} onChange={e=>s('beds',e.target.value)} placeholder="2BR"/></div>
            <div style={{width:70}}><label style={lbl}>Score</label><input style={inp} value={f.score} onChange={e=>s('score',e.target.value)} placeholder="70" type="number" min="0" max="100"/></div>
          </div>
          <div><label style={lbl}>Listing URL</label><input style={inp} value={f.link} onChange={e=>s('link',e.target.value)} placeholder="https://"/></div>
          <div><label style={lbl}>Notes</label><textarea style={{...inp,minHeight:70,resize:'none'}} value={f.note} onChange={e=>s('note',e.target.value)} placeholder="Key details, questions to ask..."/></div>
          <div>
            <label style={lbl}>Flags (fb:text / fr:text / fa:text, one per line)</label>
            <textarea style={{...inp,minHeight:60,resize:'none',fontFamily:'monospace',fontSize:11}} value={f.flagsText} onChange={e=>s('flagsText',e.target.value)} placeholder={"fb:Split-level confirmed\nfr:No pets\nfa:Confirm W/D"}/>
            <div style={{fontSize:9,color:'#9ca3af',fontFamily:'monospace',marginTop:3}}>fb=blue info  fr=red warning  fa=amber caution</div>
          </div>
          <div style={{borderTop:'1px solid #f0f0f0',paddingTop:4}}><div style={{...lbl,marginBottom:10}}>Management (optional)</div></div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}><label style={lbl}>Company</label><input style={inp} value={f.mgmtName} onChange={e=>s('mgmtName',e.target.value)} placeholder="Greystar"/></div>
            <div style={{flex:1}}><label style={lbl}>Phone</label><input style={inp} value={f.mgmtPhone} onChange={e=>s('mgmtPhone',e.target.value)} placeholder="(503) 555-0100"/></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}><label style={lbl}>Email</label><input style={inp} value={f.mgmtEmail} onChange={e=>s('mgmtEmail',e.target.value)} placeholder="lease@example.com"/></div>
            <div style={{flex:1}}><label style={lbl}>Hours</label><input style={inp} value={f.mgmtHours} onChange={e=>s('mgmtHours',e.target.value)} placeholder="M-F 10-6"/></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1}}><label style={lbl}>Lat (map pin)</label><input style={inp} value={f.lat} onChange={e=>s('lat',e.target.value)} placeholder="45.5231"/></div>
            <div style={{flex:1}}><label style={lbl}>Lng (map pin)</label><input style={inp} value={f.lng} onChange={e=>s('lng',e.target.value)} placeholder="-122.6765"/></div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button onClick={()=>onSave(fromMF(f,initial?.id))} disabled={!f.name.trim()||!f.addr.trim()}
            style={{flex:1,padding:'12px',background:'#111827',color:'#fff',border:'none',borderRadius:10,fontFamily:'Georgia,serif',fontSize:15,cursor:'pointer',opacity:(!f.name.trim()||!f.addr.trim())?.4:1}}>
            {initial?'Save changes':'Add listing'}
          </button>
          {initial&&onDelete&&<button onClick={onDelete} style={{padding:'12px 18px',background:'#fef2f2',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:10,cursor:'pointer',fontFamily:'monospace',fontSize:12}}>Delete</button>}
        </div>
      </div>
    </div>
  )
}

// ===================== MAP =====================
function MapView({listings,favorites,archived,topPickId,notes}:{listings:Listing[];favorites:string[];archived:string[];topPickId:string|null;notes:Record<string,string>}){
  const mapRef=useRef<HTMLDivElement>(null);const leafletMap=useRef<any>(null)
  useEffect(()=>{
    if(!mapRef.current||leafletMap.current)return
    if(!document.getElementById('ljs')){const l=document.createElement('link');l.id='ljs';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l)}
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=()=>init();document.head.appendChild(s)
    return()=>{if(leafletMap.current){leafletMap.current.remove();leafletMap.current=null}}
  },[])
  useEffect(()=>{if(leafletMap.current)draw()},[favorites,archived,topPickId,listings])
  function init(){const L=(window as any).L;if(!mapRef.current)return;const m=L.map(mapRef.current,{zoomControl:true}).setView([45.528,-122.654],13);L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'(c) OpenStreetMap (c) CARTO',maxZoom:19}).addTo(m);leafletMap.current=m;draw()}
  function draw(){
    const L=(window as any).L;const m=leafletMap.current;if(!L||!m)return
    m.eachLayer((l:any)=>{if(l.options?.apt)m.removeLayer(l)})
    listings.filter(l=>!archived.includes(l.id)).forEach(l=>{
      const fav=favorites.includes(l.id);const top=l.id===topPickId
      const col=top?'#16a34a':fav?'#eab308':notes[l.id]?'#d97706':'#6b7280'
      const sz=top?18:fav?15:12
      const label=top?'*':fav?'+':''
      const ic=L.divIcon({html:'<div style="width:'+sz*2+'px;height:'+sz*2+'px;border-radius:50%;background:'+col+';border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:'+sz*.7+'px;color:white;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.25);">'+label+'</div>',className:'',iconSize:[sz*2,sz*2],iconAnchor:[sz,sz],popupAnchor:[0,-sz-4]})
      const noteHtml=notes[l.id]?'<div style="font-size:11px;color:#7c3aed">'+notes[l.id].slice(0,80)+'</div>':''
      const pop='<div style="font-family:sans-serif;min-width:200px"><b>'+l.name+'</b><div style="font-size:11px;color:#9ca3af;margin:2px 0 6px">'+l.addr+'</div><div style="font-size:14px;font-weight:500;margin-bottom:6px">'+l.price+'</div>'+noteHtml+'<a href="'+l.link+'" target="_blank" style="font-size:11px;color:#16a34a;font-family:monospace">View listing</a></div>'
      L.marker([l.lat,l.lng],{icon:ic,apt:true}).addTo(m).bindPopup(pop,{maxWidth:280})
    })
  }
  return(<div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 110px)',minHeight:500}}><div ref={mapRef} style={{flex:1}}/><style>{`.leaflet-popup-content-wrapper{border-radius:10px;padding:0}.leaflet-popup-content{margin:14px 16px}`}</style></div>)
}

// ===================== KANBAN GROUP =====================
function KG({label,count,hint,accent,children}:{label:string;count:number;hint?:string;accent:string;children:React.ReactNode[]}){
  return(<div><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:3,height:18,borderRadius:99,background:accent,flexShrink:0}}/><span style={{fontFamily:'Georgia,serif',fontSize:17,fontWeight:600,color:'#111827'}}>{label}</span><span style={{fontFamily:'monospace',fontSize:10,color:'#9ca3af'}}>{count} {hint||''}</span><div style={{flex:1,height:1,background:'#ebebeb'}}/></div>{children.length===0?<div style={{fontFamily:'Georgia,serif',fontSize:14,fontStyle:'italic',color:'#d1d5db',padding:'16px 0'}}>-</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))',gap:14}}>{children}</div>}</div>)
}

// ===================== MAIN =====================
export default function ApartmentsPage(){
  const router=useRouter();const params=useParams()
  const view=(params?.slug as string[]|undefined)?.[0]||'all'
  function nav(slug:string){router.push(slug==='all'?'/apartments':`/apartments/${slug}`)}

  const [listings,setListings]=useState<Listing[]>([])
  const [loaded,setLoaded]=useState(false)
  const [state,setState]=useState<SharedState>({favorites:[],notes:{},favoriteOrder:[],archived:[],photoUrls:{},contacts:{}})
  const [syncing,setSyncing]=useState(false)
  const [syncErr,setSyncErr]=useState(false)
  const [lastSync,setLastSync]=useState<Date|null>(null)
  const [modal,setModal]=useState<{listing?:Listing}|null>(null)
  const [dbErr,setDbErr]=useState<string|null>(null)
  const saveT=useRef<ReturnType<typeof setTimeout>|null>(null)
  const pending=useRef(false)
  const pendT=useRef<ReturnType<typeof setTimeout>|null>(null)
  const stRef=useRef(state)
  const dragId=useRef<string|null>(null)
  const [dragId2,setDragId2]=useState<string|null>(null)
  const [overId,setOverId]=useState<string|null>(null)

  useEffect(()=>{loadL();loadS();const iv=setInterval(loadS,8000);return()=>clearInterval(iv)},[])

  async function loadL(){
    try{
      const{data,error}=await supabase.from('apartment_listings').select('id,data').order('id')
      if(error){setDbErr(error.message.includes('does not exist')?'Run migration + seed — see supabase/ folder':error.message);setLoaded(true);return}
      setListings((data||[]).map((r:any)=>({...r.data,id:r.id})));setLoaded(true)
    }catch(e:any){setDbErr(String(e));setLoaded(true)}
  }

  function setP(v:boolean){pending.current=v;if(pendT.current)clearTimeout(pendT.current);if(v)pendT.current=setTimeout(()=>{pending.current=false},10000)}
  async function loadS(force=false){
    if(!force&&pending.current)return
    try{const{data,error}=await supabase.from('apartment_state').select('data').eq('key','shared').single();if(error){setSyncErr(true);return}if(data?.data){const m:SharedState={favorites:[],notes:{},favoriteOrder:[],archived:[],photoUrls:{},contacts:{},...(data.data as SharedState)};stRef.current=m;setState(m);setLastSync(new Date());setSyncErr(false)}}catch{setSyncErr(true)}
  }
  const persist=useCallback((next:SharedState)=>{stRef.current=next;setP(true);if(saveT.current)clearTimeout(saveT.current);saveT.current=setTimeout(async()=>{setSyncing(true);try{const{error}=await supabase.from('apartment_state').upsert({key:'shared',data:stRef.current,updated_at:new Date().toISOString()});if(error)setSyncErr(true);else{setLastSync(new Date());setSyncErr(false)}}catch{setSyncErr(true)}finally{setSyncing(false);setP(false)}},600)},[])

  async function saveL(l:Listing){try{await supabase.from('apartment_listings').upsert({id:l.id,data:l,updated_at:new Date().toISOString()});setListings(p=>{const i=p.findIndex(x=>x.id===l.id);return i>=0?p.map((x,j)=>j===i?l:x):[...p,l]})}catch(e:any){alert('Save failed: '+e.message)};setModal(null)}
  async function delL(id:string){if(!confirm('Delete this listing?'))return;try{await supabase.from('apartment_listings').delete().eq('id',id);setListings(p=>p.filter(l=>l.id!==id))}catch(e:any){alert('Delete failed: '+e.message)};setModal(null)}

  function togFav(id:string){setState(p=>{const h=p.favorites.includes(id);const f=h?p.favorites.filter(x=>x!==id):[...p.favorites,id];const fo=h?p.favoriteOrder.filter(x=>x!==id):[...p.favoriteOrder,id];const n={...p,favorites:f,favoriteOrder:fo};persist(n);return n})}
  function updNote(id:string,v:string){setState(p=>{const n={...p,notes:{...p.notes,[id]:v}};persist(n);return n})}
  function updContact(id:string,e:ContactEntry){setState(p=>{const n={...p,contacts:{...(p.contacts||{}),[id]:e}};persist(n);return n})}
  function togArch(id:string){setState(p=>{const h=(p.archived||[]).includes(id);const a=h?p.archived.filter(x=>x!==id):[...(p.archived||[]),id];const f=h?p.favorites:p.favorites.filter(x=>x!==id);const fo=h?p.favoriteOrder:p.favoriteOrder.filter(x=>x!==id);const n={...p,archived:a,favorites:f,favoriteOrder:fo};persist(n);return n})}

  async function upPhoto(id:string,file:File){
    try{const rd=new FileReader();rd.onload=async()=>{if(typeof rd.result!=='string')return;const blob=await compressToBlob(rd.result);const path=`${id}_${Date.now()}.jpg`;const{error}=await supabase.storage.from('apartment-photos').upload(path,blob,{upsert:true,contentType:'image/jpeg'});if(error){console.error(error.message);return}const{data:u}=supabase.storage.from('apartment-photos').getPublicUrl(path);const url=u.publicUrl;setState(p=>{const n={...p,photoUrls:{...(p.photoUrls||{}),[id]:url}};persist(n);return n})};rd.readAsDataURL(file)}catch(e){console.error(e)}
  }

  function onDS(id:string){dragId.current=id;setDragId2(id)}
  function onDO(e:React.DragEvent,id:string){e.preventDefault();setOverId(id)}
  function onDp(tid:string){if(!dragId.current||dragId.current===tid){setDragId2(null);setOverId(null);return}setState(p=>{const o=p.favoriteOrder.length>0?[...p.favoriteOrder]:[...p.favorites];const fr=o.indexOf(dragId.current!);const to=o.indexOf(tid);if(fr<0||to<0)return p;o.splice(fr,1);o.splice(to,0,dragId.current!);const n={...p,favoriteOrder:o,favorites:o};persist(n);return n});dragId.current=null;setDragId2(null);setOverId(null)}
  function onDE(){dragId.current=null;setDragId2(null);setOverId(null)}

  const LM=Object.fromEntries(listings.map(l=>[l.id,l]))
  const arch=state.archived||[]
  const fo=state.favoriteOrder.length>0?state.favoriteOrder:state.favorites
  const topId=fo[0]||null
  const kFav=fo.map((id:string)=>LM[id]).filter(Boolean).filter((l:Listing)=>!arch.includes(l.id))
  const unfav=listings.filter(l=>!arch.includes(l.id)&&!fo.includes(l.id))
  const kCon=unfav.filter(l=>!!(state.notes[l.id]?.trim()))
  const kNew=unfav.filter(l=>!state.notes[l.id]?.trim())
  const vis=(()=>{if(view==='archived')return listings.filter(l=>arch.includes(l.id));if(view==='favorites')return fo.map((id:string)=>LM[id]).filter(Boolean).filter((l:Listing)=>!arch.includes(l.id));if(view==='all'||view==='map')return[];return listings.filter(l=>{if(arch.includes(l.id))return false;if(view==='cohousing')return l.type==='cohousing';if(view==='2br')return l.beds.includes('2BR');if(view==='loft')return l.rows.some(r=>r.l==='Layout'&&r.d==='g');if(view==='new')return l.isNew;return true})})()
  const statL=(view==='all'||view==='map')?[...kFav,...kCon,...kNew]:(view==='archived'?listings.filter(l=>arch.includes(l.id)):vis)
  const nCon=Object.values((state.contacts||{}) as Record<string,ContactEntry>).filter(c=>c.status!=='none').length
  const nTour=Object.values((state.contacts||{}) as Record<string,ContactEntry>).filter(c=>c.status==='toured').length

  function rc(l:Listing,i:number,drag=false,rank?:number){return(<div key={l.id} draggable={drag} onDragStart={drag?()=>onDS(l.id):undefined} onDragOver={drag?(e)=>onDO(e,l.id):undefined} onDrop={drag?()=>onDp(l.id):undefined} onDragEnd={drag?onDE:undefined} style={{cursor:drag?'grab':'default',animation:`fu 0.2s ease ${i*25}ms both`}}><Card l={l} isFav={state.favorites.includes(l.id)} isTop={l.id===topId} isArchived={arch.includes(l.id)} note={state.notes[l.id]||''} photoUrl={(state.photoUrls||{})[l.id]||''} contact={(state.contacts||{})[l.id]||{status:'none'}} rank={rank} onFav={togFav} onArchive={togArch} onNote={updNote} onPhoto={upPhoto} onContact={updContact} isDragging={dragId2===l.id} isOver={overId===l.id&&dragId2!==l.id} onEdit={(x)=>setModal({listing:x})}/></div>)}

  const isAll=view==='all';const isMap=view==='map';const isFav=view==='favorites';const isArch=view==='archived'
  return(
    <div style={{background:'#F5F3EF',minHeight:'100vh',color:'#111827'}}>
      <header style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,.97)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid #ebebeb',padding:'12px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10,flexWrap:'wrap'}}>
          <div>
            <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.14em',color:'#9ca3af',marginBottom:1}}>Portland - June 2026</div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:400,margin:0,lineHeight:1.1}}>Marvin &amp; Reese&apos;s <em style={{color:'#16a34a'}}>Housing Shortlist</em></h1>
          </div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
            {syncErr&&<button onClick={()=>loadS(true)} style={{fontFamily:'monospace',fontSize:9,color:'#dc2626',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:6,cursor:'pointer',padding:'3px 8px'}}>retry sync</button>}
            <div style={{width:6,height:6,borderRadius:'50%',background:syncErr?'#dc2626':syncing?'#7c3aed':'#16a34a'}}/>
            {lastSync&&!syncErr&&<span style={{fontFamily:'monospace',fontSize:9,color:'#9ca3af'}}>{lastSync.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
          {VIEWS.map(v=>{const act=view===v.key;const ia=v.key==='archived';return(<button key={v.key} onClick={()=>nav(v.slug)} style={{fontFamily:'monospace',fontSize:10,padding:'5px 12px',borderRadius:99,border:'1px solid',cursor:'pointer',whiteSpace:'nowrap',background:act?(ia?'#7f1d1d':'#111827'):ia?'#fff5f5':'#fff',color:act?'#fff':ia?'#b91c1c':'#6b7280',borderColor:act?(ia?'#7f1d1d':'#111827'):ia?'#fecaca':'#e5e7eb'}}>{v.label}{ia&&arch.length>0?` (${arch.length})`:''}</button>)})}
          <button onClick={()=>setModal({})} style={{fontFamily:'monospace',fontSize:10,padding:'5px 14px',borderRadius:99,border:'1px solid #16a34a',cursor:'pointer',background:'#f0fdf4',color:'#15803d',marginLeft:'auto',whiteSpace:'nowrap'}}>+ Add</button>
        </div>
        <div style={{display:'flex',gap:16,marginTop:10,flexWrap:'wrap'}}>
          {[{n:statL.length,l:'listings'},{n:state.favorites.length,l:'favorited'},{n:nCon,l:'contacted'},{n:nTour,l:'toured'}].map(s=>(
            <div key={s.l} style={{display:'flex',alignItems:'baseline',gap:4}}><span style={{fontFamily:'Georgia,serif',fontSize:16,color:'#111827'}}>{s.n||'-'}</span><span style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace'}}>{s.l}</span></div>
          ))}
        </div>
      </header>

      {dbErr&&<div style={{background:'#fffbeb',borderBottom:'1px solid #fde68a',padding:'10px 20px',fontFamily:'monospace',fontSize:11,color:'#92400e'}}>Supabase: {dbErr}</div>}
      {!loaded&&<div style={{padding:60,textAlign:'center',fontFamily:'monospace',fontSize:12,color:'#9ca3af'}}>Loading...</div>}

      {isMap&&loaded&&<MapView listings={listings} favorites={state.favorites} archived={arch} topPickId={topId} notes={state.notes}/>}
      {isAll&&loaded&&(
        <div style={{padding:'24px 20px 60px',display:'flex',flexDirection:'column',gap:48}}>
          <KG label="Favorited" count={kFav.length} hint="drag to reorder" accent="#16a34a">{kFav.map((l:Listing,i:number)=>rc(l,i,true,i+1))}</KG>
          <KG label="Considering" count={kCon.length} hint="with notes" accent="#d97706">{kCon.map((l:Listing,i:number)=>rc(l,i))}</KG>
          <KG label="New" count={kNew.length} hint="not yet reviewed" accent="#9ca3af">{kNew.map((l:Listing,i:number)=>rc(l,i))}</KG>
        </div>
      )}
      {!isAll&&!isMap&&loaded&&(
        <div style={{padding:'20px 20px 60px',display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))',gap:14}}>
          {vis.map((l:Listing,i:number)=>rc(l,i,isFav,isFav?i+1:undefined))}
          {vis.length===0&&<div style={{gridColumn:'1/-1',padding:60,textAlign:'center',fontFamily:'Georgia,serif',fontSize:20,fontStyle:'italic',color:'#9ca3af'}}>{isArch?'Nothing archived.':isFav?'No favorites yet.':'No listings match.'}</div>}
        </div>
      )}

      {modal&&<Modal initial={modal.listing} onSave={saveL} onDelete={modal.listing?.id?()=>delL(modal.listing!.id):undefined} onClose={()=>setModal(null)}/>}
      <style>{'@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}textarea:focus,input:focus,select:focus{border-color:#a5b4fc!important;box-shadow:0 0 0 3px #ede9fe!important;outline:none}*{box-sizing:border-box}'}</style>
    </div>
  )
}
