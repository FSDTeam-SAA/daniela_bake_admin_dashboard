// lib/auth-api.ts
import apiClient from "./api"
import type { AuthResponse } from "./types"

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", { email, password })
    return response.data
  },

  forgetPassword: async (email: string) => {
    const response = await apiClient.post("/auth/forgot-password", { email })
    return response.data
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post("/auth/verify-otp", { email, otp })
    return response.data
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await apiClient.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
    })
    return response.data
  },

  changePassword: async (
    data: { currentPassword: string; newPassword: string },
    accessToken?: string,
  ) => {
    const response = await apiClient.post("/auth/change-password", data, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    return response.data
  },
}
