import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const MentionExtension = Extension.create({
  name: 'mention',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mention'),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            
            const mentionRegex = /@(\w+)/g;
            
            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text as string;
                let match;
                while ((match = mentionRegex.exec(text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  const decoration = Decoration.inline(start, end, {
                    class: 'inline-flex items-center px-2.5 py-0.5 rounded-md font-medium bg-black text-white hover:opacity-90',
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