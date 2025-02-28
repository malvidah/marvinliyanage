import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Define the auth options inline (don't export them from this file)
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session }) {
      if (session.user) {
        session.user.isAdmin = true; // Or implement your own logic
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Create the handler
const handler = NextAuth(authOptions)

// Only export the handler functions
export { handler as GET, handler as POST } 