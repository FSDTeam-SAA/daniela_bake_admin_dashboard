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
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { categoriesAPI } from "@/lib/categories-api";
import type { Category } from "@/lib/types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  mode: "add" | "edit";
  onSuccess?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  mode,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [bgColor, setBgColor] = useState<string>("#ffffff"); // ✅ background color

  useEffect(() => {
    if (open) {
      if (category && mode === "edit") {
        setName(category.name);
        setOrder(
          typeof category.order === "number" ? category.order.toString() : ""
        );
        setImagePreview(category.image || "");
        setBgColor((category as any).bgColor || "#ffffff");
      } else {
        resetForm();
      }
    }
  }, [open, category, mode]);

  const resetForm = () => {
    setName("");
    setOrder("");
    setImage(null);
    setImagePreview("");
    setBgColor("#ffffff");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Please enter a category name");
      return;
    }

    if (!bgColor) {
      toast.error("Please choose a background color");
      return;
    }

    if (order) {
      const parsedOrder = Number.parseInt(order, 10);
      if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
        toast.error("Order must be a positive number");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (order) {
        formData.append("order", order);
      }
      formData.append("bgColor", bgColor); // ✅ send bgColor to match backend

      if (image) {
        formData.append("image", image);
      }

      if (mode === "add") {
        await categoriesAPI.createCategory(formData);
        toast.success("Category added successfully");
      } else {
        await categoriesAPI.updateCategory(category!._id, formData);
        toast.success("Category updated successfully");
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "add" ? "Add Category" : "Edit Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Category name */}
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="Type category name here..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              min="1"
              placeholder="e.g. 1"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>

          {/* Background color picker */}
          <div className="space-y-2">
            <Label htmlFor="bgColorText">Background Color</Label>
            <div className="flex items-center gap-3">
              {/* Custom visual swatch/icon for the color picker */}
              <div
                className="w-10 h-10 rounded-lg p-0 border-2 border-gray-300 shadow-sm cursor-pointer relative overflow-hidden transition-all duration-150 hover:border-blue-500"
                // Style the swatch with the current color
                style={{ backgroundColor: bgColor }}
                onClick={() => {
                  // Programmatically click the hidden input to open the native color picker
                  document.getElementById("bgColorNative")?.click();
                }}
              >
                {/* This is the actual native color input, hidden but functional */}
                <Input
                  id="bgColorNative"
                  type="color"
                  // Hide the input's default appearance, make it fill the container
                  className="w-full h-full absolute top-0 left-0 opacity-0 cursor-pointer"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
              {/* hex code field */}
              <Input
                id="bgColorText" // Added ID for accessibility/label association
                type="text"
                className="flex-1"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Category preview"
                    className="mx-auto max-h-32 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImage(null);
                      setImagePreview("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Drag and drop image here, or click add image
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
                    asChild
                  >
                    <label htmlFor="category-image" className="cursor-pointer">
                      Add Image
                      <input
                        id="category-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-[#5B9FED] hover:bg-[#4A8FDD] text-white"
            >
              {loading
                ? "Saving..."
                : mode === "add"
                ? "Save Category"
                : "Update Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
