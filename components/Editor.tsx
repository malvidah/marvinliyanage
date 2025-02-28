'use client'

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import getSupabaseBrowser from '@/lib/supabase-browser';
import { NodeView } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { debounce, throttle } from 'lodash';

interface EditorProps {
  content: string;
  pageId: string;
  slug: string;
  onSave: (content: string) => void;
  saveRef: (saveFunction: () => Promise<boolean>) => void;
  onContentChange?: (content: string) => void;
}

// Create a custom resizable image component 
const ResizableImageComponent = ({ node, updateAttributes, deleteNode }) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    if (imageRef.current) {
      setIsResizing(true);
      startXRef.current = e.clientX;
      
      // Get the current width - either from style, attribute, or actual rendered width
      const currentWidth = imageRef.current.style.width 
        ? parseInt(imageRef.current.style.width) 
        : (node.attrs.width || imageRef.current.getBoundingClientRect().width);
        
      startWidthRef.current = currentWidth;
      
      // Add resizing class for better visual feedback
      wrapperRef.current.classList.add('resizing');
    }
  }, [node.attrs.width]);
  
  const onResize = useCallback(
    throttle((e) => {
      if (isResizing && imageRef.current) {
        e.preventDefault();
        const currentX = e.clientX;
        const diffX = currentX - startXRef.current;
        
        // Calculate new width with constraints
        const newWidth = Math.max(100, Math.min(1000, startWidthRef.current + diffX));
        
        // Only update width - height will adjust automatically to maintain aspect ratio
        imageRef.current.style.width = `${newWidth}px`;
        imageRef.current.style.height = 'auto'; // Explicitly set height to auto
        
        // Debounce the node attribute update to reduce document changes
        updateAttributesDebounced(newWidth);
      }
    }, 16),
    [isResizing]
  );
  
  const onResizeEnd = useCallback((e) => {
    if (isResizing) {
      e.preventDefault();
      setIsResizing(false);
      
      // Remove resizing class
      wrapperRef.current.classList.remove('resizing');
    }
  }, [isResizing]);
  
  // Create a debounced version of updateAttributes
  const updateAttributesDebounced = useCallback(
    debounce((width) => {
      updateAttributes({ width });
    }, 100),
    [updateAttributes]
  );
  
  // Add event listeners for mousemove and mouseup on mount
  useEffect(() => {
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
    
    return () => {
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', onResizeEnd);
    };
  }, [onResize, onResizeEnd]);
  
  // Add this function to handle image deletion
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteNode) {
      deleteNode();
    }
  };
  
  return (
    <NodeViewWrapper className="resizable-image-wrapper" ref={wrapperRef}>
      <img 
        ref={imageRef}
        src={node.attrs.src} 
        alt={node.attrs.alt || ''}
        width={node.attrs.width}
        className="resizable-image"
      />
      <div 
        className="resize-handle"
        onMouseDown={onResizeStart}
      />
      
      {/* Add delete button */}
      <button
        className="image-delete-button"
        onClick={handleDelete}
        aria-label="Delete image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </NodeViewWrapper>
  );
};

// Add a custom extension to replace the default Image
const ResizableImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent, {
      // Pass deleteNode function
      contentDOMAttributes: { class: 'resizable-image-content' },
      // Enable node deletion
      deleteNode: true,
    });
  },
  
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
    };
  },
});

