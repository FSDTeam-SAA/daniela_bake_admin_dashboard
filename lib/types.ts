export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    user: User
  }
}

export interface Product {
  _id: string
  name: string
  category: string | { _id: string; name: string; image?: string }
  description: string
  price: number
  image?: string
  images?: string[]
  ingredients?: Array<{
    name: string
    image?: string
  }>
  createdAt: string
}

export interface Order {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  items: Array<{
    item: Product
    quantity: number
    _id: string
  }>
  totalAmount: number
  address: string
  phone: string
  status: "Pending" | "Processing" | "Delivered" | "Cancelled"
  paymentStatus: "Paid" | "Pending" | "Failed"
  estimatedDelivery: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalAmount: number
  joinedDate: string
}

export interface Category {
  _id: string
  name: string
  image?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: {
    total: number
    page: number
    pages: number
    [key: string]: T[] | number
  }
}
