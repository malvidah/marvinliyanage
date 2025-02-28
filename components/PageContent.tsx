'use client'

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRouter } from 'next/navigation';
import getSupabaseBrowser from '@/lib/supabase-browser';

interface PageContentProps {
  content: string;
}

// Cache for page titles to reduce database queries
const pageTitleCache: Record<string, string> = {};

export default function PageContent({ content = '' }) {
  const router = useRouter();
  const [processedContent, setProcessedContent] = useState('');
  
  useEffect(() => {
    async function processLinks() {
      if (!content) {
        setProcessedContent('');
        return;
      }
      
      // Extract all page links from the content
      const linkRegex = /\[([^\]]+)\]/g;
      const matches = [...content.matchAll(linkRegex)];
      const slugs = matches.map(match => match[1]);
      
      // Get unique slugs to fetch
      const uniqueSlugs = [...new Set(slugs)].filter(slug => !pageTitleCache[slug]);
      
      // Fetch current titles for all slugs not in cache
      if (uniqueSlugs.length > 0) {
        const { data } = await getSupabaseBrowser()
          .from('pages')
          .select('slug, title')
          .in('slug', uniqueSlugs);
          
        // Update cache with fetched titles
        if (data) {
          data.forEach(page => {
            pageTitleCache[page.slug] = page.title;
          });
        }
      }
      
      // Replace all [slug] with the actual title from cache or use slug as fallback
      let processedHtml = content;
      matches.forEach(match => {
        const slug = match[1];
        const fullMatch = match[0]; // The full [slug] text
        const title = pageTitleCache[slug] || slug; // Use the page title from cache if available
        
        // Replace with a link that uses lowercase styling
        processedHtml = processedHtml.replace(
          fullMatch,
          `<a href="/${slug}" class="page-link inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-purple-100 text-purple-800 hover:opacity-90 lowercase" data-slug="${slug}">${title}</a>`
        );
      });
      
      // Then process mentions - improved version
      const processedWithLinks = processedHtml; // Store the result after processing links
      let processedWithMentions = processedWithLinks;
      
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentionMatches = [...processedWithLinks.matchAll(mentionRegex)];
      
      // Process all mentions at once instead of sequential replacements
      if (mentionMatches.length > 0) {
        // Create a map of positions to replacements
        const replacements: {index: number, length: number, replacement: string}[] = [];
        
        mentionMatches.forEach(match => {
          const username = match[1];
          const fullMatch = match[0]; // The full @username text
          const startIndex = match.index!;
          
          // Check if this mention is inside an HTML tag (already processed)
          const previousChar = processedWithLinks.charAt(startIndex - 1);
          const nextCharsCheck = processedWithLinks.substring(startIndex, startIndex + 50);
          
          // Skip if it appears to be inside a tag already
          if (previousChar === '"' || previousChar === "'" || 
              nextCharsCheck.includes('</a>')) {
            return;
          }
          
          replacements.push({
            index: startIndex,
            length: fullMatch.length,
            replacement: `<a href="https://twitter.com/${username}" target="_blank" rel="noopener noreferrer" 
                class="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-black text-white hover:opacity-90">
                ${fullMatch}
            </a>`
          });
        });
        
        // Sort replacements from end to beginning to avoid position shifts
        replacements.sort((a, b) => b.index - a.index);
        
        // Apply replacements
        let result = processedWithLinks;
        for (const {index, length, replacement} of replacements) {
          result = result.substring(0, index) + replacement + result.substring(index + length);
        }
        
        processedWithMentions = result;
      }
      
      // Sanitize and set the processed content
      const sanitizedContent = DOMPurify.sanitize(processedWithMentions, {
        ADD_ATTR: ['target', 'rel', 'data-slug'],
        ADD_CLASSES: {
          'a': ['page-link', 'mention', 'inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-md', 'font-medium', 'bg-purple-100', 'text-purple-800', 'hover:opacity-90', 'bg-black', 'text-white']
        }
      });

      // Process links to add create=true for wiki-style links
      const processedContent = sanitizedContent.replace(
        /<a href="\/([^"]+)"/g, 
        (match, slug) => {
          // Add create=true to the URL for wiki links (generated from [slug] format)
          return `<a href="/${slug}?create=true"`
        }
      );

      setProcessedContent(processedContent);
    }
    
    processLinks();
  }, [content]);
  
  useEffect(() => {
    // Add click handler for internal page links
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.classList.contains('page-link')) {
        event.preventDefault();
        const slug = target.getAttribute('data-slug');
        if (slug) {
          // Add the create=true parameter to create the page if it doesn't exist
          router.push(`/${slug}?create=true`);
        }
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [router]);
  
  if (!content || content.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-300 text-xl italic font-sans">
          This page is empty.
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className="page-content"
      dangerouslySetInnerHTML={{ __html: processedContent }} 
    />
  );
} 