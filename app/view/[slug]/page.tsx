// @ts-nocheck
import ClientWrapper from './_components/ClientWrapper';
import getSupabaseServer from '@/lib/supabase-server';

/** @param {any} props */
export default async function ViewPage(props) {
  const { slug } = props.params;
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
      otherPages={otherPages || []}
      slug={slug}
    />
  );
}

