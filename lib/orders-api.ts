import apiClient from "./api"
import type { Order, OrdersPaginatedResponse } from "./types"

export type OrderQueryParams = {
  page?: number
  limit?: number
  sort?: string
  status?: Order["status"]
  paymentStatus?: Order["paymentStatus"]
  user?: string
  timeRange?: "day" | "week" | "month" | "year" | "all"
}

export const ordersAPI = {
  getOrders: async (params: OrderQueryParams): Promise<OrdersPaginatedResponse> => {
    const response = await apiClient.get<OrdersPaginatedResponse>("/orders", { params })
    return response.data
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<{ success: boolean; message: string; data: Order }>(`/orders/${id}`)
    return response.data.data
  },

  updateOrderStatus: async (id: string, data: { status?: Order["status"]; paymentStatus?: Order["paymentStatus"] }) => {
    const response = await apiClient.put(`/orders/${id}`, data)
    return response.data
  },

  deleteOrder: async (id: string) => {
    const response = await apiClient.delete(`/orders/${id}`)
    return response.data
  },
}
