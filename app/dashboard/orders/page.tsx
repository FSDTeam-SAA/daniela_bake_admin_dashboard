"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordersAPI } from "@/lib/orders-api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => ordersAPI.getOrders(page, 10),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) => {
      const updateData: any = {}
      if (status) updateData.status = status
      if (paymentStatus) updateData.paymentStatus = paymentStatus
      return ordersAPI.updateOrderStatus(id, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order updated successfully")
    },
    onError: () => {
      toast.error("Failed to update order")
    },
  })

  const filteredOrders =
    ordersData?.data.orders?.filter(
      (order: any) =>
        order._id.includes(searchTerm) || order.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Lists</h1>
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
          <Button className="gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
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
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  const firstItem = order.items?.[0]?.item
                  const coverImage = firstItem?.images?.[0] || firstItem?.image

                  return (
                    <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">#{order._id.slice(-6)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {coverImage && (
                            <div className="w-10 h-10 relative rounded-lg overflow-hidden">
                              <Image
                                src={coverImage || "/placeholder.svg"}
                                alt={firstItem?.name || "Order item"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{firstItem?.name}</p>
                            {order.items.length > 1 && (
                              <p className="text-xs text-gray-500">+{order.items.length - 1} more</p>
                            )}
                          </div>
                        </div>
                      </td>
                    <td className="px-4 py-3">{format(new Date(order.createdAt), "dd MMM, yyyy")}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.user.name}</p>
                        <p className="text-xs text-gray-500">{order.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">${order.totalAmount}</td>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="bg-[#5B9FED] hover:bg-[#4A8FDD] text-white">
                            {order.status}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: order._id,
                                status: "Pending",
                              })
                            }
                          >
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: order._id,
                                status: "Processing",
                              })
                            }
                          >
                            Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: order._id,
                                status: "Delivered",
                              })
                            }
                          >
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: order._id,
                                status: "Cancelled",
                              })
                            }
                          >
                            Cancelled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing 1 to {filteredOrders.length} from {ordersData?.data.total}
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
            {[...Array(Math.min(5, ordersData?.data.pages || 1))].map((_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={page === i + 1 ? "default" : "outline"}
                className={
                  page === i + 1 ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white" : "border-gray-200 text-gray-600"
                }
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(ordersData?.data.pages || 1, p + 1))}
              disabled={page === (ordersData?.data.pages || 1)}
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
            <DialogTitle>Order Details #{selectedOrder?._id.slice(-6)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Info</h4>
                  <p className="text-sm text-gray-600">Name: {selectedOrder.user?.name}</p>
                  <p className="text-sm text-gray-600">Email: {selectedOrder.user?.email}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.phone}</p>
                  <p className="text-sm text-gray-600">Address: {selectedOrder.address}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Info</h4>
                  <p className="text-sm text-gray-600">Date: {format(new Date(selectedOrder.createdAt), "PPP")}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium">{selectedOrder.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment: <span className="font-medium">{selectedOrder.paymentStatus}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-bold">${selectedOrder.totalAmount}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                    {selectedOrder.items.map((item: any) => (
                    <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 relative rounded-md overflow-hidden bg-white">
                        <Image
                          src={item.item.images?.[0] || item.item.image || "/placeholder.svg"}
                          alt={item.item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item.name}</p>
                        <p className="text-sm text-gray-500">
                          ${item.item.price} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">${(item.item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
