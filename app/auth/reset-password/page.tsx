// app/auth/reset-password/page.tsx
"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@/lib/auth-api"

// Outer component: just sets up Suspense
export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  )
}

// Inner component: can safely use useSearchParams
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""
  const otp = searchParams.get("otp") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !otp) {
      toast.error("Missing email or OTP. Please restart the reset process.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      await authAPI.resetPassword(email, otp, password)
      toast.success("Password reset successful")

      setTimeout(() => {
        router.push("/auth/login")
      }, 1500)
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to reset password"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF1DB] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-500 mb-6">Create your new password.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5B9FED] hover:bg-[#4A8FDD] text-white h-10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
