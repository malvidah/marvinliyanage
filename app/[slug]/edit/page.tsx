"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import Editor from "@/components/Editor"
import getSupabaseBrowser from '@/lib/supabase-browser'

export default function SlugEditPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  
  // Redirect to the main editor page with the slug as a parameter
  useEffect(() => {
    if (slug) {
      router.replace(`/editor?slug=${slug}`)
    }
  }, [slug, router])
  
  return (
    <div className="container mx-auto p-4">
      <p>Redirecting to editor...</p>
    </div>
  )
} 