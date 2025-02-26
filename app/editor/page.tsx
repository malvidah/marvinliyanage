"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import YouTube from "@tiptap/extension-youtube"
import { useCallback, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

const CustomDocument = StarterKit.configure({
  document: {
    content: "heading block*",
  },
})

const Tiptap = ({ initialContent, onSave }) => {
  const editor = useEditor({
    extensions: [
      CustomDocument,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      YouTube.configure({
        controls: false,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onSave(editor.getHTML())
    },
  })

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const file = event.dataTransfer?.files[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          editor
            ?.chain()
            .focus()
            .setImage({ src: e.target?.result as string })
            .run()
        }
        reader.readAsDataURL(file)
      }
    },
    [editor],
  )

  useEffect(() => {
    const element = document.querySelector(".ProseMirror")
    if (element) {
      element.addEventListener("drop", handleDrop)
      return () => element.removeEventListener("drop", handleDrop)
    }
  }, [handleDrop])

  return <EditorContent editor={editor} />
}

export default function EditorPage() {
  const [content, setContent] = useState("")
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/admin")
      }
    }
    checkUser()
  }, [supabase.auth, router])

  const handleSave = async (newContent: string) => {
    setContent(newContent)
    const { data, error } = await supabase
      .from("wiki_pages")
      .upsert({ content: newContent, updated_at: new Date().toISOString() })
    if (error) console.error("Error saving content:", error)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Wiki Editor</h1>
      <Tiptap initialContent={content} onSave={handleSave} />
    </div>
  )
}

