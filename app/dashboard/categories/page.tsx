"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Filter, Edit2, Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { categoriesAPI } from "@/lib/categories-api"
import { CategoryDialog } from "@/components/categories/category-dialog"
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog"
import type { Category } from "@/lib/types"

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean
    mode: "add" | "edit"
    category: Category | null
  }>({
    open: false,
    mode: "add",
    category: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    category: Category | null
  }>({
    open: false,
    category: null,
  })

  const {
    data: categoriesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesAPI.getCategories,
  })

  // 🔧 Normalize API response into a plain Category[]
  const categories: Category[] = Array.isArray(categoriesData)
    ? categoriesData
    : Array.isArray((categoriesData as any)?.data)
    ? (categoriesData as any).data
    : Array.isArray((categoriesData as any)?.data?.items)
    ? (categoriesData as any).data.items
    : Array.isArray((categoriesData as any)?.items)
    ? (categoriesData as any).items
    : []

  const handleAddCategory = () => {
    setCategoryDialog({ open: true, mode: "add", category: null })
  }

  const handleEditCategory = (category: Category) => {
    setCategoryDialog({ open: true, mode: "edit", category })
  }

  const handleDeleteCategory = (category: Category) => {
    setDeleteDialog({ open: true, category })
  }

  // apply search
  const filteredCategories = categories.filter((category) =>
    searchQuery ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Category Lists</h1>
        <Button
          onClick={handleAddCategory}
          className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search category..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#7B3F00] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Photo</th>
                <th className="px-4 py-3 text-left font-bold">Category</th>
                <th className="px-4 py-3 text-left font-bold">Added</th>
                <th className="px-4 py-3 text-left font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      <Skeleton className="w-12 h-12 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category._id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {category.image ? (
                        <img
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-2xl">
                          📁
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 bg-transparent"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => handleDeleteCategory(category)}
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

      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}
        category={categoryDialog.category}
        mode={categoryDialog.mode}
        onSuccess={refetch}
      />

      <DeleteCategoryDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        category={deleteDialog.category}
        onSuccess={refetch}
      />
    </div>
  )
}
