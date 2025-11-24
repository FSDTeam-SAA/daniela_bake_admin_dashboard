// app/auth/verify-otp/page.tsx
"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@/lib/auth-api"

// Outer component: wraps inner component in Suspense
export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFF1DB] py-12 px-4">
          <div className="w-full max-w-md">
            <div className="p-8">
              <p className="text-center text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}

// Inner component: safe to use useSearchParams here
function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const emailFromQuery = searchParams.get("email") || ""
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!emailFromQuery || !otp) {
      toast.error("Missing email or OTP")
      return
    }

    setIsLoading(true)
    try {
      await authAPI.verifyOTP(emailFromQuery, otp)
      toast.success("OTP verified! Please reset your password.")

      router.push(
        `/auth/reset-password?email=${encodeURIComponent(
          emailFromQuery,
        )}&otp=${encodeURIComponent(otp)}`,
      )
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Failed to verify OTP. Please try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSegmentChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const chars = otp.split("")
    chars[index] = value
    const next = chars.join("")
    setOtp(next)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF1DB] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</h2>
          <p className="text-gray-500 mb-6">
            We have sent a 6-digit code to your email:{" "}
            <span className="font-medium">{emailFromQuery}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 justify-center">
              {[...Array(6)].map((_, i) => (
                <Input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 text-center text-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={otp[i] || ""}
                  onChange={(e) => handleSegmentChange(i, e.target.value)}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-[#5B9FED] hover:bg-[#4A8FDD] text-white h-10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
