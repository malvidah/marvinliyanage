'use client'

import { useState } from 'react'
import PageWrapper from './PageWrapper'

export default function ClientWrapper({ 
  page: initialPage, 
  otherPages,
  slug 
}) {
  const [createNewPage, setCreateNewPage] = useState(false)
  
  return (
    <PageWrapper
      page={initialPage}
      otherPages={otherPages}
      slug={slug}
      createNewPage={createNewPage}
      setCreateNewPage={setCreateNewPage}
    />
  )
} 