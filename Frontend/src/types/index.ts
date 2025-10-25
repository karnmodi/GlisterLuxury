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

