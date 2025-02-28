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
        session.user.isAdmin = true; // Or implement your own logic
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 