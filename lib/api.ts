import axios, { type AxiosInstance } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

let tokenRequest: Promise<string | null> | undefined
let signingOut = false

function endSession() {
  if (signingOut || typeof window === "undefined") return
  signingOut = true
  void import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: "/auth/login" }))
}

function isPublicAuthRequest(url?: string) {
  return url?.startsWith("/auth/") && !url.startsWith("/auth/change-password")
}

apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window === "undefined" || isPublicAuthRequest(config.url)) return config

    if (!tokenRequest) {
      tokenRequest = import("next-auth/react")
        .then(({ getSession }) => getSession())
        .then((session) => {
          if ((session as any)?.error === "RefreshAccessTokenError") {
            endSession()
            return null
          }
          return (session?.user as any)?.accessToken ?? null
        })
    }

    const pending = tokenRequest
    try {
      const token = await pending
      if (token) config.headers.Authorization = `Bearer ${token}`
    } finally {
      if (tokenRequest === pending) tokenRequest = undefined
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicAuthRequest(error.config?.url)) {
      endSession()
    }
    return Promise.reject(error)
  },
)

export default apiClient
