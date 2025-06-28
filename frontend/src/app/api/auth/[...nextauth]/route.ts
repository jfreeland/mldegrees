import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Local development provider
    ...(process.env.NODE_ENV === 'development' ? [
      CredentialsProvider({
        id: "local-user",
        name: "Local User",
        credentials: {},
        async authorize() {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/local`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'user' })
            });

            if (response.ok) {
              const data = await response.json();
              return {
                id: data.user.id.toString(),
                email: data.user.email,
                name: data.user.name,
                googleId: data.token,
                role: data.user.role
              };
            }
          } catch (error) {
            console.error('Local auth error:', error);
          }
          return null;
        }
      }),
      CredentialsProvider({
        id: "local-admin",
        name: "Local Admin",
        credentials: {},
        async authorize() {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/local`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'admin' })
            });

            if (response.ok) {
              const data = await response.json();
              return {
                id: data.user.id.toString(),
                email: data.user.email,
                name: data.user.name,
                googleId: data.token,
                role: data.user.role
              };
            }
          } catch (error) {
            console.error('Local auth error:', error);
          }
          return null;
        }
      })
    ] : [])
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
      // Local providers are already handled in authorize
      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        if (account.provider === "google") {
          token.googleId = account.providerAccountId;
        } else if (account.provider === "local-user" || account.provider === "local-admin") {
          token.googleId = (user as any).googleId;
          token.role = (user as any).role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).googleId = token.googleId;
        (session.user as any).role = token.role;
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
