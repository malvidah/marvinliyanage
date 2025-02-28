'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      <div className="mb-4">Status: <span className="font-mono">{status}</span></div>
      
      {session ? (
        <div>
          <h2 className="text-xl mb-2">Session Data:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      ) : (
        <div>No active session</div>
      )}
      
      <div className="mt-4">
        <Link href="/" className="text-blue-500 hover:underline">
          Go back to home page
        </Link>
      </div>
    </div>
  )
} 