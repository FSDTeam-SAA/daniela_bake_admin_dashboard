"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ordersAPI, type OrderQueryParams } from "@/lib/orders-api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Order } from "@/lib/types"

export default function DeliveredOrdersPage() {
  const limit = 10

  const [page, setPage] = useState(1)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // search (client-side)
  const [searchTerm, setSearchTerm] = useState("")

  // filters (backend)
  const [sort, setSort] = useState<string>("-createdAt")
  const [paymentStatus, setPaymentStatus] = useState<"" | Order["paymentStatus"]>("")

  const queryClient = useQueryClient()

  // ✅ backend params (Delivered fixed)
  const params: OrderQueryParams = useMemo(
    () => ({
      page,
      limit,
      sort,
      status: "Delivered",
      ...(paymentStatus ? { paymentStatus } : {}),
    }),
    [page, limit, sort, paymentStatus],
  )

  // ✅ reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [sort, paymentStatus])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["orders", "delivered", params],
    queryFn: () => ordersAPI.getOrders(params),
    placeholderData: (prev) => prev, // ✅ v5 keep previous data
  })

  // ✅ update order (paymentStatus only here)
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus?: Order["paymentStatus"] }) =>
      ordersAPI.updateOrderStatus(id, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order updated successfully")
    },
    onError: () => toast.error("Failed to update order"),
  })

  // ✅ delete order
  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => ordersAPI.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order deleted successfully")
      setOrderToDelete(null)
    },
    onError: () => toast.error("Failed to delete order"),
  })

  const orders = Array.isArray(data?.data?.orders) ? (data?.data?.orders as Order[]) : []
  const total = data?.data?.total ?? 0
  const pages = data?.data?.pages ?? 1

  // ✅ client-side search on current page results
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

  const activeFiltersCount = (paymentStatus ? 1 : 0) + (sort !== "-createdAt" ? 1 : 0)

  const clearFilters = () => {
    setPaymentStatus("")
    setSort("-createdAt")
    setFiltersOpen(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivered Orders</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Admin</span>
            <span>/</span>
            <span>Order</span>
          </div>
        </div>
      </div>

      <Card className="p-6">
        {/* Top actions */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order ID / customer..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* ✅ ProductsPage style Filters button + dropdown */}
          <div className="relative">
            <Button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {filtersOpen && (
              <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-lg p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-900">Filters</p>
                  <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                    Close
                  </Button>
                </div>

                {/* Sort */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Sort</p>
                  <div className="space-y-2">
                    {[
                      { label: "Newest", value: "-createdAt" },
                      { label: "Oldest", value: "createdAt" },
                      { label: "Total: Low → High", value: "totalAmount" },
                      { label: "Total: High → Low", value: "-totalAmount" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="sort"
                          checked={sort === opt.value}
                          onChange={() => setSort(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Payment Status</p>
                  <div className="space-y-2">
                    {(
                      [
                        { label: "All", value: "" },
                        { label: "Paid", value: "Paid" },
                        { label: "Pending", value: "Pending" },
                        { label: "Failed", value: "Failed" },
                      ] as const
                    ).map((opt) => (
                      <label key={opt.label} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="paymentStatus"
                          checked={paymentStatus === opt.value}
                          onChange={() => setPaymentStatus(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button
                    className="bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
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
                  <th className="px-4 py-3 text-left font-medium">Order Id</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Payment</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((order) => {
                  const firstRow = order?.items?.[0]
                  const product = firstRow?.item ?? null

                  const productImage = product?.image ?? "/placeholder.svg"
                  const productName = product?.name ?? "Deleted / unavailable product"
                  const itemsCount = Array.isArray(order?.items) ? order.items.length : 0

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="font-medium text-gray-900">#{String(order._id).slice(-6)}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100">
                            <Image src={productImage} alt={productName} fill className="object-cover" />
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">{productName}</p>
                            {itemsCount > 1 && (
                              <p className="text-xs text-gray-500">+ {itemsCount - 1} other items</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {order?.createdAt ? format(new Date(order.createdAt), "dd MMM, yyyy") : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{order?.user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-500">{order?.user?.email ?? "—"}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">${Number(order?.totalAmount ?? 0)}</td>

                      {/* Payment dropdown */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              className={`gap-2 ${
                                order?.paymentStatus === "Paid"
                                  ? "bg-[#83DA71] hover:bg-[#83DA71] text-white"
                                  : "bg-orange-300 hover:bg-orange-400 text-white"
                              }`}
                            >
                              {order?.paymentStatus === "Paid" ? "Done" : "Hold"}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateOrderMutation.mutate({ id: order._id, paymentStatus: "Paid" })}
                            >
                              Mark as Paid
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => updateOrderMutation.mutate({ id: order._id, paymentStatus: "Pending" })}
                            >
                              Mark as Pending
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => updateOrderMutation.mutate({ id: order._id, paymentStatus: "Failed" })}
                            >
                              Mark as Failed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      <td className="px-4 py-3">
                        <Button className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white">Delivered</Button>
                      </td>

                      {/* Action: Delete */}
                      <td className="px-4 py-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setOrderToDelete(order)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {visibleOrders.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">No delivered orders found.</div>
            )}
          </div>
        )}

        {/* Pagination */}
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
                  className={
                    page === p ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white" : "border-gray-200 text-gray-600"
                  }
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

      {/* Delete Confirmation Modal */}
      <Dialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete order{" "}
              <span className="font-semibold">#{String(orderToDelete?._id ?? "").slice(-6)}</span>? This action cannot
              be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOrderToDelete(null)}>
                No
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => orderToDelete && deleteOrderMutation.mutate(orderToDelete._id)}
                disabled={deleteOrderMutation.isPending}
              >
                {deleteOrderMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
