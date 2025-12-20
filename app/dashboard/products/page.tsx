"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { productsAPI, type ProductQueryParams } from "@/lib/products-api"
import { ProductDialog } from "@/components/products/product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import type { Product, ProductCategory } from "@/lib/types"

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function getCategoryId(cat: ProductCategory): string {
  return typeof cat === "string" ? cat : cat?._id
}

function getCategoryName(cat: ProductCategory): string {
  return typeof cat === "string" ? cat : cat?.name ?? "N/A"
}

export default function ProductsPage() {
  const limit = 10

  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 400)

  const [categoryId, setCategoryId] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sort, setSort] = useState("-createdAt")

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
    const p: ProductQueryParams = { page, limit, sort }

    const s = debouncedSearch.trim()
    if (s) p.search = s

    if (categoryId) p.category = categoryId

    const min = minPrice.trim()
    const max = maxPrice.trim()
    if (min !== "" && !Number.isNaN(Number(min))) p.minPrice = Number(min)
    if (max !== "" && !Number.isNaN(Number(max))) p.maxPrice = Number(max)

    return p
  }, [page, limit, sort, debouncedSearch, categoryId, minPrice, maxPrice])

  // reset page on filter changes
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryId, minPrice, maxPrice, sort])

  const { data: productsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsAPI.getProducts(params),
    placeholderData: (prev) => prev, // ✅ TanStack Query v5
  })

  const products = productsData?.data.items ?? []
  const total = productsData?.data.total ?? 0
  const pages = productsData?.data.pages ?? 1

  // category options from current page
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      const id = getCategoryId(p.category)
      const name = getCategoryName(p.category)
      if (id && name) map.set(id, name)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  const activeFiltersCount =
    (debouncedSearch.trim() ? 1 : 0) +
    (categoryId ? 1 : 0) +
    (minPrice.trim() ? 1 : 0) +
    (maxPrice.trim() ? 1 : 0) +
    (sort !== "-createdAt" ? 1 : 0)

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryId("")
    setMinPrice("")
    setMaxPrice("")
    setSort("-createdAt")
    setPage(1)
    setFiltersOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Product Lists</h1>

        <Button
          onClick={() => setProductDialog({ open: true, mode: "add", product: null })}
          className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products (name/description/ingredients)..."
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
                      { label: "Price: Low → High", value: "price" },
                      { label: "Price: High → Low", value: "-price" },
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

                {/* Category */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Category</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" name="category" checked={!categoryId} onChange={() => setCategoryId("")} />
                      All
                    </label>

                    <div className="max-h-40 overflow-auto space-y-2 pr-1">
                      {categoryOptions.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="category"
                            checked={categoryId === c.id}
                            onChange={() => setCategoryId(c.id)}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Price range</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Min</p>
                      <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Max</p>
                      <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="100" />
                    </div>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">{getCategoryName(product.category)}</td>

                    <td className="px-4 py-3">${Number(product.price ?? 0).toFixed(2)}</td>

                    <td className="px-4 py-3">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 bg-transparent"
                          onClick={() => setProductDialog({ open: true, mode: "view", product })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 bg-transparent"
                          onClick={() => setProductDialog({ open: true, mode: "edit", product })}
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
                  className={page === p ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white" : "border-gray-200 text-gray-600"}
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

      <ProductDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog((prev) => ({ ...prev, open }))}
        product={productDialog.product}
        mode={productDialog.mode}
        onSuccess={refetch}
      />

      <DeleteProductDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        product={deleteDialog.product}
        onSuccess={refetch}
      />
    </div>
  )
}
