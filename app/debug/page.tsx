export default function DebugPage() {
  // Only check if variables exist and show first few characters
  const supabaseUrlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8) + '...' 
    : 'not set';
  
  const supabaseKeyExists = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <ul className="list-disc ml-8">
        <li>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrlPrefix}</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseKeyExists ? 'exists' : 'not set'}</li>
      </ul>
    </div>
  );
} 