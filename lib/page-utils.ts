import getSupabaseBrowser from '@/lib/supabase-browser';

/**
 * Deletes one or more pages and updates any references to those pages
 * @param pageIds - Array of page IDs to delete
 * @param pageSlugs - Array of page slugs corresponding to the IDs
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deletePages(pageIds: string[], pageSlugs: string[]) {
  try {
    const supabase = getSupabaseBrowser();
    
    // 1. Get all pages except the ones being deleted
    const { data: allPages } = await supabase
      .from('pages')
      .select('id, slug, content')
      .not('id', 'in', `(${pageIds.join(',')})`)
    
    // 2. Process each page to update content
    for (const page of allPages || []) {
      let contentChanged = false;
      let updatedContent = page.content;
      
      // Check and replace references to each deleted page
      for (const deletedSlug of pageSlugs) {
        const regex = new RegExp(`\\[${deletedSlug}\\]`, 'g');
        if (regex.test(updatedContent)) {
          updatedContent = updatedContent.replace(regex, deletedSlug);
          contentChanged = true;
        }
      }
      
      // Only update if content changed
      if (contentChanged) {
        await supabase
          .from('pages')
          .update({ content: updatedContent })
          .eq('id', page.id);
      }
    }
    
    // 3. Delete the pages
    const { error } = await supabase
      .from('pages')
      .delete()
      .in('id', pageIds);
    
    if (error) throw new Error(error.message);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting pages:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete pages' 
    };
  }
} 