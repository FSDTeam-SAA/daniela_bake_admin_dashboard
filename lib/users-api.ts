import apiClient from "./api"

export type UsersQueryParams = {
  page?: number
  limit?: number
  sort?: string
  name?: string
  email?: string
}

export type UsersPaginatedResponse = {
  success: boolean
  message: string
  data: {
    total: number
    page: number
    pages: number
    users: any[]
  }
}

export const usersAPI = {
  // ✅ supports: getUsers(params) and old getUsers(page, limit)
  getUsers: async (
    pageOrParams: number | UsersQueryParams = 1,
    limit = 10,
  ): Promise<UsersPaginatedResponse> => {
    const params: UsersQueryParams =
      typeof pageOrParams === "number" ? { page: pageOrParams, limit } : pageOrParams

    const response = await apiClient.get<UsersPaginatedResponse>("/users", { params })
    return response.data
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data.data
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  },
}
