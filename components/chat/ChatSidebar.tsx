"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface Customer {
  id: string
  name: string
  email: string
  conversationId?: string
  lastMessagePreview?: string
  hasUnread?: boolean
}

interface ChatSidebarProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
  onStartConversation: (customer: Customer) => void
}

export function ChatSidebar({ customers, selectedCustomer, onSelectCustomer, onStartConversation }: ChatSidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.lastMessagePreview ?? "").toLowerCase().includes(q),
    )
  }, [customers, search])

  return (
    <Card className="p-4 w-full max-w-xs lg:max-w-sm border-r h-full flex flex-col rounded-none border-l-0 border-t-0 border-b-0">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-1 overflow-y-auto pr-1">
        {filtered.map((c) => {
          const isSelected = selectedCustomer?.id === c.id
          return (
            <button
              key={c.id}
              onClick={() => (c.conversationId ? onSelectCustomer(c) : onStartConversation(c))}
              className={cn(
                "w-full text-left p-3 rounded-lg cursor-pointer bg-gray-100 transition-colors flex items-start gap-2",
                isSelected ? "bg-blue-100" : "hover:bg-gray-50",
              )}
            >
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">{c.lastMessagePreview || c.email}</p>
              </div>
              {c.hasUnread && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1" />}
            </button>
          )
        })}

        {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No conversations found</p>}
      </div>
    </Card>
  )
}
