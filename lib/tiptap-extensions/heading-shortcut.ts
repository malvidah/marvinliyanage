import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const HeadingShortcutExtension = Extension.create({
  name: 'headingShortcut',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingShortcut'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key !== ' ') return false;
            
            const { state } = view;
            const { selection } = state;
            const { $from, empty } = selection;
            
            if (!empty) return false;
            
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 3),
              $from.parentOffset,
              null,
              ' '
            );
            
            if (textBefore === '# ') {
              // Apply heading 1
              view.dispatch(
                state.tr
                  .delete($from.pos - 2, $from.pos)
                  .setBlockType($from.pos, $from.pos, state.schema.nodes.heading, { level: 1 })
              );
              return true;
            }
            
            if (textBefore === '## ') {
              // Apply heading 2
              view.dispatch(
                state.tr
                  .delete($from.pos - 3, $from.pos)
                  .setBlockType($from.pos, $from.pos, state.schema.nodes.heading, { level: 2 })
              );
              return true;
            }
            
            if (textBefore === '###') {
              // Reset to paragraph
              view.dispatch(
                state.tr
                  .delete($from.pos - 3, $from.pos)
                  .setBlockType($from.pos, $from.pos, state.schema.nodes.paragraph)
              );
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },
}); 