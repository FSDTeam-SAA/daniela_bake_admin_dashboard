import apiClient from "./api"
import type { Category } from "./types"

export type CategoryQueryParams = {
  page?: number
  limit?: number
  sort?: string
  name?: string
}

export type CategoriesListResponse = {
  total: number
  page: number
  pages: number
  data: Category[]
}

export const categoriesAPI = {
  getCategories: async (
    params: CategoryQueryParams = { limit: 1000 },
  ): Promise<CategoriesListResponse> => {
    const response = await apiClient.get("/categories", { params })
    return response.data.data
  },

  createCategory: async (data: FormData) => {
    const response = await apiClient.post("/categories", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  updateCategory: async (id: string, data: FormData) => {
    const response = await apiClient.put(`/categories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  },
}
