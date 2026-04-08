"use client"

import { useRef, useState, useCallback } from "react"

type Props = {
  value: string
  isAdmin: boolean
  onSave: (newValue: string) => void
  as?: "span" | "p" | "h1" | "h2" | "div"
  style?: React.CSSProperties
  className?: string
  multiline?: boolean
}

export default function EditableText({
  value,
  isAdmin,
  onSave,
  as: Tag = "span",
  style,
  className,
  multiline = false,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const [editing, setEditing] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleBlur = useCallback(() => {
    setEditing(false)
    const newVal = ref.current?.innerText?.trim() ?? ""
    if (newVal && newVal !== value) {
      onSave(newVal)
    }
  }, [value, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault()
        ref.current?.blur()
      }
      if (e.key === "Escape") {
        if (ref.current) ref.current.innerText = value
        ref.current?.blur()
      }
    },
    [value, multiline]
  )

  const adminStyles: React.CSSProperties =
    isAdmin && hovered && !editing
      ? {
          outline: "1px dashed rgba(0,0,0,0.15)",
          outlineOffset: 4,
          borderRadius: 4,
          cursor: "text",
        }
      : isAdmin && editing
      ? {
          outline: "2px solid rgba(26,26,26,0.3)",
          outlineOffset: 4,
          borderRadius: 4,
          background: "rgba(245,245,240,0.5)",
        }
      : {}

  return (
    <Tag
      ref={ref as any}
      contentEditable={isAdmin && editing}
      suppressContentEditableWarning
      onClick={() => isAdmin && setEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...style, ...adminStyles, transition: "outline 0.15s" }}
      className={className}
    >
      {value}
    </Tag>
  )
}
