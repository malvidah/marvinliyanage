'use client'

import { Extension } from '@tiptap/core';

/**
 * A minimal mention extension that doesn't use tr.setMeta at all
 * This simple version just adds styling without complex behaviors
 */
export const MentionExtension = Extension.create({
  name: 'mention',
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'mention',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.mention',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'mention' }, 0];
  },
}); 