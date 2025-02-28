'use client'

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import getSupabaseBrowser from '@/lib/supabase-browser';

interface EditorProps {
  content: string;
  pageId: string;
  slug: string;
  onSave: (content: string) => void;
  saveRef: (saveFunction: () => Promise<boolean>) => void;
  onContentChange?: (content: string) => void;
}

export default function Editor({ content, pageId, slug, onSave, saveRef, onContentChange }: EditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple, stable editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none min-h-[300px] w-full h1-match-title',
      },
      transformPastedHTML(html) {
        // Clean up pasted HTML to ensure consistent formatting
        return html;
      },
    },
    onUpdate: ({ editor }) => {
      try {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
        
        setHasUnsavedChanges(true);
        
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }
        
        autosaveTimeoutRef.current = setTimeout(() => {
          if (!isSaving) {
            handleSave();
          }
        }, 2000);
      } catch (e) {
        console.error('Error in editor update:', e);
      }
    },
  });
  
  // Simple save function
  const handleSave = useCallback(async () => {
    if (!editor || isSaving) return false;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const content = editor.getHTML();
      
      if (onContentChange) {
        onContentChange(content);
      }
      
      // Save to database
      const { error } = await getSupabaseBrowser()
        .from('pages')
        .update({ content })
        .eq('id', pageId);
      
      if (error) {
        console.error('Error saving:', error);
        setError(error.message);
        setIsSaving(false);
        return false;
      }
      
      // Call the parent's onSave handler
      onSave(content);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onContentChange, onSave, pageId]);

  // Register the save function with the parent
  useEffect(() => {
    saveRef(handleSave);
  }, [handleSave, saveRef]);
  
  // Clean up the editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <div className="flex flex-col" ref={editorContainerRef}>
      <EditorContent 
        editor={editor} 
        className="prose prose-lg max-w-none rounded-md"
      />
      
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500 px-1">
        <div>
          {error && <p className="text-red-500">{error}</p>}
        </div>
        <div className="flex items-center">
          {isSaving && <span className="text-gray-400">Saving...</span>}
          {!isSaving && lastSaved && <span>{formatLastSaved()}</span>}
          {hasUnsavedChanges && !isSaving && <span className="ml-2 text-amber-500">●</span>}
        </div>
      </div>
    </div>
  );
} 