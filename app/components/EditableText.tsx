"use client"

import { useRef, useCallback } from "react"

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

  const handleBlur = useCallback(() => {
    const newVal = ref.current?.innerHTML?.trim() ?? ""
    if (newVal !== value) onSave(newVal)
  }, [value, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault()
        ref.current?.blur()
      }
      if (e.key === "Escape") {
        if (ref.current) ref.current.innerHTML = value
        ref.current?.blur()
      }
    },
    [value, multiline]
  )

  return (
    <Tag
      ref={ref as any}
      contentEditable={isAdmin}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: value }}
      onBlur={isAdmin ? handleBlur : undefined}
      onKeyDown={isAdmin ? handleKeyDown : undefined}
      onClick={isAdmin ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
      style={{
        ...style,
        ...(isAdmin ? { cursor: "text", outline: "none" } : {}),
      }}
      className={className}
    />
  )
}
