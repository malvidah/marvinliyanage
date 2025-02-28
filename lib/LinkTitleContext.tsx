'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import getSupabaseBrowser from '@/lib/supabase-browser';

// Define the context type
type LinkTitleContextType = {
  getPageTitle: (slug: string) => Promise<string>;
  refreshPageTitle: (slug: string) => Promise<void>;
};

// Create context
const LinkTitleContext = createContext<LinkTitleContextType | undefined>(undefined);

// Cache for page titles
const titleCache: Record<string, string> = {};

// Provider component
export function LinkTitleProvider({ children }: { children: ReactNode }) {
  // Function to get a page title, using cache if available
  const getPageTitle = async (slug: string): Promise<string> => {
    // Return from cache if available
    if (titleCache[slug]) return titleCache[slug];
    
    // Otherwise fetch from database
    try {
      const { data } = await getSupabaseBrowser()
        .from('pages')
        .select('title')
        .eq('slug', slug)
        .single();
        
      if (data?.title) {
        titleCache[slug] = data.title;
        return data.title;
      }
      
      // If not found, just return the slug
      return slug;
    } catch (err) {
      console.error(`Error fetching title for ${slug}:`, err);
      return slug; 
    }
  };
  
  // Function to refresh a specific page title in the cache
  const refreshPageTitle = async (slug: string): Promise<void> => {
    try {
      const { data } = await getSupabaseBrowser()
        .from('pages')
        .select('title')
        .eq('slug', slug)
        .single();
        
      if (data?.title) {
        titleCache[slug] = data.title;
      }
    } catch (err) {
      console.error(`Error refreshing title for ${slug}:`, err);
    }
  };
  
  return (
    <LinkTitleContext.Provider value={{ getPageTitle, refreshPageTitle }}>
      {children}
    </LinkTitleContext.Provider>
  );
}

// Custom hook to use the context
export function useLinkTitles() {
  const context = useContext(LinkTitleContext);
  if (context === undefined) {
    throw new Error('useLinkTitles must be used within a LinkTitleProvider');
  }
  return context;
} 