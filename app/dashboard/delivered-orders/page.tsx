"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordersAPI } from "@/lib/orders-api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Image from "next/image"

export default function DeliveredOrdersPage() {
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "delivered", page],
    queryFn: () => ordersAPI.getOrders(page, 10, "Delivered"),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast.success("Order status updated successfully")
    },
    onError: () => {
      toast.error("Failed to update order status")
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-600 bg-green-50"
      case "Processing":
        return "text-blue-600 bg-blue-50"
      case "Pending":
        return "text-yellow-600 bg-yellow-50"
      case "Cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading orders...</div>
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
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search category..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.orders?.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="font-medium text-gray-900">#{order._id.slice(-6)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={order.items[0]?.item.images?.[0] || order.items[0]?.item.image || "/placeholder.svg"}
                          alt={order.items[0]?.item.name || "Order item"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.items[0]?.item.name}</p>
                        {order.items.length > 1 && (
                          <p className="text-xs text-gray-500">+ {order.items.length - 1} other items</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{format(new Date(order.createdAt), "dd MMM, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{order.user?.name}</p>
                      <p className="text-xs text-gray-500">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">${order.totalAmount}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className={`${
                            order.paymentStatus === "Paid"
                              ? "bg-[#83DA71] hover:bg-[#83DA71] text-white"
                              : "bg-orange-300 hover:bg-orange-400 text-white"
                          }`}
                        >
                          {order.paymentStatus === "Paid" ? "Done" : "Hold"}
                          <ChevronLeft className="w-4 h-4 rotate-270 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: order._id,
                              status: "Delivered",
                            })
                          }
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: order._id,
                              status: "Pending",
                            })
                          }
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-4 py-3">
                    <Button className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white">Delivered</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
          <p>
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data?.data?.total || 0)} from {data?.data?.total}
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
            {[1, 2, 3].map((p) => (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                className={page === p ? "bg-[#5B9FED] hover:bg-[#4A8FDD]" : "border-gray-200 text-gray-600"}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <span className="flex items-center text-[#5B9FED]">...</span>
            <Button variant="outline" onClick={() => setPage(17)} className="border-gray-200 text-gray-600">
              17
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.data?.pages || page >= data.data.pages}
              className="bg-[#DCEBFB] text-[#5B9FED] border-none hover:bg-[#C8E1FA]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
