"use client"

import { useRef, useCallback, useLayoutEffect } from "react"

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
  const isEditing = useRef(false)

  // Sync innerHTML from value, but never interrupt the user while they're typing
  useLayoutEffect(() => {
    if (ref.current && !isEditing.current) {
      ref.current.innerHTML = value
    }
  }, [value])

  const handleFocus = useCallback(() => {
    isEditing.current = true
    // move cursor to end
    const el = ref.current
    if (!el) return
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [])

  const handleBlur = useCallback(() => {
    isEditing.current = false
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
        isEditing.current = false
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
      onFocus={isAdmin ? handleFocus : undefined}
      onBlur={isAdmin ? handleBlur : undefined}
      onKeyDown={isAdmin ? handleKeyDown : undefined}
      onClick={isAdmin ? (e) => e.stopPropagation() : undefined}
      style={{
        ...style,
        ...(isAdmin ? { cursor: "text", outline: "none" } : {}),
      }}
      className={className}
    />
  )
}
