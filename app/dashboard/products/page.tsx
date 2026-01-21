"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Filter, Edit2, Trash2, Eye } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { productsAPI } from "@/lib/products-api"
import { ProductDialog } from "@/components/products/product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [productDialog, setProductDialog] = useState<{
    open: boolean
    mode: "add" | "edit" | "view"
    product: Product | null
  }>({
    open: false,
    mode: "add",
    product: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    product: Product | null
  }>({
    open: false,
    product: null,
  })

  const {
    data: productsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["products", page],
    queryFn: () => productsAPI.getProducts(page, 10),
  })

  const handleAddProduct = () => {
    setProductDialog({ open: true, mode: "add", product: null })
  }

  const handleEditProduct = (product: Product) => {
    setProductDialog({ open: true, mode: "edit", product })
  }

  const handleViewProduct = (product: Product) => {
    setProductDialog({ open: true, mode: "view", product })
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteDialog({ open: true, product })
  }

  const products = productsData?.data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Product Lists</h1>
        <Button
          onClick={handleAddProduct}
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
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

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
                products
                  .filter((product: Product) =>
                    searchQuery
                      ? product.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      : true,
                  )
                  .map((product: Product) => (
                    <tr
                      key={product._id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={product.images?.[0] || product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>

                      {/* 👇 FIXED: category is an object, render its name */}
                      <td className="px-4 py-3">
                        {typeof product.category === "string"
                          ? product.category
                          : product.category?.name ?? "N/A"}
                      </td>

                      <td className="px-4 py-3">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => handleDeleteProduct(product)}
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
      </Card>

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
  )
}
