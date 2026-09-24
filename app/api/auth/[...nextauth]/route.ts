import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authAPI } from "@/lib/auth-api"

const accessTokenLifetime = 14 * 60 * 1000 // Refresh before the backend's 15-minute expiry.

type DashboardToken = {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  error?: "RefreshAccessTokenError"
}

const refreshes = new Map<string, Promise<DashboardToken>>()

async function refreshAccessToken(token: DashboardToken): Promise<DashboardToken> {
  const refreshToken = token.refreshToken
  if (!refreshToken) return { ...token, error: "RefreshAccessTokenError" }

  let pending = refreshes.get(refreshToken)
  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        })
        if (!response.ok) throw new Error("Token refresh failed")

        const result = await response.json()
        if (!result.success || !result.data?.accessToken || !result.data?.refreshToken) {
          throw new Error("Invalid token refresh response")
        }

        return {
          ...token,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          accessTokenExpires: Date.now() + accessTokenLifetime,
          error: undefined,
        }
      } catch {
        return { ...token, error: "RefreshAccessTokenError" as const }
      }
    })()
    refreshes.set(refreshToken, pending)
    void pending.then(() => refreshes.delete(refreshToken), () => refreshes.delete(refreshToken))
  }
  return pending
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        try {
          const response = await authAPI.login(credentials.email, credentials.password)

          if (response.success && response.data.user) {
            return {
              id: response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.name,
              role: response.data.user.role,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            }
          }

          throw new Error("Login failed")
        } catch (error) {
          throw new Error("Invalid email or password")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        token.accessTokenExpires = Date.now() + accessTokenLifetime
        token.role = (user as any).role
        token.id = user.id
        return token
      }
      if (Date.now() < Number(token.accessTokenExpires ?? 0)) return token
      return { ...token, ...(await refreshAccessToken(token as unknown as DashboardToken)) }
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).accessToken = token.accessToken
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      ;(session as any).error = token.error
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // Matches the backend refresh-token lifetime.
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
