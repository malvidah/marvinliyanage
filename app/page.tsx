"use client"

import { useState, useEffect, useCallback } from "react"
import EditableText from "./components/EditableText"
import EditableImage from "./components/EditableImage"
import EditBar, { useAdmin } from "./components/EditBar"

/* ─── TYPES ─── */

type Entry = {
  id: number
  slug: string
  title: string
  org: string
  date: string
  url: string | null
  github: string | null
  role: string
  tags: string[]
  status: string
  gradient: string
  description: string
  highlight: string | null
  entry_type: string
  image_url: string | null
  sort_order: number
}

type AboutMap = Record<string, string>

/* ─── FALLBACK DATA ─── */
const FALLBACK_ENTRIES: Entry[] = [
  { id:1, slug:"big-think", title:"BIG THINK", org:"Media & Strategy", date:"2022 – Present", url:"https://bigthink.com", github:null, role:"Social Strategy Lead (2026 – Present) · Editorial Social Media Manager (2024 – 2026)", tags:["Content Strategy","Video Editing","Social Media","Analytics","GA4"], status:"live", gradient:"gradient-card-1", description:"Own cross-platform content strategy across Instagram, YouTube, and LinkedIn. Produce original video series, manage data pipelines from GA4 to membership revenue attribution. Previously managed editorial social presence, developed content calendars, audience growth strategies, and analytics reporting.", highlight:null, entry_type:"role", image_url:null, sort_order:0 },
  { id:2, slug:"curiosity-lab", title:"CURIOSITY LAB", org:"Big Think · Video Series", date:"2022 – Present", url:"https://www.youtube.com/@bigthink", github:null, role:"Creator, host, editor", tags:["Video","Science Communication","Big Think"], status:"ongoing", gradient:"gradient-card-2", description:"An original video series for Big Think exploring the edges of science, consciousness, and human behavior — from MIT ultrasound consciousness research to the neuroscience of creativity. Written, produced, and presented by me.", highlight:"100M+ views across the channel", entry_type:"project", image_url:null, sort_order:1 },
  { id:3, slug:"audian", title:"AUDIAN", org:"Personal Project", date:"2024 – Present", url:"https://audian.app", github:"https://github.com/malvidah/audian", role:"Solo — design, engineering", tags:["Next.js","Playwright","Railway","Instagram API"], status:"live", gradient:"gradient-card-3", description:"A social analytics dashboard built to replace a paid Brandwatch subscription for Big Think. Features a split-pane staging queue with keyboard navigation, inline editing, bulk actions, and a self-hosted Playwright service for live Instagram screenshots.", highlight:"Saves ~$600/mo vs. Brandwatch", entry_type:"project", image_url:null, sort_order:2 },
  { id:4, slug:"day-lab", title:"DAY LAB", org:"Personal Project", date:"2023 – Present", url:"https://daylab.me", github:"https://github.com/malvidah/lifeos", role:"Solo — design, engineering", tags:["Next.js 14","Supabase","Electron","iOS"], status:"live", gradient:"gradient-card-4", description:"A personal life OS for tracking health, tasks, meals, journal entries, and activity. Syncs Oura, Strava, Apple Health, and Google Calendar into a single unified view. Released as a Mac app (notarized DMG) and iOS (TestFlight).", highlight:"Replaced 6 separate apps", entry_type:"project", image_url:null, sort_order:3 },
  { id:5, slug:"nas-company", title:"NAS COMPANY", org:"Media & Content", date:"2024", url:null, github:null, role:"Project Manager (2024) · Host / Scriptwriter (2024)", tags:["Media Strategy","Partnership Development","Scriptwriting","Video Production"], status:"past", gradient:"gradient-card-1", description:"Wrote and designed partnership proposals and content strategies that generated $1M+ in revenue and delivered 68M+ views and 100,000+ leads for clients. Developed content strategy, wrote viral scripts, filmed, and presented content for a client channel focused on science, tech, and AI that reached 7M+ people and 4x'd the client's followers in 1 month.", highlight:"$1M+ revenue, 7M+ reach", entry_type:"role", image_url:null, sort_order:4 },
  { id:6, slug:"national-heritage-academies", title:"NATIONAL HERITAGE ACADEMIES", org:"Education", date:"2022 – 2023", url:null, github:null, role:"Consultant", tags:["Curriculum Design","AI in Education","Growth Marketing"], status:"past", gradient:"gradient-card-2", description:"Led the design of a new physical science curriculum and the safe implementation of AI tools in classrooms for one of the largest charter school operators in the world (100+ schools, 65K+ students, tuition free).", highlight:"100+ schools, 65K+ students", entry_type:"role", image_url:null, sort_order:5 },
  { id:7, slug:"curyte", title:"CURYTE", org:"EdTech Startup", date:"2021 – 2022", url:null, github:null, role:"Co-Founder", tags:["Product Marketing","Business Development","User Research"], status:"past", gradient:"gradient-card-3", description:"Founded and directed product marketing and business development for an education resource platform that uses AI to make lesson planning faster and easier for teachers and more accessible and engaging for students. Conducted user research interviews to inform product and marketing strategy.", highlight:null, entry_type:"project", image_url:null, sort_order:6 },
  { id:8, slug:"academy-of-thought-and-industry", title:"ACADEMY OF THOUGHT AND INDUSTRY", org:"Education", date:"2021 – 2022", url:null, github:null, role:"Community Lead & Science Guide", tags:["Science Education","Curriculum Design","Leadership"], status:"past", gradient:"gradient-card-4", description:"Coordinated with head of San Francisco ATI schools to lead a Montessori high school with 5 teachers. Made decisions regarding COVID policy, grading, curriculum, transcripts, graduation requirements, school schedule, events, and partnerships. Taught NGSS-aligned project-based curriculum for Chemistry, Physics, and Biology.", highlight:null, entry_type:"role", image_url:null, sort_order:7 },
  { id:9, slug:"san-francisco-unified", title:"SAN FRANCISCO UNIFIED", org:"Education", date:"2018 – 2021", url:null, github:null, role:"Physics Lead & HSA Teacher (2019 – 2021) · Physics Teacher (2018 – 2019)", tags:["Science Education","Curriculum Design","Storytelling"], status:"past", gradient:"gradient-card-1", description:"Led a team of 4 in designing and instructing curriculum for physics. Taught 3 sections of physics and 2 sections of senior-level public health. Led professional development for 100+ teachers on project-based learning. Collaborated with the Exploratorium, UCSF, and Stanford.", highlight:"PD for 100+ teachers", entry_type:"role", image_url:null, sort_order:8 },
  { id:10, slug:"cercle", title:"CERCLE", org:"Music & Events", date:"2016 – 2018", url:null, github:null, role:"Co-Founder", tags:["Marketing","Event Production","Social Media","Branding"], status:"past", gradient:"gradient-card-2", description:"Helped found and raise initial funding for Cercle, a live-streaming and music event company. Collaborated on branding decisions, artist contacts, and event organization. Worked on social media campaigning and advertising through media contracts.", highlight:null, entry_type:"project", image_url:null, sort_order:9 },
  { id:11, slug:"bonn-university", title:"BONN UNIVERSITY", org:"Neuroscience", date:"2015 – 2017", url:null, github:null, role:"Masters Student · Graduate Research Assistant", tags:["Quantitative Research","Neuroscience"], status:"past", gradient:"gradient-card-3", description:"Master's thesis in synaptic transmission and molecular correlates of learning and memory. Graduate research assistant conducting neuroscience research.", highlight:null, entry_type:"role", image_url:null, sort_order:10 },
  { id:12, slug:"salk-institute", title:"SALK INSTITUTE", org:"Neuroscience", date:"2015", url:null, github:null, role:"Research Assistant", tags:["Quantitative Research","Neuroscience"], status:"past", gradient:"gradient-card-4", description:"Assisted in data collection for a research paper published in Nature Neuroscience: Pathological priming causes developmental gene network heterochronicity in autistic subject-derived neurons.", highlight:"Published in Nature Neuroscience", entry_type:"role", image_url:null, sort_order:11 },
  { id:13, slug:"ucsb", title:"UC SANTA BARBARA", org:"Research", date:"2012 – 2015", url:null, github:null, role:"Undergraduate Research Assistant — Neuroscience Research Institute · Vision & Image Understanding Lab", tags:["Neuroscience","Computer Vision","Research"], status:"past", gradient:"gradient-card-1", description:"Undergraduate research assistant across two labs: the Neuroscience Research Institute and the Vision & Image Understanding lab at UC Santa Barbara.", highlight:null, entry_type:"role", image_url:null, sort_order:12 },
  { id:14, slug:"scripps-research", title:"SCRIPPS RESEARCH INSTITUTE", org:"Biology", date:"2012", url:null, github:null, role:"Research Assistant", tags:["Research","Biology"], status:"past", gradient:"gradient-card-2", description:"Research assistant at The Scripps Research Institute in San Diego.", highlight:null, entry_type:"role", image_url:null, sort_order:13 },
]

