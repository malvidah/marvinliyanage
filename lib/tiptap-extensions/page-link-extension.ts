import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const PageLinkExtension = Extension.create({
  name: 'pageLink',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pageLink'),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            
            const pageLinkRegex = /\[([^\]]+)\]/g;
            
            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text as string;
                let match;
                while ((match = pageLinkRegex.exec(text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  const decoration = Decoration.inline(start, end, {
                    class: 'inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-purple-100 text-purple-800 hover:opacity-90',
                    style: 'text-decoration: none;',
                  });
                  decorations.push(decoration);
                }
              }
            });
            
            return DecorationSet.create(doc, decorations);
          }
        }
      }),
    ];
  },
}); 