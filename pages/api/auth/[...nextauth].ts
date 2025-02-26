import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import supabase from '@/lib/supabase';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "1088634506396-enhbs883dvqburm95c23fjhhpr5h6vqi.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      // TEMPORARY: Always allow your email
      if (user.email === "mali@example.com") { // Update with your actual email
        return true;
      }
      
      try {
        // Check if user is in allowed admin list
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error("Supabase error in signIn callback:", error);
          return false;
        }
        
        if (!data?.is_admin) {
          // Not an admin
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session }) {
      // Add admin status to session
      if (session.user?.email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('email', session.user.email)
            .single();
          
          if (error) {
            console.error("Supabase error in session callback:", error);
            return session;
          }
          
          session.user.isAdmin = !!data?.is_admin;
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
}); 