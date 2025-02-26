import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Youtube from '@tiptap/extension-youtube';
import supabase from '@/lib/supabase';
import { PageLinkExtension } from '@/lib/tiptap-extensions/page-link-extension';
import { MentionExtension } from '@/lib/tiptap-extensions/mention-extension';

interface EditorProps {
  content: string;
  pageId: string;
  slug: string;
  onSave: () => void;
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

  // Process special text patterns
  const processContent = (text: string): string => {
    // Process content before saving
    return text;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      PageLinkExtension,
      MentionExtension,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none min-h-[300px] w-full',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            // Handle image drop
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              if (typeof e.target?.result === 'string') {
                const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                if (pos) {
                  const tr = view.state.tr;
                  const node = view.state.schema.nodes.image.create({ src: e.target.result });
                  view.dispatch(tr.insert(pos, node));
                }
                
                // Upload to Supabase Storage (if needed)
                uploadImageToStorage(file, e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            // Handle image paste
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              if (typeof e.target?.result === 'string') {
                editor?.chain().focus().setImage({ src: e.target.result }).run();
                
                // Upload to Supabase Storage (if needed)
                uploadImageToStorage(file, e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        } else {
          // Check for YouTube URLs
          const clipboardText = event.clipboardData?.getData('text/plain');
          const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
          const match = clipboardText?.match(youtubeRegex);
          
          if (match && match[1]) {
            event.preventDefault();
            editor?.chain().focus().setYoutubeVideo({ src: match[1] }).run();
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Handle # for heading conversion
        if (event.key === ' ') {
          const { state } = view;
          const { selection } = state;
          const { $from, empty } = selection;
          
          if (!empty || $from.parent.type.name !== 'paragraph') {
            return false;
          }
          
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          
          if (textBefore === '#') {
            // Convert to h1
            const transaction = state.tr
              .deleteRange($from.pos - 1, $from.pos)
              .setBlockType($from.pos - 1, $from.pos, state.schema.nodes.heading, { level: 1 });
            
            view.dispatch(transaction);
            return true;
          }
          
          if (textBefore === '##') {
            // Convert to h2
            const transaction = state.tr
              .deleteRange($from.pos - 2, $from.pos)
              .setBlockType($from.pos - 2, $from.pos, state.schema.nodes.heading, { level: 2 });
            
            view.dispatch(transaction);
            return true;
          }
          
          if (textBefore === '###') {
            // Convert back to paragraph
            const transaction = state.tr
              .deleteRange($from.pos - 3, $from.pos)
              .setBlockType($from.pos - 3, $from.pos, state.schema.nodes.paragraph);
            
            view.dispatch(transaction);
            return true;
          }
        }
        
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
      
      // Clear any existing timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      
      // Set a new timeout for autosave (2 seconds after typing stops)
      autosaveTimeoutRef.current = setTimeout(() => {
        // Only autosave if there are changes
        if (hasUnsavedChanges && !isSaving) {
          handleSave(true);
        }
      }, 2000);
    },
  });

  // Upload image to Supabase Storage
  const uploadImageToStorage = async (file: File, base64Data: string) => {
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(`page-images/${filename}`, file);
      
      if (error) {
        console.error('Error uploading image:', error);
        return;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`page-images/${filename}`);
      
      if (urlData && editor && base64Data) {
        // Replace base64 with URL in editor content
        const content = editor.getHTML();
        const updatedContent = content.replace(base64Data, urlData.publicUrl);
        editor.commands.setContent(updatedContent);
      }
    } catch (err) {
      console.error('Error in image upload:', err);
    }
  };

  const handleSave = useCallback(async (isAutosave = false) => {
    if (!editor) return false;
    
    try {
      // If this is an autosave, set saving state
      if (!isAutosave) {
        setError(null);
      }
      setIsSaving(true);
      
      const saveContent = editor.getHTML();
      
      // Save to Supabase
      const { error: supabaseError } = await supabase
        .from('pages')
        .update({ content: saveContent })
        .eq('id', pageId);
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Extract all page links from content
      const pageLinks: string[] = [];
      const linkRegex = /\[([^\]]+)\]/g;
      let match;
      
      while ((match = linkRegex.exec(saveContent)) !== null) {
        pageLinks.push(match[1]);
      }
      
      if (pageLinks.length > 0) {
        // Get current page ID
        const { data: pageData } = await supabase
          .from('pages')
          .select('id')
          .eq('slug', slug)
          .single();
          
        if (pageData) {
          // For each linked page, check if it exists or create it
          const linkPromises = pageLinks.map(async (linkedSlug) => {
            // Check if target page exists
            const { data: targetPage, error: targetError } = await supabase
              .from('pages')
              .select('id')
              .eq('slug', linkedSlug)
              .single();
              
            // If page doesn't exist, create it
            if (targetError && targetError.code === 'PGRST116') {
              const title = linkedSlug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
                
              const { data: newPage } = await supabase
                .from('pages')
                .insert({
                  title,
                  slug: linkedSlug,
                  content: '',
                })
                .select('id');
                
              if (newPage) {
                // Create page link connection
                await supabase
                  .from('page_links')
                  .upsert({
                    source_page_id: pageData.id,
                    target_page_id: newPage[0].id
                  });
              }
            } else if (targetPage) {
              // Create page link connection for existing page
              await supabase
                .from('page_links')
                .upsert({
                  source_page_id: pageData.id,
                  target_page_id: targetPage.id
                });
            }
          });
          
          await Promise.all(linkPromises);
        }
      }
      
      // If this is a manual save (not autosave), wait a moment for DB sync
      if (!isAutosave) {
        await new Promise(resolve => setTimeout(resolve, 300));
        onSave();
      }
      
      // Update save status
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsSaving(false);
      
      return true;
    } catch (err: any) {
      console.error('Error saving editor content:', err);
      if (!isAutosave) {
        setError(err.message || 'Error saving content');
      }
      setIsSaving(false);
      return false;
    }
  }, [editor, pageId, onSave]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Pass the save function up to the parent
  useEffect(() => {
    saveRef(handleSave);
  }, [handleSave, saveRef]);

  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    // If less than a minute ago
    if (diff < 60000) {
      return 'Saved just now';
    }
    
    // If less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Saved ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show time
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  // When the editor content changes
  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const html = editor.getHTML();
    // Call the onContentChange callback if provided
    if (onContentChange) {
      onContentChange(html);
    }
  };

  return (
    <div className="flex flex-col" ref={editorContainerRef}>
      <EditorContent editor={editor} className="rounded-md" />
      
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