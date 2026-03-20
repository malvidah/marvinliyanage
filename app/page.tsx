import Link from "next/link"

const PROJECTS = [
  {
    slug: "day-lab",
    title: "Day Lab",
    url: "https://daylab.me",
    github: "https://github.com/malvidah/lifeos",
    year: "2023–now",
    role: "Solo — design, engineering",
    tags: ["Next.js 14", "Supabase", "Electron", "iOS"],
    status: "live",
    description:
      "A personal life OS for tracking health, tasks, meals, journal entries, and activity. Syncs Oura, Strava, Apple Health, and Google Calendar into a single unified view. Released as a Mac app (notarized DMG) and iOS (TestFlight).",
    highlight: "Replaced 6 separate apps for myself",
  },
  {
    slug: "audian",
    title: "Audian",
    url: "https://audian.app",
    github: "https://github.com/malvidah/audian",
    year: "2024–now",
    role: "Solo — design, engineering",
    tags: ["Next.js", "Playwright", "Railway", "Instagram API"],
    status: "live",
    description:
      "A social analytics dashboard built to replace a paid Brandwatch subscription for Big Think. Features a split-pane staging queue with keyboard navigation, inline editing, bulk actions, and a self-hosted Playwright service for live Instagram screenshots.",
    highlight: "Saves ~$600/mo vs. Brandwatch",
  },
  {
    slug: "curiosity-lab",
    title: "Curiosity Lab",
    url: "https://www.youtube.com/@bigthink",
    github: null,
    year: "2022–now",
    role: "Creator, host, editor",
    tags: ["Video", "Science communication", "Big Think"],
    status: "ongoing",
    description:
      "An original video series for Big Think exploring the edges of science, consciousness, and human behavior — from MIT ultrasound consciousness research to the neuroscience of creativity. Written, produced, and presented by me.",
    highlight: "100M+ views across the channel",
  },
]

const TIMELINE = [
  {
    year: "2022–now",
    org: "Big Think",
    role: "Editorial Social Strategy Lead",
    detail:
      "Own cross-platform content strategy across Instagram, YouTube, and LinkedIn. Produce original video series, manage data pipelines from GA4 to membership revenue attribution.",
  },
  {
    year: "2020–2022",
    org: "Freelance",
    role: "Content & Experience Designer",
    detail:
      "Created editorial content and interactive experiences for media and education clients. Developed curriculum and facilitated workshops.",
  },
]

function StatusDot({ status }: { status: string }) {
  const color =
    status === "live"
      ? "#C8F53C"
      : status === "ongoing"
      ? "#F5A623"
      : "#605C54"
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        marginTop: 2,
        boxShadow: status === "live" ? `0 0 8px ${color}60` : "none",
      }}
    />
  )
}