export default function Editor({ content, pageId, slug, onSave, saveRef, onContentChange }: EditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced editor configuration with rich media support
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
      }),
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
          alt: '',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        HTMLAttributes: {
          class: 'rounded-md overflow-hidden my-4 mx-auto',
        },
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
      handleDOMEvents: {
        paste: (view, event) => {
          // Handle pasting images
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find(item => item.type.startsWith('image/'));
          
          if (imageItem) {
            const blob = imageItem.getAsFile();
            
            if (blob) {
              event.preventDefault(); // Completely intercept the paste event
              
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string' && editor) {
                  // Execute a command to insert the image with empty alt text
                  editor.commands.focus();
                  editor.commands.insertContent({
                    type: 'image',
                    attrs: {
                      src: result,
                      alt: '',
                    }
                  });
                  
                  // Remove any inserted "SML" text
                  setTimeout(() => {
                    // Find all text nodes in the editor
                    const walker = document.createTreeWalker(
                      document.querySelector('.ProseMirror')!,
                      NodeFilter.SHOW_TEXT
                    );
                    
                    const nodesToRemove = [];
                    let node;
                    while (node = walker.nextNode()) {
                      if (node.textContent && node.textContent.includes('SML')) {
                        nodesToRemove.push(node);
                      }
                    }
                    
                    // Remove the "SML" text nodes
                    nodesToRemove.forEach(node => {
                      node.textContent = '';
                    });
                    
                    // Add controls to the image we just inserted
                    const images = document.querySelectorAll('.ProseMirror img');
                    const lastImage = images[images.length - 1] as HTMLImageElement;
                    if (lastImage) {
                      handleImage(lastImage);
                    }
                  }, 50);
                }
              };
              reader.readAsDataURL(blob);
              return true;
            }
          }
          
          // Handle pasting URLs
          const text = event.clipboardData?.getData('text/plain');
          if (text && editor) {
            // Check if it's a YouTube URL
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
            if (youtubeRegex.test(text)) {
              handleYoutubeUrl(text);
              return true;
            }
            
            // Check if it's an image URL
            const imageRegex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(\?.*)?$/i;
            if (imageRegex.test(text)) {
              editor.commands.setImage({ src: text });
              
              // Add image resize controls after insertion
              setTimeout(() => {
                const images = document.querySelectorAll('.ProseMirror img');
                const lastImage = images[images.length - 1];
                if (lastImage) {
                  lastImage.setAttribute('alt', '');
                  handleImage(lastImage);
                }
              }, 100);
              return true;
            }
            
            // Check if it's a regular URL
            const urlRegex = /^(https?:\/\/[^\s]+)$/;
            if (urlRegex.test(text)) {
              // Try to fetch the page title
              fetchPageTitle(text).then(title => {
                if (title) {
                  editor.commands.setLink({ 
                    href: text,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    title: title
                  });
                } else {
                  editor.commands.setLink({ 
                    href: text,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                  });
                }
              });
              return true;
            }
          }
          
          return false;
        },
        drop: (view, event) => {
          // Prevent default to handle the drop ourselves
          event.preventDefault();
          
          // Get the data transfer
          const dataTransfer = event.dataTransfer;
          if (!dataTransfer || !editor) return false;
          
          // Handle files (images, etc.)
          const files = Array.from(dataTransfer.files);
          if (files.length > 0) {
            // Handle image files
            const imageFile = files.find(file => file.type.startsWith('image/'));
            if (imageFile) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string' && editor) {
                  // Set the cursor position where the file was dropped
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  if (coordinates) {
                    view.dispatch(view.state.tr.setSelection(
                      view.state.selection.constructor.near(view.state.doc.resolve(coordinates.pos))
                    ));
                  }
                  
                  // Insert the image
                  editor.commands.setImage({ 
                    src: result,
                    alt: ''
                  });
                  
                  // Add image resize controls
                  setTimeout(() => {
                    const images = document.querySelectorAll('.ProseMirror img');
                    const lastImage = images[images.length - 1];
                    if (lastImage) {
                      lastImage.setAttribute('alt', '');
                      handleImage(lastImage);
                    }
                  }, 100);
                }
              };
              reader.readAsDataURL(imageFile);
              return true;
            }
          }
          
          // Handle dropped URLs
          const url = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain');
          if (url && url.trim().startsWith('http')) {
            // Set the cursor position where the URL was dropped
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              view.dispatch(view.state.tr.setSelection(
                view.state.selection.constructor.near(view.state.doc.resolve(coordinates.pos))
              ));
            }
            
            // Check if it's a YouTube URL
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
            if (youtubeRegex.test(url)) {
              handleYoutubeUrl(url);
              return true;
            }
            
            // Check if it's an image URL
            const imageRegex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(\?.*)?$/i;
            if (imageRegex.test(url)) {
              editor.commands.setImage({ src: url, alt: '' });
              
              // Add image resize controls
              setTimeout(() => {
                const images = document.querySelectorAll('.ProseMirror img');
                const lastImage = images[images.length - 1];
                if (lastImage) {
                  lastImage.setAttribute('alt', '');
                  handleImage(lastImage);
                }
              }, 100);
              return true;
            }
            
            // Handle as a regular link
            fetchPageTitle(url).then(title => {
              if (title) {
                editor.commands.setLink({ 
                  href: url,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  title: title
                });
              } else {
                editor.commands.setLink({ 
                  href: url,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                });
              }
            });
            return true;
          }
          
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      try {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
        
        setHasUnsavedChanges(true);
        
        // Set up autosave
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }
        
        autosaveTimeoutRef.current = setTimeout(() => {
          handleSave();
        }, 3000);
      } catch (err) {
        console.error('Update error:', err);
      }
    },
  });
  
  // Improved fetchPageTitle function
  const fetchPageTitle = async (url: string): Promise<string | null> => {
    try {
      // First check if we have a cached title
      const cachedTitle = localStorage.getItem(`page_title_${url}`);
      if (cachedTitle) {
        return cachedTitle;
      }
      
      // If not, fetch it from our API
      const response = await fetch(`/api/fetch-page-title?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch title: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.title) {
        // Cache the title for future use
        localStorage.setItem(`page_title_${url}`, data.title);
        return data.title;
      }
      
      // If no title found, use a fallback
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (error) {
      console.error('Error fetching page title:', error);
      // Return domain name as fallback
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
      } catch {
        return url;
      }
    }
  };
  
  // Function to add image resize controls
  const handleImage = (imageElement: HTMLImageElement) => {
    if (!imageElement) return;
    
    // Set empty alt to prevent any text showing
    imageElement.setAttribute('alt', '');
    
    // Add data-size attribute for default sizing
    imageElement.setAttribute('data-size', 'medium');
    
    // Clean up any text siblings
    const parent = imageElement.parentNode;
    if (parent) {
      const childNodes = Array.from(parent.childNodes);
      childNodes.forEach(node => {
        if (node !== imageElement && node.nodeType === Node.TEXT_NODE) {
          node.textContent = '';
        }
      });
    }
  };
  
  // Add keyboard shortcuts
  useEffect(() => {
    if (!editor) return;
    
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Command+K for link
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && editor) {
        e.preventDefault();
        
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        
        // cancelled
        if (url === null) {
          return;
        }
        
        // empty
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        
        // Try to fetch the page title
        const title = await fetchPageTitle(url);
        
        if (title) {
          editor.chain().focus().extendMarkRange('link').setLink({ 
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: title
          }).run();
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ 
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer'
          }).run();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);
  
  // Simple save function
  const handleSave = useCallback(async () => {
    if (!editor || isSaving) return false;
    
    try {
      setIsSaving(true);
      
      // Get content from editor
      const content = editor.getHTML();
      
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

  // Add this function inside your Editor component
  const handleYoutubeUrl = (url: string) => {
    if (!editor) return;
    
    // Extract video ID
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      const videoId = match[1];
      
      // Replace the current selection or insert at cursor
      editor.commands.setYoutubeVideo({
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
        width: 640,
        height: 360,
      });
      
      // Remove the URL text that was pasted
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      
      if (from !== to) {
        editor.commands.deleteRange({ from, to });
      }
    }
  };

  // Also add event listeners to the editor container for drag and drop visual feedback
  useEffect(() => {
    if (!editorContainerRef.current) return;
    
    const container = editorContainerRef.current;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      container.classList.add('drag-over');
    };
    
    const handleDragLeave = () => {
      container.classList.remove('drag-over');
    };
    
    const handleDrop = () => {
      container.classList.remove('drag-over');
    };
    
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
    
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragleave', handleDragLeave);
      container.removeEventListener('drop', handleDrop);
    };
  }, [editorContainerRef.current]);

  // Add this to your useEffect
  useEffect(() => {
    if (!editor) return;
    
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        // Get current size
        const img = target as HTMLImageElement;
        const currentSize = img.getAttribute('data-size') || 'medium';
        
        // Toggle to next size
        if (currentSize === 'small') {
          img.setAttribute('data-size', 'medium');
        } else if (currentSize === 'medium') {
          img.setAttribute('data-size', 'large');
        } else {
          img.setAttribute('data-size', 'small');
        }
        
        // Update the editor content
        editor.commands.focus();
      }
    };
    
    document.querySelector('.ProseMirror')?.addEventListener('dblclick', handleImageClick);
    
    return () => {
      document.querySelector('.ProseMirror')?.removeEventListener('dblclick', handleImageClick);
    };
  }, [editor]);

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