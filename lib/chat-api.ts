// lib/chat-api.ts
export interface Participant {
  _id: string
  name: string
  email: string
  role: string
}

export interface Conversation {
  _id: string
  participants: Participant[]
  lastMessageAt: string
  updatedAt: string
}

export interface Attachment {
  url: string
  public_id: string
}

export interface Message {
  _id: string
  conversation: string
  sender: Participant | string
  receiver: Participant | string
  text: string
  attachment?: Attachment
  createdAt: string
  readAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/chat`

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // Get the token from NextAuth session
  const { getSession } = await import("next-auth/react")
  const session = await getSession()
  const token = (session?.user as any)?.accessToken

  console.log("[v0] Chat API - Session data:", { hasSession: !!session, hasToken: !!token })

  const res = await fetch(input, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("[v0] Chat API - Request failed:", { status: res.status, error: errorText })
    throw new Error(`Request failed with status ${res.status}`)
  }

  const json = (await res.json()) as ApiResponse<T>
  if (!json.success) throw new Error(json.message || "Request failed")
  return json.data
}

export const chatApi = {
  listConversations() {
    return apiFetch<Conversation[]>(`${BASE}/conversations`)
  },

  getOrCreateConversation(userId: string) {
    return apiFetch<Conversation>(`${BASE}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
  },

  getMessages(conversationId: string, page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    return apiFetch<Message[]>(`${BASE}/messages/${conversationId}?${params.toString()}`)
  },

  async sendMessage(conversationId: string, payload: { text: string; receiverId: string; file?: File | null }) {
    let body: BodyInit
    const headers: HeadersInit = {}

    if (payload.file) {
      const form = new FormData()
      form.append("receiverId", payload.receiverId)
      form.append("text", payload.text)
      form.append("attachment", payload.file)
      body = form
    } else {
      headers["Content-Type"] = "application/json"
      body = JSON.stringify({
        receiverId: payload.receiverId,
        text: payload.text,
      })
    }

    const data = await apiFetch<Message[]>(`${BASE}/messages/${conversationId}`, {
      method: "POST",
      body,
      headers,
    })

    // controller returns array [message]
    return data[0]
  },

  markRead(conversationId: string) {
    return apiFetch<{ conversationId: string; userId: string }>(`${BASE}/messages/${conversationId}/read`, {
      method: "POST",
    })
  },
}