export default function Home() {
  return (
    <main
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        minHeight: "100vh",
        fontFamily: "var(--font-display)",
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,11,9,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          marvinliyanage.com
        </span>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            { label: "Projects", href: "#projects" },
            { label: "Work", href: "#work" },
            { label: "Contact", href: "#contact" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          paddingTop: 160,
          paddingBottom: 120,
          paddingLeft: "clamp(24px, 5vw, 80px)",
          paddingRight: "clamp(24px, 5vw, 80px)",
          borderBottom: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background text watermark */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            right: "-2%",
            transform: "translateY(-50%)",
            fontSize: "clamp(120px, 20vw, 320px)",
            fontWeight: 900,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: "1px rgba(240,235,225,0.04)",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.03em",
          }}
        >
          ML
        </div>

        <div style={{ position: "relative", maxWidth: 900 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            San Francisco → Portland · 2026
          </div>

          <h1
            style={{
              fontSize: "clamp(52px, 8vw, 108px)",
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              marginBottom: 32,
              color: "var(--ink)",
            }}
          >
            Marvin
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--ink2)",
              }}
            >
              Liyanage
            </em>
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 24px",
              marginBottom: 40,
            }}
          >
            {[
              "Editorial Social Strategy Lead",
              "Big Think",
              "Builder",
              "Curious person",
            ].map((tag, i) => (
              <span
                key={tag}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: i === 1 ? "var(--accent)" : "var(--ink2)",
                  letterSpacing: "0.06em",
                }}
              >
                {i > 0 ? "· " : ""}
                {tag}
              </span>
            ))}
          </div>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: "var(--ink2)",
              maxWidth: 560,
              fontWeight: 300,
            }}
          >
            I lead social strategy at Big Think, produce the{" "}
            <em style={{ color: "var(--ink)", fontStyle: "italic" }}>
              Curiosity Lab
            </em>{" "}
            video series, and build software tools for my own work —
            including a life OS and a social analytics platform. I think
            a lot about media, attention, and what it means to make
            something worth watching.
          </p>

          <div
            style={{ display: "flex", gap: 16, marginTop: 40, flexWrap: "wrap" }}
          >
            <a
              href="#projects"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                background: "var(--accent)",
                color: "var(--bg)",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 500,
                transition: "background 0.15s",
                cursor: "pointer",
              }}
            >
              View projects
            </a>
            <a
              href="https://github.com/malvidah"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                border: "1px solid var(--border2)",
                color: "var(--ink2)",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section
        id="projects"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: "clamp(24px, 5vw, 80px)",
          paddingRight: "clamp(24px, 5vw, 80px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 64,
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Projects
          </h2>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink3)",
              letterSpacing: "0.1em",
            }}
          >
            {PROJECTS.length} selected
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PROJECTS.map((p, i) => (
            <div
              key={p.slug}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: "0 32px",
                padding: "36px 0",
                borderTop: i === 0 ? "1px solid var(--border)" : "none",
                borderBottom: "1px solid var(--border)",
                alignItems: "start",
              }}
            >
              {/* Year col */}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink3)",
                  letterSpacing: "0.06em",
                  paddingTop: 4,
                }}
              >
                {p.year}
              </div>

              {/* Main col */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <StatusDot status={p.status} />
                  <span
                    style={{
                      fontSize: "clamp(22px, 3vw, 36px)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.1,
                    }}
                  >
                    {p.title}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--ink3)",
                    letterSpacing: "0.06em",
                    marginBottom: 14,
                  }}
                >
                  {p.role}
                </div>

                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "var(--ink2)",
                    maxWidth: 620,
                    fontWeight: 300,
                    marginBottom: 16,
                  }}
                >
                  {p.description}
                </p>

                {/* Highlight pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: "rgba(200, 245, 60, 0.08)",
                    border: "1px solid rgba(200, 245, 60, 0.2)",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--accent)",
                    letterSpacing: "0.06em",
                    marginBottom: 18,
                  }}
                >
                  ↑ {p.highlight}
                </div>

                {/* Tech tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ink3)",
                        padding: "3px 9px",
                        border: "1px solid var(--border)",
                        borderRadius: 3,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links col */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                  paddingTop: 4,
                }}
              >
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--ink2)",
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  Visit ↗
                </a>
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--ink3)",
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      whiteSpace: "nowrap",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORK ── */}
      <section
        id="work"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: "clamp(24px, 5vw, 80px)",
          paddingRight: "clamp(24px, 5vw, 80px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 64,
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Work
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {TIMELINE.map((t, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "0 32px",
                padding: "36px 0",
                borderTop: i === 0 ? "1px solid var(--border)" : "none",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink3)",
                  letterSpacing: "0.06em",
                  paddingTop: 4,
                }}
              >
                {t.year}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(20px, 2.5vw, 30px)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.org}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--accent)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t.role}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "var(--ink2)",
                    maxWidth: 580,
                    fontWeight: 300,
                  }}
                >
                  {t.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STACK ── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          paddingLeft: "clamp(24px, 5vw, 80px)",
          paddingRight: "clamp(24px, 5vw, 80px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink3)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Stack & tools
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            "Next.js", "TypeScript", "Supabase", "Vercel", "Tailwind",
            "Electron", "Playwright", "TipTap", "GA4", "Figma",
            "Python", "SQLite", "Railway", "GitHub Actions",
          ].map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--ink2)",
                padding: "6px 14px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                letterSpacing: "0.04em",
                background: "var(--bg2)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section
        id="contact"
        style={{
          paddingTop: 100,
          paddingBottom: 120,
          paddingLeft: "clamp(24px, 5vw, 80px)",
          paddingRight: "clamp(24px, 5vw, 80px)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(40px, 6vw, 80px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          Let&rsquo;s talk.
        </h2>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: "var(--ink2)",
            maxWidth: 480,
            fontWeight: 300,
            marginBottom: 48,
          }}
        >
          Open to interesting conversations about media, AI, tools, or anything
          else that sits at the edge of something.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            { label: "Email", href: "mailto:marvin@marvinliyanage.com", mono: "marvin@marvinliyanage.com" },
            { label: "LinkedIn", href: "https://linkedin.com/in/marvinliyanage", mono: "linkedin" },
            { label: "GitHub", href: "https://github.com/malvidah", mono: "malvidah" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "16px 20px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg2)",
                minWidth: 160,
                transition: "border-color 0.15s",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink3)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {link.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--ink2)",
                  letterSpacing: "0.04em",
                }}
              >
                {link.mono} ↗
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          padding: "20px clamp(24px, 5vw, 80px)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink3)",
            letterSpacing: "0.06em",
          }}
        >
          © 2026 Marvin Liyanage
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink3)",
            letterSpacing: "0.06em",
          }}
        >
          Built with Next.js · Deployed on Vercel
        </span>
      </footer>
    </main>
  )
}
