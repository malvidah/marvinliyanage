'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import getSupabaseBrowser from '@/lib/supabase-browser'
import { deletePages } from '@/lib/page-utils'
import { CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'

interface EditButtonProps {
  onClick: () => void
  isEditing: boolean
  onSave?: () => Promise<boolean>
  pageId?: string
  pageSlug?: string
}

// SVG icons
const StarIcon = () => (
  <span className="text-lg">✧</span>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export default function EditButton({ onClick, isEditing, onSave, pageId, pageSlug }: EditButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Handle successful save animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [showSuccess])
  
  // Handle save button click - SIMPLIFIED
  const handleSave = useCallback(async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      const success = await onSave()
      
      if (success) {
        setShowSuccess(true)
        setTimeout(() => {
          onClick()
        }, 500)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, onClick])
  
  // Handle delete button click
  const handleDelete = useCallback(async () => {
    if (!pageId || !pageSlug) return
    
    if (!confirm(`Are you sure you want to delete this page? This action cannot be undone.`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const result = await deletePages([pageId], [pageSlug])
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Navigate away from deleted page
      router.push('/')
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Failed to delete page: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }, [pageId, pageSlug, router])
  
  if (!session?.user?.isAdmin) return null
  
  return (
    <div className="relative">
      {showSuccess && (
        <div className="absolute -top-8 right-0 text-green-500 text-sm">
          Saved!
        </div>
      )}
      
      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-red-400 text-white hover:bg-red-500"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <TrashIcon className="h-5 w-5" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onClick}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600 text-white hover:bg-purple-700 group"
          >
            <span className="text-lg group-hover:hidden">✧</span>
            <span className="text-lg hidden group-hover:block">✦</span>
          </button>
        )}
      </div>
    </div>
  )
} 