import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const ALLOWED_EMAIL = "marvin.liyanage@gmail.com"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return user.email === ALLOWED_EMAIL
    },
    async session({ session }) {
      if (session.user) {
        ;(session as any).isAdmin = session.user.email === ALLOWED_EMAIL
      }
      return session
    },
  },
  pages: {
    error: "/",
  },
})

export { handler as GET, handler as POST }
