"use client"

import { useRef, useEffect } from "react"

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
  // Keep a ref to latest value so callbacks never have stale closures
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  // Sync display content when value changes and user is not editing
  useEffect(() => {
    const el = ref.current
    if (el && !el.hasAttribute("contenteditable")) {
      el.innerHTML = value
    }
  }, [value])

  function startEditing(e: React.MouseEvent) {
    if (!isAdmin) return
    e.stopPropagation()
    const el = ref.current
    if (!el || el.hasAttribute("contenteditable")) return
    el.setAttribute("contenteditable", "true")
    el.style.outline = "none"
    el.focus()
    // cursor to end
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  function stopEditing() {
    const el = ref.current
    if (!el) return
    el.removeAttribute("contenteditable")
    const newVal = el.innerHTML.trim()
    if (newVal !== valueRef.current) onSave(newVal)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault()
      ref.current?.blur()
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.innerHTML = valueRef.current
      ref.current?.blur()
    }
  }

  return (
    <Tag
      ref={ref as any}
      dangerouslySetInnerHTML={{ __html: value }}
      suppressContentEditableWarning
      onClick={startEditing}
      onBlur={stopEditing}
      onKeyDown={handleKeyDown}
      style={{ ...style, ...(isAdmin ? { cursor: "text" } : {}) }}
      className={className}
    />
  )
}
