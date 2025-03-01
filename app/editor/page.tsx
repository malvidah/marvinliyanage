"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, Suspense } from "react"
import Editor from "@/components/Editor"
import getSupabaseBrowser from '@/lib/supabase-browser'

// Create a wrapper component that uses useSearchParams
function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  const [page, setPage] = useState({ id: '', content: '', title: '' })
  const [loading, setLoading] = useState(true)
  const [saveFunction, setSaveFunction] = useState(null)
  
  // Fetch the page content
  useEffect(() => {
    if (!slug) {
      router.push('/')
      return
    }
    
    async function fetchPage() {
      setLoading(true)
      try {
        const supabase = getSupabaseBrowser()
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .single()
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching page:', error)
          throw error
        }
        
        if (data) {
          setPage(data)
        } else {
          // New page - initialize with empty content
          setPage({ id: '', content: '', title: slug })
        }
      } catch (err) {
        console.error('Failed to load page:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPage()
  }, [slug, router])
  
  // Function to handle content saving
  const handleSave = useCallback(async (content) => {
    // This function is just a pass-through to the Editor's own save function
    // The actual save logic is in the Editor component
    if (saveFunction) {
      return await saveFunction()
    }
    return true
  }, [saveFunction])
  
  // Receive save function reference from the Editor component
  const handleSaveRef = useCallback((fn) => {
    setSaveFunction(() => fn)
  }, [])
  
  if (!slug) return null
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Loading editor...</h1>
        <div className="animate-pulse h-64 bg-gray-100 rounded-md"></div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Editing: {page.title || slug}</h1>
      <Editor 
        content={page.content || ''} 
        pageId={page.id} 
        slug={slug} 
        onSave={handleSave}
        saveRef={handleSaveRef}
      />
    </div>
  )
}

// Main component that wraps EditorContent with Suspense
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Loading editor...</h1>
        <div className="animate-pulse h-64 bg-gray-100 rounded-md"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}

