'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EditableContent from './EditableContent';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import PageGraphView from '@/components/PageGraphView';

interface ClientWrapperProps {
  page: any;
  otherPages: any[];
  slug: string;
}

export default function ClientWrapper({ page, otherPages, slug }: ClientWrapperProps) {
  const searchParams = useSearchParams();
  const shouldCreate = searchParams.get('create') === 'true';
  
  // If page doesn't exist and we're not in create mode, show 404
  if (!page && !shouldCreate) {
    notFound();
  }
  
  // Enable refresh of graph when content changes
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const handlePageUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        {/* Graph view */}
        <PageGraphView 
          currentSlug={slug}
          currentContent={page?.content}
          currentTitle={page?.title || slug}
          updateTrigger={updateTrigger}
        />
        
        {/* Editable content */}
        <EditableContent 
          page={page} 
          otherPages={otherPages}
          slug={slug}
          onSave={handlePageUpdate}
        />
      </div>
    </Layout>
  );
} 