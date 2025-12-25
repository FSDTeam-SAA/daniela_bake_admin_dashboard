import apiClient from "./api"
import type { PaginatedResponse, Product } from "./types"

export type ProductQueryParams = {
  page?: number
  limit?: number
  sort?: string
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  day?: string
}

export const productsAPI = {
  getProducts: async (params: ProductQueryParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>("/items", { params })
    return response.data
  },

  createProduct: async (data: FormData) => {
    const response = await apiClient.post("/items", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  updateProduct: async (id: string, data: FormData) => {
    const response = await apiClient.put(`/items/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/items/${id}`)
    return response.data
  },
}
