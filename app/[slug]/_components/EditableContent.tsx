'use client'

import { useState } from 'react'
import PageContent from '../../../components/PageContent'
import EditButton from '../../../components/EditButton'
import getSupabaseBrowser from '@/lib/supabase-browser'

export default function EditableContent({ 
  page, 
  otherPages, 
  slug,
  onSave 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(page?.title || slug)
  const [editorState, setEditorState] = useState(page?.content || '')
  
  const handleEditClick = () => {
    setIsEditing(true)
  }
  
  const handleSaveClick = async () => {
    try {
      const supabase = getSupabaseBrowser()
      
      // Extract all links from content to check for new pages to create
      const extractLinks = (content: string) => {
        const linkRegex = /\[([^\]]+)\]/g;
        const matches = [];
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          matches.push(match[1]);
        }
        return [...new Set(matches)];
      };
      
      // Find all unique links in the content
      const links = extractLinks(editorState);
      
      // Check which links don't have corresponding pages yet
      const { data: existingPages } = await supabase
        .from('pages')
        .select('slug')
        .in('slug', links);
      
      // Determine which links need new pages
      const existingSlugs = existingPages?.map(p => p.slug) || [];
      const newSlugs = links.filter(link => !existingSlugs.includes(link));
      
      // Create new pages for new links
      for (const newSlug of newSlugs) {
        await supabase
          .from('pages')
          .insert({
            slug: newSlug,
            title: newSlug,
            content: `This is the ${newSlug} page. Edit me!`,
          });
      }
      
      // Continue with saving the current page
      if (!page) {
        // Create new current page logic (existing code)
        const { data } = await supabase
          .from('pages')
          .insert({
            slug,
            title,
            content: editorState
          })
          .select()
          .single()
          
        if (data) {
          setIsEditing(false)
          if (onSave) onSave()
          return true
        }
      } else {
        // Update existing page logic (existing code)
        const { data } = await supabase
          .from('pages')
          .update({
            title,
            content: editorState
          })
          .eq('slug', slug)
          .select()
          
        if (data) {
          setIsEditing(false)
          if (onSave) onSave()
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error saving page:', error)
      return false
    }
  }
  
  return (
    <div className="relative">
      {/* Page title */}
      <div className="mb-4">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold w-full px-2 py-1 border border-purple-300 rounded"
            placeholder="Page Title"
          />
        ) : (
          <h1 className="text-3xl font-bold">{title || slug}</h1>
        )}
      </div>
      
      {/* Page content */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={editorState}
            onChange={(e) => setEditorState(e.target.value)}
            className="w-full min-h-[300px] p-4 border border-purple-300 rounded font-mono"
            placeholder="Page content..."
          />
        ) : (
          <PageContent content={page?.content || ''} />
        )}
        
        {/* Edit/Save button */}
        <div className="absolute top-0 right-0">
          <EditButton 
            onClick={isEditing ? handleSaveClick : handleEditClick}
            isEditing={isEditing}
            pageId={page?.id}
            pageSlug={slug}
            editorState={editorState}
            title={title}
            onSave={handleSaveClick}
          />
        </div>
      </div>
    </div>
  )
} 