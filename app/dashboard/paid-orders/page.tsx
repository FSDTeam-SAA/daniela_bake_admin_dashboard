"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ordersAPI, type OrderQueryParams } from "@/lib/orders-api"
import type { Order } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, Eye } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"

export default function PaidOrdersPage() {
  const limit = 10
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<"all" | "day" | "week" | "month" | "year">("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const params: OrderQueryParams = useMemo(() => {
    const p: OrderQueryParams = { page, limit, sort: "-createdAt", paymentStatus: "Paid" }
    if (timeRange !== "all") p.timeRange = timeRange
    return p
  }, [page, limit, timeRange])

  useEffect(() => {
    setPage(1)
  }, [timeRange])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["orders", "paid", params],
    queryFn: () => ordersAPI.getOrders(params),
    placeholderData: (prev) => prev,
  })

  const orders = data?.data?.orders ?? []
  const total = data?.data?.total ?? 0
  const pages = data?.data?.pages ?? 1

  const visibleOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return orders

    return orders.filter((order) => {
      const id = String(order?._id ?? "").toLowerCase()
      const name = String(order?.user?.name ?? "").toLowerCase()
      const email = String(order?.user?.email ?? "").toLowerCase()
      return id.includes(q) || name.includes(q) || email.includes(q)
    })
  }, [orders, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paid Orders</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Admin</span>
            <span>/</span>
            <span>Orders</span>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className="w-4 h-4" />
            </Button>

            {filtersOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-900">Time Range</p>
                  <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-2">
                  {(
                    [
                      { label: "All", value: "all" },
                      { label: "Today", value: "day" },
                      { label: "This Week", value: "week" },
                      { label: "This Month", value: "month" },
                      { label: "This Year", value: "year" },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="paid-time-range"
                        checked={timeRange === opt.value}
                        onChange={() => setTimeRange(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#7B3F00] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Order Id</th>
                  <th className="px-4 py-3 text-left font-bold">Product</th>
                  <th className="px-4 py-3 text-left font-bold">Date</th>
                  <th className="px-4 py-3 text-left font-bold">Customer</th>
                  <th className="px-4 py-3 text-left font-bold">Total</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const firstRow = order.items?.[0]
                  const product = firstRow?.item
                  const productImage = product?.images?.[0] || product?.image || "/placeholder.svg"
                  const productName = product?.name ?? "Deleted / unavailable product"

                  return (
                    <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">#{String(order._id).slice(-6)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100">
                            <Image src={productImage} alt={productName} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{productName}</p>
                            {order.items.length > 1 && (
                              <p className="text-xs text-gray-500">+{order.items.length - 1} more</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{order.createdAt ? format(new Date(order.createdAt), "dd MMM, yyyy") : "--"}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{order.user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-500">{order.user?.email ?? "--"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">${Number(order.totalAmount ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {visibleOrders.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">No paid orders found.</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
          <p>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} from {total}
            {isFetching && !isLoading ? <span className="ml-2 text-xs text-gray-400">(Updating...)</span> : null}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-[#DCEBFB] text-[#5B9FED] border-none hover:bg-[#C8E1FA]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {[...Array(Math.min(5, pages))].map((_, i) => {
              const p = i + 1
              return (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  className={page === p ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white" : "border-gray-200 text-gray-600"}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="bg-[#DCEBFB] text-[#5B9FED] border-none hover:bg-[#C8E1FA]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details #{String(selectedOrder?._id ?? "").slice(-6)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Info</h4>
                  <p className="text-sm text-gray-600">Name: {selectedOrder.user?.name ?? "Unknown"}</p>
                  <p className="text-sm text-gray-600">Email: {selectedOrder.user?.email ?? "--"}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.phone ?? "--"}</p>
                  <p className="text-sm text-gray-600">Address: {selectedOrder.address ?? "--"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Info</h4>
                  <p className="text-sm text-gray-600">
                    Date: {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP") : "--"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium">{selectedOrder.status ?? "--"}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment: <span className="font-medium">{selectedOrder.paymentStatus ?? "--"}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-bold">${Number(selectedOrder.totalAmount ?? 0)}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>

                <div className="space-y-3">
                  {(selectedOrder.items ?? []).map((row, idx) => {
                    const p = row.item
                    const price = Number(p?.price ?? 0)
                    const qty = Number(row.quantity ?? 0)
                    const img = p?.images?.[0] || p?.image

                    return (
                      <div
                        key={row._id ?? `${selectedOrder._id}-${idx}`}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-12 h-12 relative rounded-md overflow-hidden bg-white">
                          <Image src={img || "/placeholder.svg"} alt={p?.name ?? "Product"} fill className="object-cover" />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{p?.name ?? "Deleted / unavailable product"}</p>
                          <p className="text-sm text-gray-500">
                            ${price} x {qty}
                          </p>
                        </div>

                        <p className="font-medium text-gray-900">${(price * qty).toFixed(2)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
