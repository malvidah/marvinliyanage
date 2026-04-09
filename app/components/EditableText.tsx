"use client"

import { useRef, useState, useCallback, useLayoutEffect } from "react"

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
  const editRef = useRef<HTMLElement>(null)
  const [editing, setEditing] = useState(false)

  // useLayoutEffect fires synchronously before paint — populate content before user sees it
  useLayoutEffect(() => {
    if (editing && editRef.current) {
      editRef.current.innerHTML = value
      editRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const handleBlur = useCallback(() => {
    const newVal = editRef.current?.innerHTML?.trim() ?? ""
    setEditing(false)
    if (newVal && newVal !== value) onSave(newVal)
  }, [value, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault()
        editRef.current?.blur()
      }
      if (e.key === "Escape") {
        if (editRef.current) editRef.current.innerHTML = value
        editRef.current?.blur()
      }
    },
    [value, multiline]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isAdmin) {
        e.stopPropagation()
        setEditing(true)
      }
    },
    [isAdmin]
  )

  // Editing: a fresh element React hasn't touched yet — useLayoutEffect populates it
  if (editing) {
    return (
      <Tag
        ref={editRef as any}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ ...style, outline: "none", cursor: "text" }}
        className={className}
      />
    )
  }

  // Display: React controls this via dangerouslySetInnerHTML
  return (
    <Tag
      dangerouslySetInnerHTML={{ __html: value }}
      onClick={handleClick}
      style={{ ...style, ...(isAdmin ? { cursor: "text" } : {}) }}
      className={className}
    />
  )
}
