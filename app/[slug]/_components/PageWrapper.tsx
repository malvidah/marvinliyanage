'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import PageGraphView from '@/components/PageGraphView'
import PageContent from '@/components/PageContent'
import Editor from '@/components/Editor'
import EditButton from '@/components/EditButton'
import getSupabaseBrowser from '@/lib/supabase-browser'
import ContentRenderer from '@/components/ContentRenderer'

export default function PageWrapper({ 
  page: initialPage, 
  otherPages, 
  slug,
  createNewPage,
  setCreateNewPage
}) {
  const searchParams = useSearchParams();
  const createParam = searchParams.get('create');
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(createNewPage)
  const [editedTitle, setEditedTitle] = useState(initialPage?.title || '')
  const [pageContent, setPageContent] = useState(initialPage?.content || '')
  const savePageRef = useRef<() => Promise<boolean>>(async () => false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [graphUpdateTrigger, setGraphUpdateTrigger] = useState(0);
  
  // Simplified page creation logic
  useEffect(() => {
    async function createPage() {
      if (!initialPage && (createParam === 'true' || createNewPage)) {
        console.log('Creating new page:', slug);
        const decodedSlug = decodeURIComponent(slug);
        
        // Format the title more concisely
        const formattedTitle = decodedSlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
        
        const { data: newPage } = await getSupabaseBrowser()
          .from('pages')
          .insert({
            title: formattedTitle,
            slug: decodedSlug,
            content: '',
          })
          .select();
        
        if (newPage?.[0]) {
          setPage(newPage[0]);
          setEditedTitle(newPage[0].title);
          setPageContent(newPage[0].content);
        }
        
        setLoading(false);
      } else if (!initialPage) {
        setLoading(false);
      }
    }
    
    if (createNewPage || (createParam === 'true' && !page)) {
      createPage();
    } else if (!initialPage && !loading) {
      setLoading(false);
    }
  }, [initialPage, slug, createParam, createNewPage, page, loading]);
  
  // Simplified title save function
  const handleTitleSave = async () => {
    if (!page?.id) return false;
    
    try {
      // Just update the title
      const { error } = await getSupabaseBrowser()
        .from('pages')
        .update({ title: editedTitle })
        .eq('id', page.id);
        
      if (error) {
        console.error('Error updating title:', error);
        return false;
      }
      
      // Update local state
      setPage(prev => prev ? {...prev, title: editedTitle} : prev);
      return true;
    } catch (err) {
      console.error('Error saving title:', err);
      return false;
    }
  };
  
  // Add back the needed function that was removed
  const handleSaveTitle = async (content) => {
    if (!page?.id) return false
    
    try {
      const { error } = await getSupabaseBrowser()
        .from('pages')
        .update({ 
          title: editedTitle,
          content: content 
        })
        .eq('id', page.id)
        
      if (error) {
        console.error('Error saving title:', error)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Error in handleSaveTitle:', err)
      return false
    }
  }
  
  // Handle content save
  const handleSave = async (content) => {
    if (!page?.id || !content) return false;
    
    try {
      setPageContent(content);
      
      const { error } = await getSupabaseBrowser()
        .from('pages')
        .update({ 
          title: editedTitle,
          content: content 
        })
        .eq('id', page.id);
        
      if (error) {
        console.error("Error saving:", error);
        return false;
      }
      
      // Ensure graph updates after save
      setTimeout(() => {
        setGraphUpdateTrigger(prev => prev + 1);
      }, 500); // Delay to ensure database writes complete
      
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  }
  
  // Reset edit mode when page loads or changes
  useEffect(() => {
    setIsEditing(false);
  }, [slug, initialPage]);
  
  // Set up save function for EditButton
  const setSaveFunction = useCallback((saveFunction) => {
    // Create a more reliable wrapped function
    const wrappedSaveFunction = async () => {
      try {
        let success = true;
        
        // Only attempt to save if we have a save function
        if (saveFunction) {
          success = await saveFunction();
        }
        
        // Update title if needed and if previous step was successful
        if (success && editedTitle !== page?.title) {
          await handleTitleSave();
        }
        
        // Always return to view mode, regardless of save success
        setTimeout(() => {
          setIsEditing(false);
        }, 300);
        
        return success;
      } catch (error) {
        console.error('Error saving:', error);
        // Still exit editing mode even on error
        setTimeout(() => {
          setIsEditing(false);
        }, 300);
        return false;
      }
    };
    
    savePageRef.current = wrappedSaveFunction;
  }, [page?.title, editedTitle, handleTitleSave]);
  
  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditing(prevState => {
      if (!prevState) {
        setEditedTitle(page?.title || '');
      }
      return !prevState;
    });
  }, [page?.title]);
  
  // Determine if content is structured (JSON) or HTML string
  const isStructuredContent = typeof page?.content === 'object'
  
  return (
    <Layout>
      {page ? (
        <PageGraphView 
          currentSlug={page.slug} 
          currentContent={pageContent} 
          currentTitle={page.title}
          updateTrigger={graphUpdateTrigger}
        />
      ) : (
        <div className="mb-8 overflow-hidden rounded-lg bg-purple-100">
          <div className="flex justify-center items-center h-40 bg-purple-100">
            <span className="text-purple-700">
              {loading ? "Loading..." : "No page data available"}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-6">
        <div className="flex-grow">
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-3xl font-bold w-full focus:outline-none"
              placeholder="Page Title"
            />
          ) : (
            <h1 className="text-3xl font-bold">
              {page ? page.title : slug ? 
                decodeURIComponent(slug)
                  .replace(/-/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ') 
                : "New Page"
              }
            </h1>
          )}
        </div>
        
        <div className="ml-4">
          {page && (
            <EditButton 
              onClick={toggleEditMode} 
              isEditing={isEditing} 
              onSave={isEditing ? savePageRef.current : undefined}
              pageId={page.id}
              pageSlug={page.slug}
            />
          )}
        </div>
      </div>
      
      <article className="prose prose-lg max-w-none mb-16">
        {loading ? (
          <div className="text-gray-500">Loading content...</div>
        ) : page ? (
          isEditing ? (
            <Editor 
              content={page.content} 
              pageId={page.id} 
              slug={page.slug}
              onSave={handleSave}
              saveRef={setSaveFunction}
              onContentChange={(newContent) => {
                setPageContent(newContent)
                setPage(prev => prev ? {...prev, content: newContent} : prev)
              }}
            />
          ) : (
            isStructuredContent ? (
              <ContentRenderer content={page?.content} />
            ) : (
              <PageContent content={page?.content || ''} />
            )
          )
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-300 text-xl italic font-archivo">
              The page "{decodeURIComponent(slug)}" doesn't exist.
            </p>
          </div>
        )}
      </article>
    </Layout>
  )
} 