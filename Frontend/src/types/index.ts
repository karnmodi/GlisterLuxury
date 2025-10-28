// Backend data types
export interface Material {
  materialID?: string
  name: string
  basePrice: number
  sizeOptions?: SizeOption[]
}

export interface SizeOption {
  sizeMM: number
  additionalCost: number
  isOptional: boolean
}

export interface FinishOption {
  finishID: string
  priceAdjustment: number
}

export interface Finish {
  _id: string
  name: string
  description?: string
  color?: string
  imageURL?: string
  photoURL?: string
  createdAt?: string
  updatedAt?: string
}

export interface Subcategory {
  _id: string
  name: string
  slug: string
  description?: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  subcategories: Subcategory[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductImage {
  url: string
  mappedFinishID?: string
}

export interface Product {
  _id: string
  productID: string
  productUID?: string
  name: string
  description?: string
  category?: Category | string
  subcategoryId?: string
  packagingPrice: number
  packagingUnit: string
  materials: Material[]
  finishes: FinishOption[]
  imageURLs: Record<string, ProductImage> // Object with keys as image IDs and values as image data
  createdAt?: string
  updatedAt?: string
}

export interface CartItem {
  _id: string
  productID: string | Product
  productName: string
  productCode: string
  selectedMaterial: {
    materialID?: string
    name: string
    basePrice: number
  }
  selectedSize?: number
  sizeCost: number
  selectedFinish?: {
    finishID: string
    name: string
    priceAdjustment: number
  }
  finishCost: number
  packagingPrice: number
  quantity: number
  unitPrice: number
  totalPrice: number
  priceBreakdown: {
    material: number
    size: number
    finishes: number
    packaging: number
  }
}

export interface Cart {
  _id: string
  sessionID: string
  userID?: string
  items: CartItem[]
  subtotal: number
  status: 'active' | 'checkout' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface MaterialMaster {
  _id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface FAQ {
  _id: string
  question: string
  answer: string
  linkType: 'internal' | 'external' | 'none'
  linkUrl?: string
  linkText?: string
  order: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// API Response types
export interface ApiError {
  message: string
  error?: string
}

// Auth types
export interface Address {
  _id: string
  label: string
  addressLine1: string
  addressLine2?: string
  city: string
  county?: string
  postcode: string
  country: string
  isDefault: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin'
  phone?: string
  addresses: Address[]
  isActive: boolean
  lastLogin?: string
  createdAt?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: User
}

// Order types
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered'
  | 'refund_requested'
  | 'refund_processing'
  | 'refund_completed'
  | 'cancelled'

export interface OrderItem {
  _id: string
  productID: string | Product
  productName: string
  productCode: string
  selectedMaterial: {
    materialID?: string
    name: string
    basePrice: number
  }
  selectedSize?: number
  sizeCost: number
  selectedFinish?: {
    finishID: string
    name: string
    priceAdjustment: number
  }
  finishCost: number
  packagingPrice: number
  quantity: number
  unitPrice: number
  totalPrice: number
  priceBreakdown: {
    material: number
    size: number
    finishes: number
    packaging: number
  }
}

export interface Order {
  _id: string
  orderNumber: string
  userID: string
  sessionID?: string
  items: OrderItem[]
  customerInfo: {
    name: string
    email: string
    phone?: string
  }
  deliveryAddress: {
    label?: string
    addressLine1: string
    addressLine2?: string
    city: string
    county?: string
    postcode: string
    country: string
  }
  orderNotes?: string
  pricing: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  status: OrderStatus
  orderStatusHistory: Array<{
    status: OrderStatus
    note?: string
    updatedAt: string
    updatedBy?: string
  }>
  paymentStatusHistory: Array<{
    status: string
    note?: string
    updatedAt: string
    updatedBy?: string
  }>
  refundInfo?: {
    reason?: string
    requestedAt?: string
    processedAt?: string
    completedAt?: string
    refundAmount?: number
    notes?: string
  }
  paymentInfo: {
    method?: string
    status: 'pending' | 'awaiting_payment' | 'paid' | 'partially_paid' | 'payment_failed' | 'payment_pending_confirmation' | 'refunded'
    paidAt?: string
    transactionId?: string
  }
  adminMessages?: Array<{
    message: string
    createdAt: string
    createdBy?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface OrderStats {
  totalOrders: number
  totalSpent: number
  ordersByStatus: {
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    refund_requested: number
    refund_processing: number
    refund_completed: number
    cancelled: number
  }
  recentOrders: Order[]
}

// Wishlist types
export interface WishlistItem {
  _id: string
  productID: string | Product
  addedAt: string
}

export interface Wishlist {
  _id: string
  sessionID?: string
  userID?: string
  items: WishlistItem[]
  count?: number
  createdAt: string
  updatedAt: string
}

// Analytics types
export interface DashboardSummary {
  today: {
    pageViews: number
    uniqueVisitors: number
    orders: number
    revenue: number
    registrations: number
  }
  weekly: {
    pageViews: number
    orders: number
    revenue: number
    registrations: number
    conversionRate: number
  }
  monthly: {
    pageViews: number
    orders: number
    revenue: number
    registrations: number
  }
  totals: {
    users: number
    orders: number
    products: number
  }
}

export interface WebsiteVisitAnalytics {
  timeSeries: Array<{
    date: string
    pageViews: number
    uniqueVisitors: number
    uniqueSessions: number
  }>
  topPages: Array<{
    page: string
    views: number
  }>
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
    unknown: number
  }
  summary: {
    totalPageViews: number
    averageDaily: number
  }
}

export interface RevenueAnalytics {
  timeSeries: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  byCategory: Array<{
    name: string
    revenue: number
    orders: number
  }>
  byMaterial: Array<{
    name: string
    revenue: number
    quantity: number
  }>
  byFinish: Array<{
    name: string
    revenue: number
    quantity: number
  }>
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
}

export interface ProductAnalytics {
  topSelling: Array<{
    productID: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  mostViewed: Array<{
    productID: string
    productName: string
    views: number
  }>
  mostWishlisted: Array<{
    productID: string
    productName: string
    wishlistCount: number
  }>
}

export interface UserAnalytics {
  timeSeries: Array<{
    date: string
    newRegistrations: number
    totalUsers: number
    activeUsers: number
  }>
  roleBreakdown: {
    customer: number
    admin: number
  }
  summary: {
    totalUsers: number
    totalRegistrations: number
    averageDaily: number
  }
}

export interface OrderAnalytics {
  ordersByStatus: Array<{
    status: string
    count: number
  }>
  paymentsByStatus: Array<{
    status: string
    count: number
  }>
  refunds: {
    count: number
    totalAmount: number
  }
  timeSeries: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export interface ConversionAnalytics {
  timeSeries: Array<{
    date: string
    conversionRate: number
    abandonmentRate: number
    averageCartValue: number
  }>
  summary: {
    totalCarts: number
    completedOrders: number
    abandonedCarts: number
    conversionRate: number
    abandonmentRate: number
  }
}

