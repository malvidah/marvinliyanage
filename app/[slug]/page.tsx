import { createServerClient } from '@/utils/supabase-server'
import PageWrapper from './_components/PageWrapper'
import ClientWrapper from './_components/ClientWrapper'

export async function generateMetadata({ params }) {
  const { slug } = params
  const supabase = createServerClient()
  
  const { data: page } = await supabase
    .from('pages')
    .select('title')
    .eq('slug', slug)
    .single()
  
  return {
    title: page ? `${page.title} — Marvin Liyanage` : 'Page Not Found',
  }
}

export default async function Page({ params }) {
  const supabase = createServerClient()
  const { slug } = params
  
  // Try to find the page without auto-creating it
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()
  
  // Get other pages for linking
  const { data: otherPages } = await supabase
    .from('pages')
    .select('slug, title')
    .neq('slug', slug)
  
  // Important: Pass the page as null if it doesn't exist
  return (
    <ClientWrapper
      page={page || null}
      otherPages={otherPages || []}
      slug={slug}
    />
  )
} 