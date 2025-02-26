import Link from 'next/link';
import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRouter } from 'next/router';
import supabase from '@/lib/supabase';

interface PageContentProps {
  content: string;
}

export default function PageContent({ content }: PageContentProps) {
  const [processedContent, setProcessedContent] = useState('');
  const router = useRouter();
  
  // Handle page link clicks - check if page exists, create if needed
  const handlePageLinkClick = async (e: MouseEvent, slug: string) => {
    e.preventDefault();
    
    // Check if the page exists
    const { data, error } = await supabase
      .from('pages')
      .select('slug')
      .eq('slug', slug)
      .single();
      
    // If page doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      const title = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      await supabase
        .from('pages')
        .insert({
          title,
          slug,
          content: '',
        });
    }
    
    // Navigate to the page
    router.push(`/${slug}`);
  };
  
  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }
    
    // Process content to turn markdown/special syntax into HTML with chips
    let processed = content;
    
    // Transform @account links into black chips
    processed = processed.replace(
      /@(\w+)/g, 
      '<a href="https://x.com/$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-black text-white hover:opacity-90">@$1</a>'
    );
    
    // Transform [page link] into purple chips
    processed = processed.replace(
      /\[([^\]]+)\]/g, 
      '<a href="/$1" class="page-link inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-purple-100 text-purple-800 hover:opacity-90" data-slug="$1">$1</a>'
    );
    
    // Handle YouTube embeds
    processed = processed.replace(
      /<iframe.*?youtube.com\/embed\/([a-zA-Z0-9_-]+).*?<\/iframe>/g,
      '<div class="aspect-w-16 aspect-h-9 my-4"><iframe src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
    );
    
    // Sanitize the HTML to prevent XSS
    const clean = DOMPurify.sanitize(processed, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'data-slug']
    });
    
    setProcessedContent(clean);
  }, [content]);
  
  // Add click handlers for page links
  useEffect(() => {
    if (!processedContent) return;
    
    const pageLinks = document.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const slug = (link as HTMLElement).dataset.slug;
        if (slug) {
          handlePageLinkClick(e as MouseEvent, slug);
        }
      });
    });
    
    return () => {
      pageLinks.forEach(link => {
        link.removeEventListener('click', () => {});
      });
    };
  }, [processedContent]);

  if (!processedContent) {
    return <p className="text-gray-500 italic">This page is empty. Click the edit button to add content.</p>;
  }

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
} 