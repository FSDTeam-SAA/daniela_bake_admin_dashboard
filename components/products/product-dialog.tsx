"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productsAPI } from "@/lib/products-api";
import { categoriesAPI } from "@/lib/categories-api";
import type { Product, Category } from "@/lib/types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode: "add" | "edit" | "view";
  onSuccess?: () => void;
}

interface Ingredient {
  name: string;
  image?: File | string;
  preview?: string;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  mode,
  onSuccess,
}: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "", // will hold category _id
    description: "",
    price: "",
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", image: undefined, preview: "" },
  ]);

  const isViewMode = mode === "view";
  const title =
    mode === "add"
      ? "Add Product"
      : mode === "edit"
      ? "Edit Product"
      : "Product Details";

  useEffect(() => {
    if (!open) return;

    // load categories every time dialog opens
    loadCategories();

    if (product && (mode === "edit" || mode === "view")) {
      setFormData({
        name: product.name,
        // product.category might be a string or an object
        category:
          typeof product.category === "string"
            ? product.category
            : product.category?._id ?? "",
        description: product.description || "",
        price: product.price.toString(),
      });
      setProductImagePreview(product.image || "");

      if (product.ingredients && product.ingredients.length > 0) {
        setIngredients(
          product.ingredients.map((ing) => ({
            name: ing.name,
            image: ing.image,
            preview: ing.image,
          }))
        );
      } else {
        setIngredients([{ name: "", image: undefined, preview: "" }]);
      }
    } else {
      resetForm();
    }
  }, [open, product, mode]);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getCategories();

      // Try to safely derive an array from whatever the API returns
      const cats: Category[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any).data)
        ? (res as any).data
        : Array.isArray((res as any).data?.items)
        ? (res as any).data.items
        : Array.isArray((res as any).items)
        ? (res as any).items
        : [];

      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
      setCategories([]); // keep it an array to avoid .map crash
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "", description: "", price: "" });
    setProductImage(null);
    setProductImagePreview("");
    setIngredients([{ name: "", image: undefined, preview: "" }]);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProductImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newIngredients = [...ingredients];
        newIngredients[index].image = file;
        newIngredients[index].preview = reader.result as string;
        setIngredients(newIngredients);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", image: undefined, preview: "" },
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredientName = (index: number, name: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index].name = name;
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.name || !formData.category || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category); // categoryId
      data.append("description", formData.description);
      data.append("price", formData.price);

      // ✅ only one file field: "image"
      if (productImage) {
        data.append("image", productImage);
      }

      // ✅ ingredients as JSON string, like in Postman
      const ingredientsPayload = ingredients
        .filter((ing) => ing.name.trim() !== "")
        .map((ing) => ({
          name: ing.name,
          // if editing and existing image is a URL/string, you can keep it:
          ...(typeof ing.image === "string" ? { image: ing.image } : {}),
        }));

      data.append("ingredients", JSON.stringify(ingredientsPayload));

      if (mode === "add") {
        await productsAPI.createProduct(data);
        toast.success("Product added successfully");
      } else {
        await productsAPI.updateProduct(product!._id, data);
        toast.success("Product updated successfully");
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
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
            Overview <span className="mx-2">›</span> Product{" "}
            <span className="mx-2">›</span>{" "}
            {mode === "add" ? "Add Product" : product?.name}
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Product Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No categories found
                    </div>
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media</h3>
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {productImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={productImagePreview || "/placeholder.svg"}
                      alt="Product preview"
                      className="mx-auto max-h-48 rounded-lg object-cover"
                    />
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductImage(null);
                          setProductImagePreview("");
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Drag and drop image here, or click add image
                    </p>
                    {!isViewMode && (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                        asChild
                      >
                        <label
                          htmlFor="product-image"
                          className="cursor-pointer"
                        >
                          Add Image
                          <input
                            id="product-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProductImageChange}
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
              <div
                key={index}
                className="space-y-4 p-4 border border-gray-200 rounded-lg"
              >
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
                    onChange={(e) =>
                      updateIngredientName(index, e.target.value)
                    }
                    disabled={isViewMode}
                  />
                </div>
              </div>
            ))}

            {!isViewMode && (
              <Button
                type="button"
                onClick={addIngredient}
                className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More Ingredient
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
