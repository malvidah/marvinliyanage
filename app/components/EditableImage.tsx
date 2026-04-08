"use client"

import { useRef, useState } from "react"

type Props = {
  slug: string
  imageUrl: string | null
  gradientClass: string
  title: string
  isAdmin: boolean
  onUploaded: (url: string) => void
  style?: React.CSSProperties
}

export default function EditableImage({
  slug,
  imageUrl,
  gradientClass,
  title,
  isAdmin,
  onUploaded,
  style,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    form.append("slug", slug)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (data.imageUrl) onUploaded(data.imageUrl)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={imageUrl ? undefined : gradientClass}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        cursor: isAdmin ? "pointer" : "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isAdmin && inputRef.current?.click()}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 48px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textAlign: "center",
            padding: "0 20px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      )}

      {/* Admin upload overlay */}
      {isAdmin && hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
            transition: "opacity 0.15s",
          }}
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "white",
              fontWeight: 500,
            }}
          >
            {uploading ? "Uploading..." : "Replace image"}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: "none" }}
      />
    </div>
  )
}
