"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usersAPI, type UsersQueryParams } from "@/lib/users-api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

import {
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

type AnyUser = any

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CustomersPage() {
  const limit = 10

  const [page, setPage] = useState(1)

  // ✅ search (backend)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 400)

  // ✅ filters dropdown (same UX as ProductsPage)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sort, setSort] = useState<string>("-createdAt") // backend supports sort

  // dialogs
  const [selectedCustomer, setSelectedCustomer] = useState<AnyUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AnyUser | null>(null)

  const queryClient = useQueryClient()

  // ✅ backend params
  const params: UsersQueryParams = useMemo(() => {
    const p: UsersQueryParams = { page, limit, sort }
    const s = debouncedSearch.trim()
    if (s) {
      // backend supports name/email query params
      // we'll apply same string to both for simple "search"
      p.name = s
      p.email = s
    }
    return p
  }, [page, limit, sort, debouncedSearch])

  // ✅ reset page on filter/search change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sort])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", params],
    queryFn: () => usersAPI.getUsers(params),
    placeholderData: (prev) => prev, // ✅ v5 keep previous
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully")
      setUserToDelete(null)
      if (selectedCustomer?._id && selectedCustomer._id === userToDelete?._id) {
        setSelectedCustomer(null)
      }
    },
    onError: () => toast.error("Failed to delete user"),
  })

  const users = Array.isArray(data?.data?.users) ? data!.data.users : []
  const total = data?.data?.total ?? 0
  const pages = data?.data?.pages ?? 1

  const getTotalSpent = (user: AnyUser) =>
    (user?.orders || []).reduce((sum: number, o: any) => sum + (Number(o?.totalAmount) || 0), 0)

  const activeFiltersCount = (debouncedSearch.trim() ? 1 : 0) + (sort !== "-createdAt" ? 1 : 0)

  const clearFilters = () => {
    setSearchQuery("")
    setSort("-createdAt")
    setFiltersOpen(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customer Lists</h1>
      </div>

      <Card className="p-6">
        {/* Search + Filters (ProductsPage style) */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search customers (name/email)..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      { label: "Name: A → Z", value: "name" },
                      { label: "Name: Z → A", value: "-name" },
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
                  <th className="px-4 py-3 text-left font-bold">Customer Name</th>
                  <th className="px-4 py-3 text-left font-bold">Phone</th>
                  <th className="px-4 py-3 text-left font-bold">Total Order</th>
                  <th className="px-4 py-3 text-left font-bold">Order Amount</th>
                  <th className="px-4 py-3 text-left font-bold">Joined</th>
                  <th className="px-4 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user: AnyUser) => (
                  <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded border-gray-300" />

                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                          {user?.avatar ? (
                            <Image src={user.avatar} alt={user?.name ?? "User"} fill className="object-cover" />
                          ) : (
                            (user?.name?.charAt(0)?.toUpperCase() ?? "U")
                          )}
                        </div>

                        <div>
                          <p className="font-medium">{user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-500">{user?.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">{user?.phone || "N/A"}</td>

                    <td className="px-4 py-3">{(user?.orders?.length ?? 0)} times</td>

                    <td className="px-4 py-3 font-semibold">${getTotalSpent(user).toFixed(2)}</td>

                    <td className="px-4 py-3">
                      {user?.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedCustomer(user)}>
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-red-50"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} from {total}
            {isFetching && !isLoading ? <span className="ml-2 text-xs text-gray-400">(Updating...)</span> : null}
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

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold">Customer Details</DialogTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-sm" onClick={() => setSelectedCustomer(null)}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>
              </DialogHeader>

              <div className="bg-gray-50 rounded-xl p-5 flex items-center gap-4 mb-6 border border-gray-200">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center text-2xl font-semibold text-blue-600 shrink-0">
                  {selectedCustomer?.avatar ? (
                    <Image src={selectedCustomer.avatar} alt={selectedCustomer?.name ?? "User"} fill className="object-cover" />
                  ) : (
                    (selectedCustomer?.name?.charAt(0)?.toUpperCase() ?? "U")
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">{selectedCustomer?.name ?? "Unknown"}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer?.email ?? "—"}</p>
                  <p className="text-xs text-gray-500">
                    Joined{" "}
                    {selectedCustomer?.createdAt ? format(new Date(selectedCustomer.createdAt), "MMM dd, yyyy") : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Total Orders</p>
                  <p className="font-semibold text-sm">{selectedCustomer?.orders?.length ?? 0}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="font-semibold text-sm">${getTotalSpent(selectedCustomer).toFixed(2)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-semibold text-sm">{selectedCustomer?.phone || "N/A"}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Last Active</p>
                  <p className="font-semibold text-sm">
                    {selectedCustomer?.lastLogin ? format(new Date(selectedCustomer.lastLogin), "MMM dd, yyyy") : "--"}
                  </p>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#7B3F00] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Order Number</th>
                        <th className="px-3 py-2 text-left text-xs">Item name</th>
                        <th className="px-3 py-2 text-left text-xs">Total Numbers</th>
                        <th className="px-3 py-2 text-left text-xs">Order Amount</th>
                        <th className="px-3 py-2 text-left text-xs">Payment Status</th>
                        <th className="px-3 py-2 text-left text-xs">Purchase Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedCustomer?.orders ?? []).map((order: any, index: number) => (
                        <tr key={order._id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2">{order.items?.[0]?.item?.name || "N/A"}</td>
                          <td className="px-3 py-2">
                            {(order.items ?? []).reduce(
                              (sum: number, i: any) => sum + (Number(i.quantity) || 0),
                              0,
                            )}{" "}
                            times
                          </td>
                          <td className="px-3 py-2 font-semibold">${Number(order.totalAmount ?? 0)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                order.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.paymentStatus ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "—"}
                          </td>
                        </tr>
                      ))}

                      {(!selectedCustomer?.orders || selectedCustomer.orders.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                            No orders found for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userToDelete?.name ?? "this user"}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUserToDelete(null)}>
                No
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete._id)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
