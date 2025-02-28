import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Add your sign-in logic here
      // For example, check if the user's email is in an allowed list
      return true;
    },
    async session({ session, token }) {
      // Add custom properties to the session if needed
      if (session.user) {
        // You can add custom properties like isAdmin
        session.user.isAdmin = true; // Or implement your own logic
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 