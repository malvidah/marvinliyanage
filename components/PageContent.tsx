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
    async function processContent() {
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
      
      // Process mentions
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentionMatches = [...processedHtml.matchAll(mentionRegex)];
      
      // Process all mentions at once instead of sequential replacements
      if (mentionMatches.length > 0) {
        // Create a map of positions to replacements
        const replacements: {index: number, length: number, replacement: string}[] = [];
        
        mentionMatches.forEach(match => {
          const username = match[1];
          const fullMatch = match[0]; // The full @username text
          const startIndex = match.index!;
          
          // Check if this mention is inside an HTML tag (already processed)
          const previousChar = processedHtml.charAt(startIndex - 1);
          const nextCharsCheck = processedHtml.substring(startIndex, startIndex + 50);
          
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
        let result = processedHtml;
        for (const {index, length, replacement} of replacements) {
          result = result.substring(0, index) + replacement + result.substring(index + length);
        }
        
        processedHtml = result;
      }
      
      // Process external links to add orange styling
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href="(https?:\/\/[^"]+)"(?:\s+[^>]*?)?>(?!<span\s+class="page-link">)(.*?)<\/a>/g;
      processedHtml = processedHtml.replace(urlRegex, (match, url, text) => {
        // Skip YouTube embeds
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return match;
        }
        
        // Skip if it's already a page-link or mention
        if (match.includes('class="page-link"') || match.includes('class="inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-black text-white')) {
          return match;
        }
        
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" 
                  class="url-link inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-orange-100 text-orange-800 hover:opacity-90">
                  ${text || url}
                </a>`;
      });
      
      // Process YouTube embeds to ensure they're centered and URLs are hidden
      const youtubeRegex = /<p>https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[^\s<]*)<\/p>/g;
      processedHtml = processedHtml.replace(youtubeRegex, (match, videoId) => {
        return `<div class="youtube-container">
          <iframe 
            width="640" 
            height="360" 
            src="https://www.youtube-nocookie.com/embed/${videoId}" 
            frameborder="0" 
            allowfullscreen
            class="mx-auto rounded-md"
          ></iframe>
        </div>`;
      });
      
      // Sanitize and set the processed content
      const sanitizedContent = DOMPurify.sanitize(processedHtml, {
        ADD_ATTR: ['target', 'rel', 'data-slug', 'allowfullscreen'],
        ADD_TAGS: ['iframe'],
        ADD_CLASSES: {
          'a': ['page-link', 'url-link', 'mention', 'inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-md', 'font-medium', 
                'bg-purple-100', 'text-purple-800', 'hover:opacity-90', 'bg-black', 'text-white', 'bg-orange-100', 'text-orange-800']
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
    
    processContent();
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