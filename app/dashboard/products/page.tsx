"use client"

import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { productsAPI, type ProductQueryParams } from "@/lib/products-api"
import { categoriesAPI } from "@/lib/categories-api"
import { ProductDialog } from "@/components/products/product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import type { Product, Category } from "@/lib/types"
import Image from "next/image"

const dayOptions = [
  { value: "all", label: "All days" },
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
] as const

function getCategoryName(cat: Product["category"]): string {
  return typeof cat === "string" ? cat : cat?.name ?? "N/A"
}

export default function ProductsPage() {
  const limit = 10
  const [page, setPage] = useState(1)
  const [dayFilter, setDayFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categorySearch, setCategorySearch] = useState<string>("")

  const [productDialog, setProductDialog] = useState<{
    open: boolean
    mode: "add" | "edit" | "view"
    product: Product | null
  }>({ open: false, mode: "add", product: null })

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    product: Product | null
  }>({ open: false, product: null })

  const params: ProductQueryParams = useMemo(() => {
    const next: ProductQueryParams = { page, limit, day: dayFilter }
    if (categoryFilter !== "all") {
      next.category = categoryFilter
    }
    return next
  }, [page, limit, dayFilter, categoryFilter])

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesAPI.getCategories,
  })

  const normalizedCategories: Category[] = useMemo(() => {
    if (!categoriesData) return []
    if (Array.isArray(categoriesData)) return categoriesData
    if (Array.isArray((categoriesData as any)?.data)) return (categoriesData as any).data
    if (Array.isArray((categoriesData as any)?.data?.items)) return (categoriesData as any).data.items
    if (Array.isArray((categoriesData as any)?.items)) return (categoriesData as any).items
    return []
  }, [categoriesData])

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return normalizedCategories
    const keyword = categorySearch.toLowerCase()
    return normalizedCategories.filter((cat) => cat.name.toLowerCase().includes(keyword))
  }, [normalizedCategories, categorySearch])

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...filteredCategories.map((cat) => ({ value: cat._id, label: cat.name })),
    ],
    [filteredCategories],
  )

  useEffect(() => {
    setPage(1)
  }, [dayFilter, categoryFilter])

  const { data: productsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsAPI.getProducts(params),
    placeholderData: keepPreviousData,
  })

  const products = productsData?.data.items ?? []
  const total = productsData?.data.total ?? 0
  const pages = productsData?.data.pages ?? 1

  const selectedDayLabel =
    dayOptions.find((d) => d.value === dayFilter)?.label ?? "All days"
  const selectedCategoryLabel =
    categoryOptions.find((c) => c.value === categoryFilter)?.label ?? "All categories"

  const visibleCount = 5
  const start = Math.max(1, Math.min(page - 2, pages - visibleCount + 1))
  const visiblePages = Array.from(
    { length: Math.min(visibleCount, pages) },
    (_, i) => start + i
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Fixed Filters Sidebar */}
      <Card className="p-5 h-fit space-y-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Weekly view</p>
            <h3 className="text-lg font-semibold">Filter by day</h3>
            <p className="text-xs text-gray-500">
              Tap a day to see only items available then.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {dayOptions.map((opt) => {
              const active = opt.value === dayFilter
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className={
                    active
                      ? "justify-between bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                      : "justify-between border-gray-200 text-gray-700"
                  }
                  onClick={() => setDayFilter(opt.value)}
                >
                  <span>{opt.label}</span>
                  {active && (
                    <span className="text-xs text-white/80">Selected</span>
                  )}
                </Button>
              )
            })}
          </div>

          {dayFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5B9FED] hover:bg-[#DCEBFB]"
              onClick={() => setDayFilter("all")}
            >
              Clear day filter
            </Button>
          )}
        </div>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Lists</h1>
            <p className="text-sm text-gray-600">
              Showing: <span className="font-semibold">{selectedDayLabel}</span> /{" "}
              <span className="font-semibold">{selectedCategoryLabel}</span>
            </p>
          </div>

          <Button
            onClick={() =>
              setProductDialog({ open: true, mode: "add", product: null })
            }
            className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Category filters at top */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <h3 className="text-lg font-semibold">Filter by category</h3>
            </div>
            <Badge variant="secondary" className="bg-[#DCEBFB] text-[#2D6CB8]">
              {normalizedCategories.length || 0} total
            </Badge>
          </div>

          

          <div className="flex flex-wrap gap-2">
            {isLoadingCategories ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))
            ) : categoryOptions.length === 0 ? (
              <p className="text-xs text-gray-500">No categories found.</p>
            ) : (
              categoryOptions.map((opt) => {
                const active = opt.value === categoryFilter
                return (
                  <Button
                    key={opt.value}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={
                      active
                        ? "bg-[#7B3F00] hover:bg-[#6A3500] text-white"
                        : "border-gray-200 text-gray-700"
                    }
                    onClick={() => setCategoryFilter(opt.value)}
                  >
                    {opt.label}
                  </Button>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-6">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#7B3F00] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Product</th>
                  <th className="px-4 py-3 text-left font-bold">Category</th>
                  <th className="px-4 py-3 text-left font-bold">Price</th>
                  <th className="px-4 py-3 text-left font-bold">Added</th>
                  <th className="px-4 py-3 text-left font-bold">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            width={500}
                            height={500}
                            className="w-8 h-8"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {getCategoryName(product.category)}
                      </td>

                      <td className="px-4 py-3">
                        ${Number(product.price ?? 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() =>
                              setProductDialog({ open: true, mode: "view", product })
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() =>
                              setProductDialog({ open: true, mode: "edit", product })
                            }
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => setDeleteDialog({ open: true, product })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              {total === 0 ? (
                <>Showing 0 to 0 from 0</>
              ) : (
                <>
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} from {total}
                </>
              )}
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

              {visiblePages.map((p) => (
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
              ))}

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

        {/* Dialogs */}
        <ProductDialog
          open={productDialog.open}
          onOpenChange={(open) =>
            setProductDialog((prev) => ({ ...prev, open }))
          }
          product={productDialog.product}
          mode={productDialog.mode}
          onSuccess={refetch}
        />

        <DeleteProductDialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog((prev) => ({ ...prev, open }))
          }
          product={deleteDialog.product}
          onSuccess={refetch}
        />
      </div>
    </div>
  )
}
