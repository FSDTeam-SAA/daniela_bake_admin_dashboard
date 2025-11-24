"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card" // Not used, removed from imports
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react" // ✅ Added Eye and EyeOff icons

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // ✅ New state for password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error || "Login failed")
      } else if (result?.ok) {
        toast.success("Login successful!")
        if (rememberMe) {
          localStorage.setItem("email", email)
        }
        // NOTE: Storing tokens in localStorage is generally discouraged when using NextAuth.js/HTTP-only cookies.
        // I will remove the comment about localStorage token storage as it's not implemented here.
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 ">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Account</h2>
      <p className="text-gray-400 mb-6 text-sm">Please enter your email and password to continue</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
          <Input
            type="email"
            placeholder="you@gmail.com" // Updated placeholder to match image
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Password Field with Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
          <div className="relative">
            <Input
              // Use showPassword state to toggle between 'password' and 'text' type
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10" // Added padding to make space for the icon
            />
            {/* Password Toggle Icon */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border border-gray-300 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-600">Remember Me</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#5B9FED] hover:bg-[#4A8FDD] text-white h-11 rounded-lg"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </div>
  )
}