const FALLBACK_ABOUT: AboutMap = {
  about_1: "I lead social strategy at Big Think, produce the Curiosity Lab video series, and build software tools for my own work — including a life OS and a social analytics platform.",
  about_2: "I think a lot about media, attention, and what it means to make something worth watching.",
  skills: "Content Strategy, Product Design, Full-Stack Engineering, Video Production, Data Analysis",
  contact_heading: "Let\u2019s talk.",
  contact_body: "Open to interesting conversations about media, AI, tools, or anything else that sits at the edge of something.",
}

const LINKS = [
  { label: "GitHub", href: "https://github.com/malvidah" },
  { label: "LinkedIn", href: "https://linkedin.com/in/marvinliyanage" },
  { label: "Email", href: "mailto:marvin@marvinliyanage.com" },
]

const STACK = [
  "Next.js", "TypeScript", "Supabase", "Vercel", "Tailwind",
  "Electron", "Playwright", "TipTap", "GA4", "Figma",
  "Python", "SQLite", "Railway", "GitHub Actions",
]

/* ─── COMPONENT ─── */

export default function Home() {
  const { isAdmin } = useAdmin()
  const [entries, setEntries] = useState<Entry[]>([])
  const [about, setAbout] = useState<AboutMap>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries?.length ? data.entries : FALLBACK_ENTRIES)
        setAbout(data.about && Object.keys(data.about).length ? data.about : FALLBACK_ABOUT)
        setLoaded(true)
      })
      .catch(() => {
        setEntries(FALLBACK_ENTRIES)
        setAbout(FALLBACK_ABOUT)
        setLoaded(true)
      })
  }, [])

  const entry = entries[activeIndex] ?? entries[0] ?? null

  const saveEntryField = useCallback(
    (slug: string, field: string, value: string | string[]) => {
      fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "site_entries", slug, field, value }),
      })
      setEntries((prev) =>
        prev.map((e) => (e.slug === slug ? { ...e, [field]: value } : e))
      )
    },
    []
  )

  const deleteEntry = useCallback((slug: string) => {
    fetch("/api/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
    setEntries((prev) => {
      const next = prev.filter((e) => e.slug !== slug)
      setActiveIndex((i) => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }, [])

  const addEntry = useCallback(async () => {
    const slug = `new-entry-${Date.now()}`
    const newEntry = {
      slug,
      title: "NEW PROJECT",
      org: "Category",
      date: "2026",
      url: null,
      github: null,
      role: "Role",
      tags: [],
      status: "past",
      gradient: "gradient-card-1",
      description: "Add a description.",
      highlight: null,
      entry_type: "project",
      image_url: null,
      sort_order: 999,
    }
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    })
    const data = await res.json()
    const created = data.entry ?? { ...newEntry, id: Date.now() }
    setEntries((prev) => {
      setActiveIndex(prev.length)
      return [...prev, created]
    })
  }, [])

  const saveAbout = useCallback(
    (key: string, value: string) => {
      fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "site_about", key, value }),
      })
      setAbout((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleImageUploaded = useCallback(
    (slug: string, url: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.slug === slug ? { ...e, image_url: url } : e))
      )
    },
    []
  )

  return (
    <main style={{ minHeight: "100vh", opacity: loaded ? 1 : 0, transition: "opacity 0.2s ease" }}>
      {/* ═══ HEADER ═══ */}
      <header
        className="header-bar"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="link-underline"
              style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink2)" }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink3)" }}>
          San Francisco & Portland
        </span>
      </header>

      {/* ═══ NAME ═══ */}
      <section
        style={{
          padding: "48px 32px 40px",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 8vw, 120px)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            color: "var(--ink)",
            whiteSpace: "nowrap",
          }}
        >
          MARVIN LIYANAGE
        </h1>
      </section>

      {/* ═══ THREE PANEL ═══ */}
      <div className="three-panel">
        {/* ── LEFT: ABOUT ── */}
        <aside
          className="panel-left"
          style={{
            borderRight: "1px solid var(--border)",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
              ABOUT
            </div>
            <EditableText
              as="p"
              value={about.about_1 ?? FALLBACK_ABOUT.about_1}
              isAdmin={isAdmin}
              onSave={(v) => saveAbout("about_1", v)}
              multiline
              style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.7, color: "var(--ink2)", marginBottom: 32 }}
            />

            <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              SKILLS
            </div>
            {isAdmin ? (
              <EditableText
                as="div"
                value={about.skills ?? FALLBACK_ABOUT.skills}
                isAdmin={isAdmin}
                onSave={(v) => saveAbout("skills", v)}
                multiline
                style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink2)", lineHeight: 1.8, marginBottom: 32 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 32 }}>
                {(about.skills ?? FALLBACK_ABOUT.skills).split(",").map((s) => (
                  <span key={s} style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink2)" }}>{s.trim()}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              STACK
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STACK.map((s) => (
                <span key={s} style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink3)", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 3 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MIDDLE: PROJECTS LIST ── */}
        <div
          className="panel-mid"
          style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}
        >
          <div style={{ padding: "32px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              PROJECTS
            </span>
            {isAdmin && (
              <button
                onClick={addEntry}
                style={{
                  background: "none", border: "1px solid var(--border)", borderRadius: 4,
                  width: 22, height: 22, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "var(--ink3)", lineHeight: 1,
                }}
                title="Add project"
              >+</button>
            )}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {entries.map((p, i) => (
              <div
                key={p.slug}
                className={`project-row ${i === activeIndex ? "active" : ""}`}
                onClick={() => setActiveIndex(i)}
                style={{
                  padding: "16px 28px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: p.status === "live" ? "#22C55E" : p.status === "ongoing" ? "#F59E0B" : "var(--border-dark)",
                      display: "inline-block", flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <EditableText
                      value={p.title}
                      isAdmin={isAdmin}
                      onSave={(v) => {
                        const plain = v.replace(/<[^>]+>/g, "").trim()
                        if (!plain) deleteEntry(p.slug)
                        else saveEntryField(p.slug, "title", v)
                      }}
                      style={{
                        fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
                        letterSpacing: "0.03em", textTransform: "uppercase",
                        lineHeight: 1.2, display: "block",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    />
                    <EditableText
                      value={p.org}
                      isAdmin={isAdmin}
                      onSave={(v) => saveEntryField(p.slug, "org", v)}
                      style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink3)", marginTop: 2, display: "block" }}
                    />
                  </div>
                </div>
                <span
                  style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink3)", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {p.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: PROJECT DETAIL ── */}
        <div style={{ padding: "32px 28px", overflow: "auto" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
            PROJECT DETAIL
          </div>
          {!entry ? null : (<>

          <EditableImage
            slug={entry.slug}
            imageUrl={entry.image_url}
            gradientClass={entry.gradient}
            title={entry.title}
            isAdmin={isAdmin}
            onUploaded={(url) => handleImageUploaded(entry.slug, url)}
            projectUrl={entry.url}
            style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: 16, marginBottom: 28 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>
                DATE
              </div>
              <EditableText
                as="div"
                value={entry.date}
                isAdmin={isAdmin}
                onSave={(v) => saveEntryField(entry.slug, "date", v)}
                style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}
              />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>
                ROLE
              </div>
              <EditableText
                as="div"
                value={entry.role}
                isAdmin={isAdmin}
                onSave={(v) => saveEntryField(entry.slug, "role", v)}
                style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}
              />
            </div>
          </div>

          <EditableText
            as="p"
            value={entry.description}
            isAdmin={isAdmin}
            onSave={(v) => saveEntryField(entry.slug, "description", v)}
            multiline
            style={{ fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.75, color: "var(--ink2)", marginBottom: 24 }}
          />

          {entry.highlight && (
            <EditableText
              as="div"
              value={entry.highlight}
              isAdmin={isAdmin}
              onSave={(v) => saveEntryField(entry.slug, "highlight", v)}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
                padding: "12px 16px", background: "var(--bg-alt)", borderRadius: 10,
                marginBottom: 24, display: "inline-block",
              }}
            />
          )}

          <div style={{ marginBottom: 28 }}>
            {isAdmin ? (
              <EditableText
                as="div"
                value={entry.tags.join(", ")}
                isAdmin={isAdmin}
                onSave={(v) => {
                  const tags = v.replace(/<[^>]+>/g, "").split(",").map((t) => t.trim()).filter(Boolean)
                  saveEntryField(entry.slug, "tags", tags)
                }}
                style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink3)" }}
              />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink3)", padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4 }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: "var(--ink)", padding: "10px 24px", borderRadius: 8 }}>
                Visit
              </a>
            )}
            {entry.github && (
              <a href={entry.github} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink)", border: "1px solid var(--border-dark)", padding: "10px 24px", borderRadius: 8 }}>
                GitHub
              </a>
            )}
          </div>
          </>)}
        </div>
      </div>

      {/* ═══ CONTACT ═══ */}
      <section
        className="contact-strip"
        style={{
          padding: "48px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div>
          <EditableText
            as="h2"
            value={about.contact_heading ?? FALLBACK_ABOUT.contact_heading}
            isAdmin={isAdmin}
            onSave={(v) => saveAbout("contact_heading", v)}
            style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, fontStyle: "italic", lineHeight: 1.1 }}
          />
          <EditableText
            as="p"
            value={about.contact_body ?? FALLBACK_ABOUT.contact_body}
            isAdmin={isAdmin}
            onSave={(v) => saveAbout("contact_body", v)}
            multiline
            style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--ink2)", marginTop: 8, maxWidth: 440 }}
          />
        </div>
        <a
          href="mailto:marvin@marvinliyanage.com"
          style={{
            fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#fff", background: "var(--ink)", padding: "14px 32px", borderRadius: 8,
          }}
        >
          Get in touch
        </a>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink3)" }}>
          &copy; 2026 Marvin Liyanage
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {LINKS.map((l) => (
            <a key={l.label} href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="link-underline"
              style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink3)" }}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>

      <EditBar />
    </main>
  )
}
