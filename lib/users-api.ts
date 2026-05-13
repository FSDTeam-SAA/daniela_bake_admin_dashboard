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
    accessToken?: string,
  ): Promise<UsersPaginatedResponse> => {
    const params: UsersQueryParams =
      typeof pageOrParams === "number" ? { page: pageOrParams, limit } : pageOrParams

    const response = await apiClient.get<UsersPaginatedResponse>("/users", {
      params,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    return response.data
  },

  getUserById: async (id: string, accessToken?: string) => {
    const response = await apiClient.get(`/users/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    return response.data.data
  },

  deleteUser: async (id: string, accessToken?: string) => {
    const response = await apiClient.delete(`/users/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    return response.data
  },
}
