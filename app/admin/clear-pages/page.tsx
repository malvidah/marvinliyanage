'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import getSupabaseBrowser from '@/lib/supabase-browser'

export default function ClearDatabase() {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const clearAllPages = async () => {
    if (!confirm('Are you sure you want to delete ALL pages? This cannot be undone!')) return
    
    setLoading(true)
    try {
      const { error } = await getSupabaseBrowser()
        .from('pages')
        .delete()
        .not('id', 'is', null) // Safety check to ensure we're deleting correctly
      
      if (error) throw error
      setMessage('All pages deleted successfully!')
    } catch (error) {
      console.error('Error clearing database:', error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const clearOrphanPages = async () => {
    setLoading(true)
    try {
      // Find all page slugs that are referenced in content but don't exist
      const { data: allPages, error: fetchError } = await getSupabaseBrowser()
        .from('pages')
        .select('slug, content')
      
      if (fetchError) throw fetchError
      
      // Get all existing slugs
      const existingSlugs = new Set(allPages.map(page => page.slug))
      
      // Find linked slugs in content
      const linkedSlugs = new Set()
      const regex = /\[([^\]]+)\]/g
      
      allPages.forEach(page => {
        // Ensure content is a string (handle JSONB case)
        const contentStr = typeof page.content === 'string' 
          ? page.content 
          : JSON.stringify(page.content)
        
        let match
        while ((match = regex.exec(contentStr)) !== null) {
          linkedSlugs.add(match[1])
        }
      })
      
      // Pages that don't exist but are referenced
      const orphanedSlugs = Array.from(linkedSlugs)
        .filter(slug => !existingSlugs.has(slug))
      
      setMessage(`Found ${orphanedSlugs.length} orphaned references: ${orphanedSlugs.join(', ')}`)
    } catch (error) {
      console.error('Error finding orphans:', error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const createOrphanedPages = async () => {
    setLoading(true)
    try {
      // Find all page slugs that are referenced in content but don't exist
      const { data: allPages, error: fetchError } = await getSupabaseBrowser()
        .from('pages')
        .select('slug, content')
      
      if (fetchError) throw fetchError
      
      // Get all existing slugs
      const existingSlugs = new Set(allPages.map(page => page.slug))
      
      // Find linked slugs in content
      const linkedSlugs = new Set()
      const regex = /\[([^\]]+)\]/g
      
      allPages.forEach(page => {
        // Ensure content is a string (handle JSONB case)
        const contentStr = typeof page.content === 'string' 
          ? page.content 
          : JSON.stringify(page.content)
        
        let match
        while ((match = regex.exec(contentStr)) !== null) {
          linkedSlugs.add(match[1])
        }
      })
      
      // Pages that don't exist but are referenced
      const orphanedSlugs = Array.from(linkedSlugs)
        .filter(slug => !existingSlugs.has(slug))
      
      if (orphanedSlugs.length === 0) {
        setMessage('No orphaned references found!')
        return
      }
      
      // Create pages for orphaned slugs
      const newPages = orphanedSlugs.map(slug => {
        // Format title from slug - replace hyphens with spaces and capitalize
        const title = slug
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          title,
          slug,
          content: `<h1>${title}</h1>\n<p>This page was automatically created to resolve a broken link.</p>`
        }
      })
      
      // Insert new pages
      const { data, error } = await getSupabaseBrowser()
        .from('pages')
        .insert(newPages)
        .select()
      
      if (error) throw error
      
      setMessage(`Created ${newPages.length} pages for orphaned references: ${orphanedSlugs.join(', ')}`)
    } catch (error) {
      console.error('Error creating orphaned pages:', error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  if (!session?.user?.isAdmin) {
    return <div>Admin access required</div>
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Cleanup</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded bg-red-50">
          <h2 className="text-xl font-bold mb-2">Danger Zone</h2>
          <p className="mb-4">These actions cannot be undone.</p>
          
          <div className="flex space-x-4">
            <button
              onClick={clearAllPages}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Clear All Pages'}
            </button>
            
            <button
              onClick={clearOrphanPages}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Find Orphaned References'}
            </button>
            
            <button
              onClick={createOrphanedPages}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Create Pages for Orphaned Links'}
            </button>
          </div>
        </div>
        
        {message && (
          <div className="p-4 border rounded bg-blue-50">
            <pre className="whitespace-pre-wrap">{message}</pre>
          </div>
        )}
      </div>
    </div>
  )
} 