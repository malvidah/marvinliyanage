'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a singleton client to prevent multiple instances
let client: ReturnType<typeof createClientComponentClient> | null = null

export default function getSupabaseBrowser() {
  if (!client) {
    client = createClientComponentClient()
  }
  
  return client
} 