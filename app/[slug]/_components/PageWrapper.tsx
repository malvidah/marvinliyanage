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
  
  // For debugging, add this console log
  useEffect(() => {
    console.log('Session status:', status, 'Admin:', session?.user?.isAdmin)
  }, [session, status])
  
  // Create the page if needed
  useEffect(() => {
    async function createPage() {
      // Only create a page if explicitly requested with the 'create' parameter
      // OR if the user is coming from a link click (createNewPage is true)
      if (!initialPage && (createParam === 'true' || createNewPage)) {
        console.log('Creating new page:', slug);
        // First decode the URL-encoded slug to remove %20 etc.
        const decodedSlug = decodeURIComponent(slug);
        
        // Format the title from the slug - replace hyphens with spaces and capitalize
        const formattedTitle = decodedSlug
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Create a new page with the formatted title
        const { data: newPage } = await getSupabaseBrowser()
          .from('pages')
          .insert({
            title: formattedTitle,
            slug: decodedSlug,
            content: '', // Empty content
          })
          .select();
        
        if (newPage && newPage[0]) {
          setPage(newPage[0]);
          setEditedTitle(newPage[0].title);
          setPageContent(newPage[0].content);
        }
        
        setLoading(false);
      } else if (!initialPage && createParam !== 'true' && !createNewPage) {
        // Page doesn't exist and we're not explicitly creating it
        setLoading(false);
      }
    }
    
    if (createNewPage || (createParam === 'true' && !page)) {
      createPage();
    } else if (!initialPage && !loading) {
      // If page doesn't exist and we're not creating it, stop loading
      setLoading(false);
    }
  }, [initialPage, slug, createParam, createNewPage, page, loading]);
  
  // Handle title save
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
      
      // Only update the graph after a successful save
      setGraphUpdateTrigger(prev => prev + 1);
      
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  }
  
  // Handle title changes that create new slugs
  const handleTitleSave = async () => {
    if (!page?.id) return false;
    
    try {
      // Update title only first
      const { error: titleError } = await getSupabaseBrowser()
        .from('pages')
        .update({ title: editedTitle })
        .eq('id', page.id);
        
      if (titleError) {
        console.error('Error updating title:', titleError);
        return false;
      }
      
      // Generate new slug from title (optional - only if slug change is desired)
      const newSlug = editedTitle
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      // If user wants to update the slug too, add a toggle or checkbox
      const updateSlug = false; // Set this based on user input
      
      if (updateSlug && newSlug !== page.slug) {
        // Update the slug in this page
        const { error: slugError } = await getSupabaseBrowser()
          .from('pages')
          .update({ slug: newSlug })
          .eq('id', page.id);
          
        if (slugError) {
          console.error('Error updating slug:', slugError);
          return true; // At least title was updated
        }
        
        // Update links in other pages
        const { data: pagesWithLinks } = await getSupabaseBrowser()
          .from('pages')
          .select('id, content')
          .filter('content', 'ilike', `%[${page.slug}]%`);
          
        if (pagesWithLinks) {
          for (const p of pagesWithLinks) {
            const updatedContent = p.content.replace(
              new RegExp(`\\[${page.slug}\\]`, 'g'), 
              `[${newSlug}]`
            );
            
            await getSupabaseBrowser()
              .from('pages')
              .update({ content: updatedContent })
              .eq('id', p.id);
          }
        }
        
        // Update local state
        setPage(prev => prev ? {...prev, slug: newSlug} : prev);
        
        // Navigate to new URL without creating a new page
        router.push(`/${newSlug}`);
      }
      
      // Update local state with new title
      setPage(prev => prev ? {...prev, title: editedTitle} : prev);
      
      return true;
    } catch (err) {
      console.error('Error in handleTitleSave:', err);
      return false;
    }
  };
  
  // Set up save function for EditButton
  const setSaveFunction = useCallback((saveFunction) => {
    // Create a more reliable wrapped function
    const wrappedSaveFunction = async () => {
      try {
        const success = await saveFunction();
        if (success) {
          // Only attempt title updates if the title has changed
          if (editedTitle !== page?.title) {
            return await handleTitleSave();
          }
          // Otherwise just update the content
          return await handleSaveTitle(page?.content || '');
        }
        return false;
      } catch (error) {
        console.error('Error saving:', error);
        return false;
      }
    };
    
    savePageRef.current = wrappedSaveFunction;
  }, [page?.content, page?.id, page?.title, editedTitle]);
  
  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => {
      if (!prev) {
        setEditedTitle(page?.title || '')
      }
      return !prev
    })
  }, [page?.title])
  
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
            <PageContent content={page.content} />
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