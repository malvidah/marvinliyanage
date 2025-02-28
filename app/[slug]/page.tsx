import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import getSupabaseServer from '@/lib/supabase-server';
import ClientWrapper from './_components/ClientWrapper';

// Define metadata generation for this page
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = params;
  
  const supabase = getSupabaseServer();
  const { data: page } = await supabase
    .from('pages')
    .select('title')
    .eq('slug', slug)
    .single();
  
  return {
    title: page?.title || slug,
  };
}

// The page component
export default async function Page({ params }) {
  const { slug } = params;
  const supabase = getSupabaseServer();
  
  // Fetch page data
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();
  
  // Fetch other pages for linking
  const { data: otherPages } = await supabase
    .from('pages')
    .select('slug, title')
    .neq('slug', slug);
  
  return (
    <ClientWrapper 
      page={page}
      otherPages={otherPages || []}
      slug={slug}
    />
  );
} 