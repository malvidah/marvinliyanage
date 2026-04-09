"use client"

import { useRef, useState } from "react"

type Props = {
  slug: string
  imageUrl: string | null
  gradientClass: string
  title: string
  isAdmin: boolean
  onUploaded: (url: string) => void
  projectUrl?: string | null
  style?: React.CSSProperties
}

export default function EditableImage({
  slug,
  imageUrl,
  gradientClass,
  title,
  isAdmin,
  onUploaded,
  projectUrl,
  style,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const [uploading, setUploading] = useState(false)

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.82)
      }
      img.src = URL.createObjectURL(file)
    })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const compressed = await compressImage(file)
    const form = new FormData()
    form.append("file", compressed, `${slug}.jpg`)
    form.append("slug", slug)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (data.imageUrl) onUploaded(data.imageUrl)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
      // Reset so the same file can be re-selected and onChange fires next time
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (isAdmin) {
      inputRef.current?.click()
    } else if (projectUrl) {
      window.open(projectUrl, "_blank", "noopener noreferrer")
    }
  }

  return (
    <div
      className={imageUrl ? undefined : gradientClass}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        cursor: isAdmin ? "pointer" : projectUrl ? "pointer" : "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
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
            fontSize: "clamp(16px, 2.5vw, 40px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textAlign: "center",
            padding: "0 24px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            wordBreak: "break-word",
            lineHeight: 1.2,
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
