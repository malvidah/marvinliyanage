import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import supabase from '@/lib/supabase';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchPages();
    } else {
      setLoading(false);
    }
  }, [status, session]);
  
  async function fetchPages() {
    setLoading(true);
    const { data } = await supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false });
    
    setPages(data || []);
    setLoading(false);
  }
  
  if (status === 'loading') {
    return (
      <Layout title="Admin - Loading">
        <div className="text-center py-16">
          <p className="text-xl">Loading...</p>
        </div>
      </Layout>
    );
  }
  
  if (!session) {
    return (
      <Layout title="Admin Login">
        <div className="max-w-md mx-auto p-8 bg-white shadow-sm rounded-lg">
          <h1 className="text-2xl font-bold mb-6">Login to Admin</h1>
          <button
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </Layout>
    );
  }
  
  if (!session.user.isAdmin) {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don't have admin privileges.</p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Admin Dashboard">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {loading ? (
        <p>Loading pages...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map(page => (
            <div key={page.id} className="p-4 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
              <h2 className="text-xl font-medium mb-2">{page.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                Updated: {new Date(page.updated_at).toLocaleDateString()}
              </p>
              <div className="flex space-x-2">
                <Link 
                  href={`/${page.slug}`}
                  className="text-purple-800 hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
} 