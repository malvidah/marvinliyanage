'use client'
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import getSupabaseBrowser from '@/lib/supabase-browser';

// Cache for page titles to reduce database queries
const pageTitleCache: Record<string, string> = {};

export const PageLinkExtension = Extension.create({
  name: 'pageLink',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pageLink'),
        
        appendTransaction: async (transactions, oldState, newState) => {
          // Detect when content has changed
          if (!transactions.some(tr => tr.docChanged)) return null;
          
          // Find all [page] links in the document
          const linkRegex = /\[([^\]]+)\]/g;
          const docText = newState.doc.textContent;
          const matches = [...docText.matchAll(linkRegex)];
          
          if (matches.length === 0) return null;
          
          // Extract unique slugs
          const slugs = [...new Set(matches.map(match => match[1]))];
          
          // Fetch titles for slugs not in cache
          const slugsToFetch = slugs.filter(slug => !pageTitleCache[slug]);
          
          if (slugsToFetch.length > 0) {
            const { data } = await getSupabaseBrowser()
              .from('pages')
              .select('slug, title')
              .in('slug', slugsToFetch);
              
            if (data) {
              data.forEach(page => {
                pageTitleCache[page.slug] = page.title;
              });
            }
          }
          
          // We don't actually modify the document here, just update the cache
          return null;
        },
        
        props: {
          // Add decoration for page links
          decorations(state) {
            const { doc } = state;
            const decorations = [];
            
            // Find and decorate all [page] links
            doc.descendants((node, pos) => {
              if (node.isText) {
                const linkRegex = /\[([^\]]+)\]/g;
                let match;
                
                while ((match = linkRegex.exec(node.text || '')) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  const slug = match[1];
                  const title = pageTitleCache[slug] || slug;
                  
                  // Create a tooltip decoration
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'page-link-tooltip',
                      title: `Page: ${title}`,
                      style: 'background-color: #F3E8FF; border-radius: 0.25rem; padding: 0.1rem 0.2rem; color: #6D28D9; cursor: pointer;'
                    })
                  );
                }
              }
            });
            
            return DecorationSet.create(doc, decorations);
          }
        }
      })
    ]
  }
}); 