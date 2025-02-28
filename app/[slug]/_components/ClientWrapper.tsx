'use client'

import { useState } from 'react'
import PageWrapper from './PageWrapper'
import PageGraphView from '../../../components/PageGraphView'
import EditableContent from './EditableContent'

export default function ClientWrapper({ 
  page: initialPage, 
  otherPages,
  slug,
  children
}) {
  const [createNewPage, setCreateNewPage] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  const handleContentSaved = () => {
    setUpdateTrigger(prev => prev + 1)
  }

  return (
    <div>
      <PageWrapper
        page={initialPage}
        otherPages={otherPages}
        slug={slug}
        createNewPage={createNewPage}
        setCreateNewPage={setCreateNewPage}
      />
      
      <EditableContent 
        page={initialPage} 
        otherPages={otherPages}
        slug={slug}
        onSave={handleContentSaved}
      />
      
      <PageGraphView 
        currentSlug={slug}
        currentContent={initialPage?.content}
        currentTitle={initialPage?.title}
        updateTrigger={updateTrigger}
      />
      
      {children}
    </div>
  )
} 