"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { productsAPI } from "@/lib/products-api"
import { categoriesAPI } from "@/lib/categories-api"
import type { Category, Product } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Image from "next/image"

const dayOptions = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
] as const

const allowedDayValues: readonly string[] = dayOptions.map((d) => d.value)

type SpecialMap = Record<string, string[]>

const arraysEqual = (a: string[] = [], b: string[] = []) => {
  const aSorted = [...a].sort()
  const bSorted = [...b].sort()
  return aSorted.length === bSorted.length && aSorted.every((v, i) => v === bSorted[i])
}

const getCategoryId = (item: Product) =>
  typeof item.category === "string" ? item.category : item.category?._id ?? ""

export default function SpecialItemsPage() {
  const [page] = useState(1)
  const [limit] = useState(200)
  const [selectedDay, setSelectedDay] = useState<string>("mon")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [search, setSearch] = useState("")

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["special-items", page, limit],
    queryFn: () => productsAPI.getProducts({ page, limit }),
    placeholderData: (prev) => prev,
  })

  const items: Product[] = useMemo(() => data?.data?.items ?? [], [data])

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesAPI.getCategories,
  })

  const categories: Category[] = useMemo(() => {
    if (!categoriesData) return []
    if (Array.isArray(categoriesData)) return categoriesData
    if (Array.isArray((categoriesData as any)?.data)) return (categoriesData as any).data
    if (Array.isArray((categoriesData as any)?.data?.items)) return (categoriesData as any).data.items
    if (Array.isArray((categoriesData as any)?.items)) return (categoriesData as any).items
    return []
  }, [categoriesData])

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => {
      map.set(category._id, category.name)
    })
    return map
  }, [categories])

  const getCategoryName = (item: Product) => {
    if (typeof item.category !== "string") return item.category?.name ?? "Uncategorized"
    return categoryNameById.get(item.category) ?? item.category
  }

  const [draftSpecialDays, setDraftSpecialDays] = useState<SpecialMap>({})
  const [originalSpecialDays, setOriginalSpecialDays] = useState<SpecialMap>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const map: SpecialMap = {}
    items.forEach((item: Product) => {
      const validDays = (item.specialDays ?? []).filter((day) => allowedDayValues.includes(day))
      map[item._id] = validDays
    })
    setDraftSpecialDays(map)
    setOriginalSpecialDays(map)
  }, [items])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items
      .filter((item) => (term ? item.name.toLowerCase().includes(term) : true))
      .filter((item) => (selectedCategory === "all" ? true : getCategoryId(item) === selectedCategory))
      .sort((a, b) => {
        const categoryCompare = getCategoryName(a).localeCompare(getCategoryName(b))
        if (categoryCompare !== 0) return categoryCompare
        return a.name.localeCompare(b.name)
      })
  }, [items, search, selectedCategory, categoryNameById])

  const categoryOptions = useMemo(() => {
    const optionMap = new Map<string, string>()
    categories.forEach((category) => {
      optionMap.set(category._id, category.name)
    })
    items.forEach((item) => {
      const categoryId = getCategoryId(item)
      if (!categoryId) return
      optionMap.set(categoryId, getCategoryName(item))
    })

    return [
      { value: "all", label: "All Categories" },
      ...Array.from(optionMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }, [categories, items, categoryNameById])

  const changedIds = useMemo(
    () =>
      items
        .map((item) => item._id)
        .filter((id) => !arraysEqual(originalSpecialDays[id], draftSpecialDays[id])),
    [items, originalSpecialDays, draftSpecialDays],
  )

  const toggleDay = (itemId: string, day: string) => {
    setDraftSpecialDays((prev) => {
      const existing = prev[itemId] ?? []
      const next = existing.includes(day) ? existing.filter((d) => d !== day) : [...existing, day]
      return { ...prev, [itemId]: next }
    })
  }

  const saveChanges = async () => {
    if (!changedIds.length) return
    setSaving(true)
    try {
      await Promise.all(
        changedIds.map(async (id) => {
          const formData = new FormData()
          formData.append("specialDays", JSON.stringify(draftSpecialDays[id] ?? []))
          await productsAPI.updateProduct(id, formData)
        }),
      )
      toast.success("Special items updated")
      setOriginalSpecialDays(draftSpecialDays)
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update special items")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Special Items</h1>
          <p className="text-sm text-gray-500">
            Assign items to specific days without hiding them from the main product list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Sort by category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Button
            disabled={!changedIds.length || saving}
            className="bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
            onClick={saveChanges}
          >
            {saving ? "Saving..." : changedIds.length ? `Save (${changedIds.length})` : "Save"}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((day) => {
            const active = day.value === selectedDay
            return (
              <Button
                key={day.value}
                size="sm"
                variant={active ? "default" : "outline"}
                className={
                  active ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white" : "border-gray-200 text-gray-700"
                }
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </Button>
            )
          })}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Special?</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Days</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const currentDays = draftSpecialDays[item._id] ?? []
                  const isSelected = currentDays.includes(selectedDay)
                  return (
                    <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 relative rounded-md overflow-hidden bg-gray-100">
                            <Image
                              src={item.images?.[0] || item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Price: ${Number(item.price ?? 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getCategoryName(item)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={
                            isSelected
                              ? "bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                              : "border-gray-200 text-gray-700"
                          }
                          onClick={() => toggleDay(item._id, selectedDay)}
                        >
                          {isSelected ? "Yes" : "No"}
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {dayOptions.map((day) => {
                            const active = currentDays.includes(day.value)
                            return (
                              <Button
                                key={day.value}
                                size="sm"
                                variant={active ? "default" : "outline"}
                                className={
                                  active
                                    ? "h-7 px-2 text-xs bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                                    : "h-7 px-2 text-xs border-gray-200 text-gray-700"
                                }
                                onClick={() => toggleDay(item._id, day.value)}
                              >
                                {day.label.slice(0, 3)}
                              </Button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">No items found.</div>
          )}
        </Card>
      )}
    </div>
  )
}
