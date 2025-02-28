import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session }) {
      if (session.user) {
        // Only specific emails should be admins
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        session.user.isAdmin = adminEmails.includes(session.user.email);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 