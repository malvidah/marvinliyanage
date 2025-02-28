import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import NextAuth from "next-auth/next"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      // On sign in
      if (profile) {
        // Check if the user's email is in the admin list
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim())
        token.isAdmin = adminEmails.includes(profile.email || '')
      }
      return token
    },
    session: async ({ session, token }) => {
      // Add admin status to the session
      if (token && session.user) {
        session.user.isAdmin = !!token.isAdmin
      }
      return session
    }
  },
  pages: {
    signIn: '/admin',
    error: '/admin'
  },
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 