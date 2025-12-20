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

export interface Category {
  _id: string
  name: string
  image?: string
  createdAt?: string
}

/** ✅ Backend returns category as object (populate) OR string id */
export type ProductCategory = string | Pick<Category, "_id" | "name" | "image">

export interface Product {
  _id: string
  name: string
  category: ProductCategory
  description: string
  price: number
  image: string
  ingredients?: Array<{
    name: string
    image?: string
  }>
  rating?: number
  reviewsCount?: number
  createdAt: string
  updatedAt?: string
}

export type OrdersPaginatedResponse = ApiResponse<OrdersPaginatedData>
/** ✅ Orders pagination shape (uses `orders`, not `items`) */
export interface OrdersPaginatedData {
  total: number
  page: number
  pages: number
  orders: Order[]
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

/** ✅ Exact API shape */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** ✅ Exact pagination data shape */
export interface PaginatedData<T> {
  total: number
  page: number
  pages: number
  items: T[]
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>
