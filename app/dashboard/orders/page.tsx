"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ordersAPI, type OrderQueryParams } from "@/lib/orders-api"
import type { Order } from "@/lib/types"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react"

export default function OrdersPage() {
  const limit = 10

  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  // ✅ ProductsPage-like filters dropdown
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [status, setStatus] = useState<"" | Order["status"]>("")
  const [paymentStatus, setPaymentStatus] = useState<"" | Order["paymentStatus"]>("")
  const [sort, setSort] = useState<string>("-createdAt")

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const queryClient = useQueryClient()

  // ✅ backend params
  const params: OrderQueryParams = useMemo(() => {
    const p: OrderQueryParams = { page, limit, sort }
    if (status) p.status = status
    // If your backend supports paymentStatus query, keep it:
    if (paymentStatus) p.paymentStatus = paymentStatus
    return p
  }, [page, limit, sort, status, paymentStatus])

  // ✅ reset page when filters change (not search)
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentStatus, sort])

  const { data: ordersData, isLoading, isFetching } = useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersAPI.getOrders(params),
    placeholderData: (prev) => prev, // ✅ TanStack v5 replacement for keepPreviousData
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      paymentStatus,
    }: {
      id: string
      status?: Order["status"]
      paymentStatus?: Order["paymentStatus"]
    }) => ordersAPI.updateOrderStatus(id, { status, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order updated successfully")
    },
    onError: () => toast.error("Failed to update order"),
  })

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => ordersAPI.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order deleted successfully")
      setOrderToDelete(null)
    },
    onError: () => toast.error("Failed to delete order"),
  })

  const orders = ordersData?.data?.orders ?? []
  const total = ordersData?.data?.total ?? 0
  const pages = ordersData?.data?.pages ?? 1

  // ✅ client-side search (optional; backend search not implemented in your controller)
  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return orders

    return orders.filter((o) => {
      const id = String(o?._id ?? "").toLowerCase()
      const name = String(o?.user?.name ?? "").toLowerCase()
      return id.includes(q) || name.includes(q)
    })
  }, [orders, searchTerm])

  const activeFiltersCount =
    (status ? 1 : 0) + (paymentStatus ? 1 : 0) + (sort !== "-createdAt" ? 1 : 0)

  const clearFilters = () => {
    setStatus("")
    setPaymentStatus("")
    setSort("-createdAt")
    setPage(1)
    setFiltersOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Lists</h1>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* ✅ Fixed Filters Button (ProductsPage style) */}
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

                {/* Order Status */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Order Status</p>
                  <div className="space-y-2">
                    {(
                      [
                        { label: "All", value: "" },
                        { label: "Pending", value: "Pending" },
                        { label: "Processing", value: "Processing" },
                        { label: "Delivered", value: "Delivered" },
                        { label: "Cancelled", value: "Cancelled" },
                      ] as const
                    ).map((opt) => (
                      <label key={opt.label} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="status"
                          checked={status === opt.value}
                          onChange={() => setStatus(opt.value)}
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
                  <th className="px-4 py-3 text-left font-bold">Payment</th>
                  <th className="px-4 py-3 text-left font-bold">Order Status</th>
                  <th className="px-4 py-3 text-left font-bold">Payment Status</th>
                  <th className="px-4 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order: any) => {
                  const firstRow = order.items?.[0]
                  const product = firstRow?.item ?? null
                  const coverImage = product?.images?.[0] || product?.image

                  return (
                    <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">#{String(order._id).slice(-6)}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {coverImage && (
                            <div className="w-10 h-10 relative rounded-lg overflow-hidden">
                              <Image
                                src={coverImage || "/placeholder.svg"}
                                alt={product?.name ?? "Order item"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div>
                            <p className="font-medium">{product?.name ?? "Deleted / unavailable product"}</p>
                            {(order.items?.length ?? 0) > 1 && (
                              <p className="text-xs text-gray-500">+{order.items.length - 1} more</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {order.createdAt ? format(new Date(order.createdAt), "dd MMM, yyyy") : "--"}
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{order.user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-500">{order.user?.email ?? "--"}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold">${Number(order.totalAmount ?? 0)}</td>

                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              className={`${
                                order.paymentStatus === "Paid"
                                  ? "bg-[#83DA71] hover:bg-green-500 text-white"
                                  : "bg-orange-300 hover:bg-orange-400 text-white"
                              }`}
                            >
                              {order.paymentStatus === "Paid" ? "Done" : "Hold"}
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: order._id,
                                  paymentStatus: "Paid",
                                })
                              }
                            >
                              Mark as Paid
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: order._id,
                                  paymentStatus: "Pending",
                                })
                              }
                            >
                              Mark as Pending
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: order._id,
                                  paymentStatus: "Failed",
                                })
                              }
                            >
                              Mark as Failed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="bg-[#5B9FED] hover:bg-[#4A8FDD] text-white">
                              {order.status ?? "--"}
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            {(["Pending", "Processing", "Delivered", "Cancelled"] as const).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: order._id,
                                    status: s,
                                  })
                                }
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      <td className="px-4 py-3">{order.paymentStatus ?? "--"}</td>

                      <td className="px-4 py-3">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>

                        <Button size="icon" variant="ghost" onClick={() => setOrderToDelete(order)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">No orders found.</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} from {total}
            {isFetching && !isLoading ? (
              <span className="ml-2 text-xs text-gray-400">(Updating...)</span>
            ) : null}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
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
                  size="sm"
                  variant={page === p ? "default" : "outline"}
                  className={
                    page === p
                      ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                      : "border-gray-200 text-gray-600"
                  }
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="bg-[#DCEBFB] text-[#5B9FED] border-none hover:bg-[#C8E1FA]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete order{" "}
              <span className="font-semibold">#{String(orderToDelete?._id ?? "").slice(-6)}</span>?
              This action cannot be undone.
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

      {/* Details Dialog */}
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
                  <p className="text-sm text-gray-600">Email: {selectedOrder.user?.email ?? "—"}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.phone ?? "—"}</p>
                  <p className="text-sm text-gray-600">Address: {selectedOrder.address ?? "—"}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Info</h4>
                  <p className="text-sm text-gray-600">
                    Date: {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP") : "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium">{selectedOrder.status ?? "—"}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment: <span className="font-medium">{selectedOrder.paymentStatus ?? "—"}</span>
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
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={p?.name ?? "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {p?.name ?? "Deleted / unavailable product"}
                          </p>
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
