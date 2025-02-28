import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { id, slug } = await request.json();
    
    if (!id || !slug) {
      return NextResponse.json({ error: 'ID and slug are required' }, { status: 400 });
    }
    
    // Use the appropriate server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Find pages that link to this page
    const { data: referencingPages } = await supabase
      .from('pages')
      .select('id, content')
      .neq('id', id);
      
    // Update references
    for (const page of referencingPages || []) {
      let contentStr = typeof page.content === 'string'
        ? page.content
        : JSON.stringify(page.content);
        
      if (contentStr.includes(`[${slug}]`)) {
        const updatedContent = contentStr.replace(
          new RegExp(`\\[${slug}\\]`, 'g'),
          slug.replace(/-/g, ' ')
        );
        
        await supabase
          .from('pages')
          .update({ content: updatedContent })
          .eq('id', page.id);
      }
    }
    
    // Delete the page
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete operation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 