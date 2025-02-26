import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import PageGraphView from '@/components/PageGraphView';
import PageContent from '@/components/PageContent';
import Editor from '@/components/Editor';
import EditButton from '@/components/EditButton';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { GetStaticProps } from 'next';

interface HelloPageProps {
  page: {
    id: string;
    title: string;
    content: string;
    slug: string;
  } | null;
  otherPages: { slug: string; title: string }[];
}

export default function HelloPage({ page, otherPages }: HelloPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loadedPage, setLoadedPage] = useState(page);
  const [editedTitle, setEditedTitle] = useState(page?.title || 'Hello');
  const [pageContent, setPageContent] = useState(page?.content || '');
  const savePageRef = useRef<() => Promise<boolean>>(async () => false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Ensure the page exists in database
    async function createPageIfNeeded() {
      if (!page) {
        // Create the Hello page if it doesn't exist
        const { data } = await supabase
          .from('pages')
          .insert({
            title: 'Hello',
            slug: 'hello',
            content: `<h1>Hello (world),</h1>
            <p>My name is Marvin. I'm a San Francisco-based writer and filmmaker telling stories about science, technology, and 
            innovation to inspire more people to build the future and so I can make better sci-fi films — I founded
            <a href="https://storycompany.co" target="_blank" rel="noopener noreferrer"> Story Company</a> for this purpose in 2024.</p>`,
          })
          .select();
          
        if (data) {
          setLoadedPage(data[0]);
          setEditedTitle(data[0].title);
        }
      }
    }
    
    if (!loadedPage) {
      createPageIfNeeded();
    }
  }, [page, loadedPage]);
  
  // Focus title input when switching to edit mode
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);
  
  // Update pageContent whenever loadedPage changes
  useEffect(() => {
    if (loadedPage?.content) {
      setPageContent(loadedPage.content);
    }
  }, [loadedPage]);
  
  const handleSaveTitle = async (content: string) => {
    if (!loadedPage?.id) return false;
    
    try {
      const { error } = await supabase
        .from('pages')
        .update({ 
          title: editedTitle,
          content: content 
        })
        .eq('id', loadedPage.id);
        
      if (error) {
        console.error('Error saving title:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in handleSaveTitle:', err);
      return false;
    }
  };
  
  const handleSave = async () => {
    // Refresh the page data after save
    if (loadedPage?.slug) {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', loadedPage.slug)
          .single();
        
        if (error) {
          console.error("Error refreshing page data:", error);
          return;
        }
          
        if (data) {
          console.log("Updated page data:", data);
          setLoadedPage(data);
          setEditedTitle(data.title);
          setPageContent(data.content);
        }
      } catch (err) {
        console.error("Error in handleSave:", err);
      }
    }
  };
  
  const setSaveFunction = useCallback((saveFunction: () => Promise<boolean>) => {
    const wrappedSaveFunction = async () => {
      // Get the content from the saveFunction first
      const success = await saveFunction();
      if (success) {
        // If content save was successful, save the title too
        return await handleSaveTitle(loadedPage?.content || '');
      }
      return false;
    };
    
    savePageRef.current = wrappedSaveFunction;
  }, [loadedPage?.content, loadedPage?.id]);
  
  const toggleEditMode = useCallback(async () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedTitle(loadedPage?.title || 'Hello');
      setIsEditing(true);
    }
  }, [isEditing, loadedPage?.title]);
  
  if (!loadedPage) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${loadedPage.title} — Marvin Liyanage`}>
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-center">
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-3xl font-medium w-full focus:outline-none"
              placeholder="Page Title"
            />
          ) : (
            <h1 className="text-3xl font-medium">{loadedPage.title}</h1>
          )}
        </div>
        
        <div className="flex justify-end mt-4 mb-2">
          <EditButton 
            onClick={toggleEditMode} 
            isEditing={isEditing} 
            onSave={isEditing ? savePageRef.current : undefined}
          />
        </div>
      </div>
      
      <PageGraphView 
        currentSlug="hello" 
        currentContent={pageContent} 
        currentTitle={loadedPage.title}
      />
      
      <article className="prose prose-lg max-w-none mb-16">
        {isEditing ? (
          <Editor 
            content={loadedPage.content} 
            pageId={loadedPage.id} 
            slug={loadedPage.slug}
            onSave={handleSave}
            saveRef={setSaveFunction}
            onContentChange={(newContent) => setPageContent(newContent)}
          />
        ) : (
          <PageContent content={loadedPage.content} />
        )}
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    // Get the hello page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'hello')
      .single();
    
    // Get other pages for the explorer section
    const { data: otherPagesData, error: otherPagesError } = await supabase
      .from('pages')
      .select('slug, title')
      .neq('slug', 'hello')
      .order('title');
      
    if (pageError && pageError.code !== 'PGRST116') {
      console.error('Error fetching hello page:', pageError);
    }
    
    if (otherPagesError) {
      console.error('Error fetching other pages:', otherPagesError);
    }
    
    return {
      props: {
        page: pageData || null,
        otherPages: otherPagesData || [],
      },
      revalidate: 60,
    };
  } catch (err) {
    console.error('Error in getStaticProps:', err);
    return { 
      props: { 
        page: null,
        otherPages: []
      }
    };
  }
}; 