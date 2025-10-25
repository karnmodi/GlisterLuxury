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
  imageURLs: string[]
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
  statusHistory: Array<{
    status: OrderStatus
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
  paymentInfo?: {
    method?: string
    status: 'pending' | 'awaiting_payment' | 'paid' | 'refunded'
    paidAt?: string
    transactionId?: string
  }
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

