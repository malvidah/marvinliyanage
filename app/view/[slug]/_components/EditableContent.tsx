'use client'

import { useState, useEffect } from 'react';
import getSupabaseBrowser from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

interface EditableContentProps {
  page: any;
  otherPages: any[];
  slug: string;
  onSave?: () => void;
}

export default function EditableContent({ page, otherPages, slug, onSave }: EditableContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreate = searchParams.get('create') === 'true';
  
  const [title, setTitle] = useState(page?.title || slug);
  const [content, setContent] = useState(page?.content || '');
  const [isEditing, setIsEditing] = useState(isCreate);
  const [isSaving, setIsSaving] = useState(false);
  
  async function savePage() {
    if (!title.trim()) return;
    
    setIsSaving(true);
    
    try {
      const supabase = getSupabaseBrowser();
      
      if (page?.id) {
        // Update existing page
        await supabase
          .from('pages')
          .update({
            title,
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', page.id);
      } else {
        // Create new page
        await supabase
          .from('pages')
          .insert({
            slug,
            title,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        // Redirect to the page without the create param
        router.push(`/${slug}`);
      }
      
      // Call the onSave callback if provided
      if (onSave) onSave();
      
      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setIsSaving(false);
    }
  }
  
  // If we're in create mode and there's no page, show edit form
  useEffect(() => {
    if (isCreate && !page) {
      setIsEditing(true);
    }
  }, [isCreate, page]);
  
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder="Page title"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder="Enter page content here..."
          />
          <p className="mt-2 text-sm text-gray-500">
            Use [slug] to link to other pages.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          {page && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
          
          <button
            type="button"
            onClick={savePage}
            className="rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }
  
  // Import and use PageContent when not editing
  const PageContent = dynamic(() => import('@/components/PageContent'), { 
    loading: () => <div className="animate-pulse">Loading content...</div>
  });
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {title || slug}
        </h1>
        
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="ml-3 rounded-md border border-transparent bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200"
        >
          Edit
        </button>
      </div>
      
      <div className="prose prose-purple max-w-none">
        {content ? (
          <PageContent content={content} />
        ) : (
          <p className="text-gray-500 italic">This page is empty. Click Edit to add content.</p>
        )}
      </div>
    </div>
  );
} 