import { createServerClient } from '@/utils/supabase-server'
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
  
  // Server-side data fetching
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()
  
  const { data: otherPages } = await supabase
    .from('pages')
    .select('slug, title')
    .neq('slug', slug)
  
  // Pass data to the client wrapper
  return (
    <ClientWrapper
      page={page || null}
      otherPages={otherPages || []}
      slug={slug}
    />
  )
} 