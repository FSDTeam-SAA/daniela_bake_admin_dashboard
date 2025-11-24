// app/auth/forgot-password/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@/lib/auth-api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authAPI.forgetPassword(email)
      toast.success("OTP sent to your email")
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to send OTP"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF1DB] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
          <p className="text-gray-500 mb-6">
            Enter your registered email address, we&apos;ll send you a code to reset your password.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5B9FED] hover:bg-[#4A8FDD] text-white h-10"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
