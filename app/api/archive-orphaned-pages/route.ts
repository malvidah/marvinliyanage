import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Step 1: Get all pages
    const { data: allPages, error: pageError } = await supabase
      .from('pages')
      .select('id, slug, title, content');
      
    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }
    
    // Step 2: Find truly orphaned pages - no links TO them and no links FROM them
    const orphanedPages = [];
    
    // Define protected pages that should never be archived
    const PROTECTED_PAGES = ['archive', 'admin', 'hello'];
    
    // Helper function to extract page links from content
    function extractPageLinksFromContent(content) {
      if (!content) return [];
      
      // Convert to string if needed
      const contentStr = typeof content === 'string' 
        ? content 
        : JSON.stringify(content);
      
      // Find all [page-slug] style links
      const linkRegex = /\[([^\]]+)\]/g;
      let matches = [];
      let match;
      
      while ((match = linkRegex.exec(contentStr)) !== null) {
        matches.push(match[1]);
      }
      
      return [...new Set(matches)]; // Remove duplicates
    }
    
    for (const page of allPages) {
      // Skip protected pages that should never be archived
      if (PROTECTED_PAGES.includes(page.slug)) continue;
      
      // Check 1: Does any other page link TO this page?
      const hasIncomingLinks = allPages.some(otherPage => {
        // Don't count links from archive page (this prevents pages from being "saved" by being listed in archive)
        if (otherPage.id === page.id || PROTECTED_PAGES.includes(otherPage.slug)) return false;
        
        const links = extractPageLinksFromContent(otherPage.content);
        return links.includes(page.slug);
      });
      
      // Check 2: Does this page link TO any other page?
      const outgoingLinks = extractPageLinksFromContent(page.content);
      
      // Filter out links to protected pages - linking to archive shouldn't "save" a page
      const nonProtectedOutgoingLinks = outgoingLinks.filter(link => !PROTECTED_PAGES.includes(link));
      
      const hasOutgoingLinks = nonProtectedOutgoingLinks.length > 0;
      
      // A page is truly orphaned if it has no incoming or outgoing links (except to protected pages)
      if (!hasIncomingLinks && !hasOutgoingLinks) {
        orphanedPages.push(page);
      }
    }
    
    console.log(`Found ${orphanedPages.length} orphaned pages`);
    
    // Mark orphaned pages as archived
    let updatedCount = 0;
    for (const page of orphanedPages) {
      // Skip already archived pages
      if (page.is_archived) continue;
      
      const { error: updateError } = await supabase
        .from('pages')
        .update({ is_archived: true })
        .eq('id', page.id);
        
      if (!updateError) {
        updatedCount++;
      }
    }
    
    // First, reset any previously archived pages that are no longer orphaned
    const { data: currentlyArchived } = await supabase
      .from('pages')
      .select('id, slug')
      .eq('is_archived', true);
      
    if (currentlyArchived) {
      for (const archivedPage of currentlyArchived) {
        // If this page is not in our newly detected orphaned pages list, unmark it
        if (!orphanedPages.some(p => p.id === archivedPage.id)) {
          await supabase
            .from('pages')
            .update({ is_archived: false })
            .eq('id', archivedPage.id);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      orphanedPagesCount: orphanedPages.length,
      updatedCount
    });
  } catch (error) {
    console.error('Error archiving orphaned pages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 