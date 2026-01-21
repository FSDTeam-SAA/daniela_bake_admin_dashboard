import apiClient from "./api"

export type DashboardOverviewAPIResponse = {
  stats: {
    totalCustomers: number
    totalDelivered: number
    totalRevenue: number
    totalOrders: number
  }
  charts: {
    weeklyPerformance: Array<{
      name: string
      orders: number
      revenue: number
    }>
  }
  recentOrders: Array<{
    id: string
    orderId: string
    customer: string
    amount: number
    status: string
    createdAt: string
  }>
}

export const dashbordOverviewAPI = {
  getDashboardOverview: async (): Promise<DashboardOverviewAPIResponse> => {
    const response = await apiClient.get("/dashboard/overview")
    return response.data.data
  },
}
