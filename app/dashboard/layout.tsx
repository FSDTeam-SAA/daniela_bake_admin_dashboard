"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const signingOut = useRef(false)

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError" && !signingOut.current) {
      signingOut.current = true
      void signOut({ callbackUrl: "/auth/login" })
    } else if (status === "unauthenticated") {
      router.replace("/auth/login")
    }
  }, [session, status, router])

  if (status !== "authenticated" || !session?.user || (session as any).error) return null

  return <DashboardShell user={session.user}>{children}</DashboardShell>
}
