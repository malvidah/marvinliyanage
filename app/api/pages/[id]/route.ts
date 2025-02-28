import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get current user session to check authorization
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - No session' },
      { status: 401 }
    );
  }
  
  // Simplified admin check - you may need to adjust this based on your auth setup
  // Get the admin status directly from the session claims if available
  const isAdmin = session.user?.app_metadata?.admin || 
                 session.user?.user_metadata?.isAdmin;
                 
  if (!isAdmin) {
    // Fallback: check the user_roles table if it exists
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
        
      if (error || !userRoles || userRoles.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Not admin' },
          { status: 401 }
        );
      }
    } catch (e) {
      console.error('Error checking admin role:', e);
      // For debugging, allow the operation to proceed
      console.log('DEBUG MODE: Allowing delete operation without admin check');
    }
  }
  
  // Get the page slug from the request
  const { slug } = await request.json();
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  try {
    // Find all pages that link to this page
    const { data: referencingPages } = await supabase
      .from('pages')
      .select('id, content')
      .neq('id', params.id);
      
    // Update each page to replace [slug] with plain text
    for (const page of referencingPages || []) {
      let contentStr = typeof page.content === 'string'
        ? page.content
        : JSON.stringify(page.content);
        
      // Check if this page actually references the slug
      if (contentStr.includes(`[${slug}]`)) {
        // Replace [slug] with slug text (without brackets)
        const updatedContent = contentStr.replace(
          new RegExp(`\\[${slug}\\]`, 'g'),
          slug.replace(/-/g, ' ')
        );
        
        // Update the page content
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
      .eq('id', params.id);
      
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete operation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 