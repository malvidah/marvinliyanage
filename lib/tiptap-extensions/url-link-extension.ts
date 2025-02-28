'use client'
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const UrlLinkExtension = Extension.create({
  name: 'urlLink',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('urlLink'),
        
        props: {
          // Add decoration for external URL links
          decorations(state) {
            const { doc } = state;
            const decorations = [];
            
            // Find all links in the document
            doc.descendants((node, pos) => {
              if (node.marks && node.marks.length) {
                const linkMark = node.marks.find(mark => mark.type.name === 'link');
                
                if (linkMark) {
                  const href = linkMark.attrs.href;
                  
                  // Skip page links (which use [slug] format)
                  if (node.text && !node.text.match(/\[([^\]]+)\]/)) {
                    // Check if it's a URL (not a page link)
                    if (href && href.startsWith('http')) {
                      const start = pos;
                      const end = pos + node.nodeSize;
                      
                      // Create a tooltip decoration
                      decorations.push(
                        Decoration.inline(start, end, {
                          class: 'url-link-tooltip',
                          title: `Visit: ${href}`,
                          style: 'background-color: #FFEDD5; border-radius: 0.25rem; padding: 0.1rem 0.2rem; color: #C2410C; cursor: pointer;'
                        })
                      );
                    }
                  }
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