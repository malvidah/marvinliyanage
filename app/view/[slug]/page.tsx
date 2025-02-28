import ClientWrapper from './_components/ClientWrapper';
import { notFound } from 'next/navigation';
import getSupabaseServer from '@/lib/supabase-server';

// Define the correct props type structure for Next.js pages
interface PageParams {
  params: {
    slug: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: PageParams) {
  const { slug } = params;
  const supabase = getSupabaseServer();
  
  // Fetch the page data
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
  
  // If page doesn't exist and create=true isn't in URL, show 404
  // Otherwise, pass null page to client and let it handle creation
  
  return (
    <ClientWrapper 
      page={page}
      otherPages={otherPages}
      slug={slug}
    />
  );
}

