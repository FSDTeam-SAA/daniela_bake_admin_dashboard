// components/ProductDialog.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { productsAPI } from "@/lib/products-api"
import { categoriesAPI } from "@/lib/categories-api"
import type { Product, Category } from "@/lib/types"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  mode: "add" | "edit" | "view"
  onSuccess?: () => void
}

interface Ingredient {
  name: string
  image?: File | string
  preview?: string
}

interface ProductImage {
  id: string
  file?: File
  preview: string
  isNew: boolean
}

const MAX_IMAGES = 5

const dayOptions = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
] as const

export function ProductDialog({ open, onOpenChange, product, mode, onSuccess }: ProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
  })
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", image: undefined, preview: "" },
  ])
  const [availableDays, setAvailableDays] = useState<string[]>([])

  const isViewMode = mode === "view"
  const title = mode === "add" ? "Add Product" : mode === "edit" ? "Edit Product" : "Product Details"

  useEffect(() => {
    if (!open) return

    loadCategories()

    if (product && (mode === "edit" || mode === "view")) {
      setFormData({
        name: product.name,
        category: typeof product.category === "string" ? product.category : product.category?._id ?? "",
        description: product.description || "",
        price: String(product.price ?? ""),
      })

      const incomingImages =
        (Array.isArray((product as any).images) && (product as any).images.length
          ? (product as any).images
          : product.image
          ? [product.image]
          : []
        ).slice(0, MAX_IMAGES)

      setGalleryImages(
        incomingImages.map((img, index) => ({
          id: `${product._id ?? "existing"}-${index}`,
          preview: img,
          isNew: false,
        })),
      )

      if (product.ingredients && product.ingredients.length > 0) {
        setIngredients(
          product.ingredients.map((ing) => ({
            name: ing.name,
            image: ing.image,
            preview: ing.image,
          })),
        )
      } else {
        setIngredients([{ name: "", image: undefined, preview: "" }])
      }

      const productDays =
        product.availableDays && product.availableDays.length > 0
          ? product.availableDays.map((d: string) => d.toLowerCase())
          : []
      setAvailableDays(productDays)
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, mode])

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getCategories()

      const cats: Category[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any).data)
          ? (res as any).data
          : Array.isArray((res as any).data?.items)
            ? (res as any).data.items
            : Array.isArray((res as any).items)
              ? (res as any).items
              : []

      setCategories(cats)
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast.error("Failed to load categories")
      setCategories([])
    }
  }

  const resetForm = () => {
    setFormData({ name: "", category: "", description: "", price: "" })
    setGalleryImages([])
    setIngredients([{ name: "", image: undefined, preview: "" }])
    setAvailableDays([])
  }

  const generateImageId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const handleAddProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const availableSlots = MAX_IMAGES - galleryImages.length
    if (availableSlots <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`)
      e.target.value = ""
      return
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots)

    selectedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryImages((prev) => [
          ...prev,
          { id: generateImageId(), file, preview: reader.result as string, isNew: true },
        ])
      }
      reader.readAsDataURL(file)
    })

    if (files.length > availableSlots) {
      toast.error(
        `Only ${availableSlots} more image${availableSlots === 1 ? "" : "s"} can be added (max ${MAX_IMAGES}).`,
      )
    }

    e.target.value = ""
  }

  const handleRemoveImage = (id: string) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleIngredientImageChange = (index: number, file?: File) => {
    if (!file) return
    const next = [...ingredients]
    next[index].image = file

    const reader = new FileReader()
    reader.onloadend = () => {
      next[index].preview = reader.result as string
      setIngredients(next)
    }
    reader.readAsDataURL(file)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", image: undefined, preview: "" }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredientName = (index: number, name: string) => {
    const next = [...ingredients]
    next[index].name = name
    setIngredients(next)
  }

  const toggleDay = (dayValue: string) => {
    setAvailableDays((prev) => (prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewMode) return

    if (!formData.name || !formData.category || !formData.price) {
      toast.error("Please fill in all required fields")
      return
    }
    if (availableDays.length === 0) {
      toast.error("Select at least one available day")
      return
    }
    if (galleryImages.length === 0) {
      toast.error("Please add at least one product image (up to 5)")
      return
    }

    const existingImages = galleryImages.filter((img) => !img.isNew).map((img) => img.preview)
    const newImages = galleryImages.filter((img) => img.isNew && img.file)

    setLoading(true)
    try {
      const data = new FormData()
      data.append("name", formData.name)
      data.append("category", formData.category)
      data.append("description", formData.description)
      data.append("price", formData.price)
      data.append("existingImages", JSON.stringify(existingImages))
      data.append("availableDays", JSON.stringify(availableDays))

      newImages.forEach((img) => {
        if (img.file) data.append("images", img.file)
      })

      const cleanedIngredients = ingredients
        .filter((ing) => ing.name.trim() !== "")
        .map((ing) => ({
          name: ing.name,
          ...(typeof ing.image === "string" ? { image: ing.image } : {}),
        }))

      data.append("ingredients", JSON.stringify(cleanedIngredients))

      // append ingredient files in ingredient order (skips ones without file)
      ingredients
        .filter((ing) => ing.name.trim() !== "")
        .forEach((ing) => {
          if (ing.image instanceof File) {
            data.append("ingredientImage", ing.image)
          }
        })

      if (mode === "add") {
        await productsAPI.createProduct(data)
        toast.success("Product added successfully")
      } else {
        await productsAPI.updateProduct(product!._id, data)
        toast.success("Product updated successfully")
      }

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            <div className="flex gap-2">
              {!isViewMode && (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                >
                  {loading ? "Saving..." : "Save Product"}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {isViewMode ? "Close" : "Cancel"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Overview &gt; Product &gt; {mode === "add" ? "Add Product" : product?.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">General Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Type product name here..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Product Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Type description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isViewMode}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Product Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Type price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isViewMode}
              />
            </div>

            {/* Available Days */}
            <div className="space-y-3">
              <Label>Available Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {dayOptions.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`day-${day.value}`}
                      checked={availableDays.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded border-gray-300 text-[#5B9FED] focus:ring-[#5B9FED] cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-medium leading-none cursor-pointer select-none"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
              {availableDays.length === 0 && !isViewMode && (
                <p className="text-sm text-red-600 mt-1">Please select at least one day</p>
              )}
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media</h3>
            <div className="space-y-2">
              <Label>Photos (up to 5, first is the cover)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {galleryImages.length ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages.map((image, idx) => (
                        <div key={image.id} className="relative group rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={image.preview || "/placeholder.svg"}
                            alt={`Product image ${idx + 1}`}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded-full">
                            {idx === 0 ? "Cover" : `Image ${idx + 1}`}
                          </div>
                          {!isViewMode && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                              onClick={() => handleRemoveImage(image.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isViewMode && galleryImages.length < MAX_IMAGES && (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          size="sm"
                          className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                          asChild
                        >
                          <label htmlFor="product-images" className="cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Add Image
                            <input
                              id="product-images"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleAddProductImages}
                            />
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">Add up to five images. The first becomes the cover.</p>
                    {!isViewMode && (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                        asChild
                      >
                        <label htmlFor="product-images" className="cursor-pointer">
                          Add Images
                          <input
                            id="product-images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleAddProductImages}
                          />
                        </label>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Ingredient</h3>

            {ingredients.map((ingredient, index) => (
              <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Ingredient {index + 1}</Label>
                  {!isViewMode && ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Name of ingredient</Label>
                  <Input
                    placeholder="Onion"
                    value={ingredient.name}
                    onChange={(e) => updateIngredientName(index, e.target.value)}
                    disabled={isViewMode}
                  />
                </div>

                {/* Ingredient image */}
                <div className="space-y-2">
                  <Label>Ingredient Image</Label>

                  {ingredient.preview ? (
                    <div className="space-y-2">
                      <img src={ingredient.preview} alt="Ingredient preview" className="max-h-32 rounded-lg object-cover" />
                      {!isViewMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const next = [...ingredients]
                            next[index].image = undefined
                            next[index].preview = ""
                            setIngredients(next)
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : (
                    !isViewMode && (
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          Add Ingredient Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleIngredientImageChange(index, e.target.files?.[0])}
                          />
                        </label>
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}

            {!isViewMode && (
              <Button
                type="button"
                onClick={addIngredient}
                className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
              >
                <Plus className="w-4 h-4" />
                Add More Ingredient
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
