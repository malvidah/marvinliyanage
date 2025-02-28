#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Protected pages that should never be deleted
const PROTECTED_PAGES = ['admin', 'archive', 'hello'];

async function cleanDatabase() {
  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: Required environment variables not found.');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file');
    process.exit(1);
  }

  // Create Supabase client with service key for admin privileges
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('🧹 Starting database cleanup...');
  console.log(`🛡️  Protected pages that will NOT be deleted: ${PROTECTED_PAGES.join(', ')}`);

  try {
    // First, get a list of all pages to be deleted
    const { data: pagesToDelete, error: fetchError } = await supabase
      .from('pages')
      .select('id, slug, title')
      .not('slug', 'in', `(${PROTECTED_PAGES.join(',')})`);

    if (fetchError) {
      throw new Error(`Error fetching pages: ${fetchError.message}`);
    }

    if (!pagesToDelete || pagesToDelete.length === 0) {
      console.log('✅ No pages to delete. Database is already clean.');
      return;
    }

    console.log(`🗑️  Found ${pagesToDelete.length} pages to delete:`);
    pagesToDelete.forEach(page => {
      console.log(`   - ${page.slug}: ${page.title}`);
    });

    // Confirm before deletion
    console.log('\n⚠️  WARNING: This action cannot be undone! ⚠️');
    console.log('Do you want to continue? (yes/no)');
    
    // In a real script, you'd add user confirmation here
    // For safety, let's comment out the actual deletion and make it manual
    
    /*
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .not('slug', 'in', `(${PROTECTED_PAGES.join(',')})`);

    if (deleteError) {
      throw new Error(`Error deleting pages: ${deleteError.message}`);
    }

    console.log(`✅ Successfully deleted ${pagesToDelete.length} pages.`);
    console.log('Only protected pages remain in the database.');
    */
    
    console.log('\n📋 To execute the deletion, uncomment the deletion code in this script');
    console.log('   or run the following SQL in your Supabase SQL editor:');
    console.log(`   DELETE FROM pages WHERE slug NOT IN ('${PROTECTED_PAGES.join("','")}');`);
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    process.exit(1);
  }
}

// Run the script
cleanDatabase(); 