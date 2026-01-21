"use client"

import { useQuery } from "@tanstack/react-query"
import { dashbordOverviewAPI } from "@/lib/dashbord-overview"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { ShoppingCart, Coffee, TrendingUp, Wallet } from "lucide-react"

export function DashboardOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => dashbordOverviewAPI.getDashboardOverview(),
  })

  const statsData = data?.stats
  const weekly = data?.charts?.weeklyPerformance ?? []
  const recentOrders = data?.recentOrders ?? []

  const stats = [
    {
      icon: ShoppingCart,
      label: "Total Customers",
      value: statsData?.totalCustomers ?? 0,
    },
    {
      icon: Coffee,
      label: "Total Delivered",
      value: statsData?.totalDelivered ?? 0,
    },
    {
      icon: Wallet,
      label: "Total Revenue",
      value: `$${Number(statsData?.totalRevenue ?? 0).toFixed(2)}`,
    },
    {
      icon: TrendingUp,
      label: "Total Orders",
      value: statsData?.totalOrders ?? 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="w-10 h-10 text-blue-100" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Weekly Orders</h3>
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Weekly Revenue</h3>
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Orders</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.orderId}</td>
                    <td className="px-4 py-3">{o.customer ?? "Unknown"}</td>
                    <td className="px-4 py-3">${Number(o.amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          o.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : o.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : o.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {o.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}

                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
