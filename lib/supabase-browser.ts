'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Create a type-safe Supabase client
export default function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 