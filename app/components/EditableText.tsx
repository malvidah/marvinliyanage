"use client"

import { useRef, useState, useCallback, useEffect } from "react"

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

  // Sync innerHTML from value when NOT editing (React never touches innerHTML directly)
  useEffect(() => {
    if (!editing && ref.current) {
      ref.current.innerHTML = value
    }
  }, [value, editing])

  // When editing starts: focus + move cursor to end
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isAdmin && !editing) {
        e.stopPropagation()
        setEditing(true)
      }
    },
    [isAdmin, editing]
  )

  const handleBlur = useCallback(() => {
    setEditing(false)
    const newVal = ref.current?.innerHTML?.trim() ?? ""
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
        if (ref.current) ref.current.innerHTML = value
        ref.current?.blur()
      }
    },
    [value, multiline]
  )

  return (
    <Tag
      ref={ref as any}
      contentEditable={isAdmin && editing}
      suppressContentEditableWarning
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{ ...style, ...(isAdmin ? { cursor: "text", outline: "none" } : {}) }}
      className={className}
    />
  )
}
