'use client'

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex justify-center flex-grow">
            <Link href="/">
              <Image 
                src="/marvinliyanage.png" 
                alt="Marvin Liyanage" 
                width={700} 
                height={100} 
                priority
                className="h-auto"
              />
            </Link>
          </div>
          
          {/* Admin link - subtle and small */}
          <Link 
            href="/admin" 
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            aria-label="Admin Login"
          >
            {status === 'authenticated' ? (
              session?.user?.isAdmin ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Admin
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Signed in
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Admin
              </>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl bg-white">
        {children}
      </main>
    </div>
  );
} 