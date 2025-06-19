import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Send user data to our backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              google_id: account.providerAccountId,
            }),
          });

          if (!response.ok) {
            return false;
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).googleId = token.googleId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }
