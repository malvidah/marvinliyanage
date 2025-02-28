'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AutoArchive() {
  const { data: session, status } = useSession()
  const [lastArchived, setLastArchived] = useState<string | null>(null)
  
  useEffect(() => {
    // Check if the user is an admin and the session is active
    if (status === 'authenticated' && session?.user?.isAdmin) {
      // Trigger the archiving process on every login
      console.log('Auto-archiving orphaned pages...')
      fetch('/api/archive-orphaned-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(`Auto-archive complete: Found ${data.orphanedPagesCount} orphaned pages, added ${data.updatedCount} to archive.`)
          const now = new Date().toISOString()
          localStorage.setItem('lastArchiveTime', now)
          setLastArchived(now)
        } else {
          console.error('Auto-archive failed:', data.error)
        }
      })
      .catch(error => {
        console.error('Error during auto-archive:', error)
      })
    }
  }, [status, session]) // Run when authentication status changes
  
  // This component doesn't render anything visible
  return null
} 