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
    params: CategoryQueryParams = {},
  ): Promise<CategoriesListResponse> => {
    // Only forward known query params. This guards against callers (e.g.
    // React Query, which passes its QueryFunctionContext as the first arg)
    // accidentally overriding the default and leaking junk into the request.
    const { page, limit = 1000, sort, name } = params ?? {}
    const response = await apiClient.get("/categories", {
      params: { page, limit, sort, name },
    })
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
