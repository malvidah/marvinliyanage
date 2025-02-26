import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Marvin Liyanage' }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Marvin Liyanage - Personal Wiki" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4 flex justify-center">
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
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
} 