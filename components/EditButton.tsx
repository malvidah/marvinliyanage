import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface EditButtonProps {
  onClick: () => void
  isEditing: boolean
  onSave?: () => Promise<boolean>
}

export default function EditButton({ onClick, isEditing, onSave }: EditButtonProps) {
  const { data: session } = useSession()
  const [isWorking, setIsWorking] = useState(false)
  const isMounted = useRef(true)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isMac, setIsMac] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Define forceToggle with useCallback BEFORE it's used in useEffect
  const forceToggle = useCallback(() => {
    console.log('Force toggling edit mode')
    // Immediately toggle without waiting
    onClick()
    
    // If we were in edit mode, trigger save in background
    if (isEditing && onSave) {
      try {
        onSave().catch(err => console.error('Background save error:', err))
      } catch (err) {
        console.error('Error in background save:', err)
      }
    }
    
    if (isMounted.current) {
      setIsWorking(false)
    }
  }, [isEditing, onClick, onSave])
  
  // Normal toggle with save attempt
  const triggerToggle = useCallback(async () => {
    if (isWorking) return
    
    console.log('Trigger toggle called')
    setIsWorking(true)
    
    try {
      if (isEditing && onSave) {
        // Quick save attempt when exiting edit mode
        console.log('Attempting save before toggle')
        
        try {
          // Try to save but with a strict timeout
          const savePromise = onSave()
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Save timeout')), 1000)
          })
          
          await Promise.race([savePromise, timeoutPromise])
        } catch (err) {
          console.log('Save timed out or failed, toggling anyway')
        }
      }
      
      // Always toggle mode
      onClick()
    } catch (err) {
      console.error('Error in triggerToggle:', err)
      // Force toggle on error
      onClick()
    } finally {
      if (isMounted.current) {
        setIsWorking(false)
      }
    }
  }, [isEditing, isWorking, onClick, onSave])
  
  // Detect if user is on Mac 
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])
  
  // Set up keyboard shortcuts with capture phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+E on Mac or Ctrl+E on other platforms
      if (((isMac && e.metaKey) || (!isMac && e.ctrlKey)) && e.key.toLowerCase() === 'e') {
        console.log('Keyboard shortcut detected')
        e.preventDefault()
        e.stopPropagation()
        
        // Force toggle immediately
        forceToggle()
        return false
      }
    }
    
    // Use capture phase to intercept events before they reach editor
    document.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      isMounted.current = false
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [forceToggle, isMac])
  
  // Only show for admin users
  if (!session?.user?.isAdmin) return null
  
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('Button clicked')
    e.stopPropagation()
    e.preventDefault()
    
    // Don't wait for anything, just toggle immediately
    forceToggle()
  }
  
  const keyboardShortcut = isMac ? '⌘E' : 'Ctrl+E'
  
  // Handle save action with error handling
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const success = await onSave();
      
      if (success) {
        // If save was successful, exit edit mode
        onClick();
      } else {
        setSaveError('Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving:', err);
      setSaveError('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div 
      className="fixed bottom-0 right-0 mb-8 mr-8 z-[99999]"
      style={{ pointerEvents: 'all' }} 
      onClick={e => e.stopPropagation()}
    >
      {/* Show error message if save failed */}
      {saveError && (
        <div className="absolute -top-8 right-0 text-red-500 text-sm">
          {saveError}
        </div>
      )}
      
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="group flex items-center justify-center w-12 h-12 shadow-lg rounded-full transition-all duration-200 hover:scale-110"
        style={{
          background: isEditing ? 'white' : '#6B46C1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: isWorking ? 'scale(0.95)' : 'scale(1)',
        }}
        aria-label={isEditing ? `Save and exit (${keyboardShortcut})` : `Edit page (${keyboardShortcut})`}
      >
        <span 
          className="text-2xl transition-transform duration-200 group-hover:rotate-12" 
          style={{ color: isEditing ? 'black' : 'white' }}
        >
          {isWorking ? (
            <span className="animate-pulse">✦</span>
          ) : (
            <span>✦</span>
          )}
        </span>
      </button>
      
      {/* Keyboard shortcut indicator */}
      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-70">
        {keyboardShortcut}
      </div>
    </div>
  )
} 