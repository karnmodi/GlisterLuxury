import type { Product, Category, Finish, MaterialMaster, Cart, FAQ, Announcement, AboutUs, ContactInfo, ContactInquiry, CartItem, Order, OrderStats, Wishlist, DashboardSummary, WebsiteVisitAnalytics, RevenueAnalytics, ProductAnalytics, UserAnalytics, OrderAnalytics, ConversionAnalytics, NearMissOffer } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Products API
export const productsApi = {
  getAll: (params?: { 
    q?: string
    material?: string
    category?: string
    subcategory?: string
    finishId?: string
    hasSize?: boolean
    hasDiscount?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.material) queryParams.append('material', params.material)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory)
    if (params?.finishId) queryParams.append('finishId', params.finishId)
    if (params?.hasSize !== undefined) queryParams.append('hasSize', params.hasSize.toString())
    if (params?.hasDiscount !== undefined) queryParams.append('hasDiscount', params.hasDiscount.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const query = queryParams.toString()
    return apiCall<Product[]>(`/products${query ? `?${query}` : ''}`)
  },

  // Optimized endpoint for product listing - returns minimal data
  getListing: (params?: { q?: string; material?: string; category?: string; subcategory?: string; limit?: number; skip?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.material) queryParams.append('material', params.material)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory)
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())

    const query = queryParams.toString()
    return apiCall<Array<{
      _id: string
      productID: string
      name: string
      description: string
      materialsCount: number
      thumbnailImage: string | null
      hoverImage: string | null
      hoverImageFinishId: string | null
    }>>(`/products/listing${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => apiCall<Product>(`/products/${id}`),

  getFinishes: (id: string) => apiCall<Finish[]>(`/products/${id}/finishes`),

  // Validate product data before sending
  validateProductData: (data: Partial<Product>): string | null => {
    if (!data.materials || !Array.isArray(data.materials)) {
      return null // Materials are optional in the type, validation will happen on backend
    }
    
    for (const material of data.materials) {
      if (material.sizeOptions && Array.isArray(material.sizeOptions)) {
        for (const sizeOption of material.sizeOptions) {
          if (!sizeOption.name || typeof sizeOption.name !== 'string' || sizeOption.name.trim() === '') {
            return `Size name is required for all size options in material "${material.name}". Each size option must have a name, sizeMM, and additionalCost.`
          }
        }
      }
    }
    return null
  },

  create: (data: Partial<Product>) => {
    // Validate size names before sending
    const validationError = productsApi.validateProductData(data)
    if (validationError) {
      return Promise.reject(new Error(validationError))
    }
    
    return apiCall<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: (id: string, data: Partial<Product>) => {
    // Validate size names before sending
    const validationError = productsApi.validateProductData(data)
    if (validationError) {
      return Promise.reject(new Error(validationError))
    }
    
    return apiCall<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: (id: string) =>
    apiCall<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  uploadImages: async (id: string, files: File[]) => {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload')
    }

    console.log(`[productsApi.uploadImages] Preparing to upload ${files.length} file(s) for product ${id}`)
    
    const formData = new FormData()
    files.forEach((file, index) => {
      console.log(`[productsApi.uploadImages] Adding file ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      formData.append('images', file)
    })

    try {
      // DO NOT set Content-Type header manually - browser will set it automatically
      // with the correct boundary parameter for multipart/form-data
      const response = await fetch(`${API_BASE_URL}/products/${id}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Explicitly do NOT set Content-Type header - let browser handle it
      })

      console.log(`[productsApi.uploadImages] Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        console.error(`[productsApi.uploadImages] Upload failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log(`[productsApi.uploadImages] Upload successful: ${result.images?.length || 0} image(s) uploaded`)
      return result
    } catch (error) {
      console.error(`[productsApi.uploadImages] Upload error:`, error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to upload images')
    }
  },

  deleteImage: (id: string, imageUrl: string) =>
    apiCall<{ message: string; product: Product }>(`/products/${id}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl }),
    }),

  updateImageFinishMapping: (id: string, imageUrl: string, mappedFinishID?: string) =>
    apiCall<{ message: string; product: Product }>(`/products/${id}/images/mapping`, {
      method: 'PUT',
      body: JSON.stringify({ imageUrl, mappedFinishID }),
    }),

  toggleVisibility: (id: string, isVisible: boolean) =>
    apiCall<{ message: string; product: Product }>(`/products/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isVisible }),
    }),
}

// Categories API
export const categoriesApi = {
  getAll: (q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    return apiCall<Category[]>(`/categories${query}`)
  },

  getById: (id: string) => apiCall<Category>(`/categories/${id}`),

  getBySlug: (slug: string) => apiCall<Category>(`/categories/slug/${slug}`),

  create: (data: Partial<Category>) =>
    apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Category>) =>
    apiCall<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  addSubcategory: (id: string, data: { name: string; description?: string }) =>
    apiCall<Category>(`/categories/${id}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSubcategory: (id: string, subcategoryId: string, data: { name?: string; description?: string }) =>
    apiCall<Category>(`/categories/${id}/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSubcategory: (id: string, subcategoryId: string) =>
    apiCall<{ message: string; category: Category }>(`/categories/${id}/subcategories/${subcategoryId}`, {
      method: 'DELETE',
    }),
}

// Finishes API
export const finishesApi = {
  getAll: (params?: { includeUsage?: boolean }) => {
    const queryParams = new URLSearchParams()
    if (params?.includeUsage) queryParams.append('includeUsage', 'true')
    
    const query = queryParams.toString()
    return apiCall<Finish[]>(`/finishes${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => apiCall<Finish>(`/finishes/${id}`),

  create: (data: Partial<Finish>) =>
    apiCall<Finish>('/finishes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Finish>) =>
    apiCall<Finish>(`/finishes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/finishes/${id}`, {
      method: 'DELETE',
    }),

  uploadImage: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_BASE_URL}/finishes/${id}/image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  },

  deleteImage: (id: string) =>
    apiCall<{ message: string; finish: Finish }>(`/finishes/${id}/image`, {
      method: 'DELETE',
    }),
}

// Materials API
export const materialsApi = {
  getAll: () => apiCall<MaterialMaster[]>('/materials'),

  getById: (id: string) => apiCall<MaterialMaster>(`/materials/${id}`),

  create: (data: Partial<MaterialMaster>) =>
    apiCall<MaterialMaster>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<MaterialMaster>) =>
    apiCall<MaterialMaster>(`/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/materials/${id}`, {
      method: 'DELETE',
    }),
}

// Cart API
export const cartApi = {
  get: (sessionID: string) => apiCall<Cart>(`/cart/${sessionID}`),

  add: (data: {
    sessionID: string
    productID: string
    selectedMaterial: { materialID?: string; name: string; basePrice?: number }
    selectedSize?: number
    selectedSizeName?: string
    selectedFinish?: string
    quantity?: number
    includePackaging?: boolean
  }) =>
    apiCall<{ message: string; cart: Cart }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (itemId: string, sessionID: string, quantity: number) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/item/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ sessionID, quantity }),
    }),

  removeItem: (itemId: string, sessionID: string) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/item/${itemId}`, {
      method: 'DELETE',
      body: JSON.stringify({ sessionID }),
    }),

  clear: (sessionID: string) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/${sessionID}`, {
      method: 'DELETE',
    }),

  getCheckoutSummary: (sessionID: string) =>
    apiCall<{
      sessionID: string
      items: Array<{
        itemID: string
        product: { code: string; name: string }
        selections: { material: string; size: string; finish: string }
        pricing: {
          materialCost: number
          sizeCost: number
          finishCost: number
          packagingCost: number
          unitPrice: number
        }
        quantity: number
        totalPrice: number
      }>
      totalItems: number
      totalQuantity: number
      subtotal: number
      currency: string
      timestamp: string
    }>(`/cart/${sessionID}/checkout`),

  linkToUser: (sessionID: string, token: string) =>
    apiCall<{ message: string; cart?: Cart }>('/cart/link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sessionID }),
    }),

  applyDiscount: (sessionID: string, code: string, userId?: string) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/${sessionID}/apply-discount`, {
      method: 'POST',
      body: JSON.stringify({ code, userId }),
    }),

  removeDiscount: (sessionID: string) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/${sessionID}/remove-discount`, {
      method: 'DELETE',
    }),

  // NEW: Unlock manual discount (allow auto-apply to re-evaluate)
  unlockDiscount: (sessionID: string) =>
    apiCall<{ message: string; cart: Cart }>(`/cart/${sessionID}/unlock-discount`, {
      method: 'POST',
    }),

  // NEW: Get near-miss offers (offers customer is close to qualifying for)
  getNearMissOffers: (sessionID: string, userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiCall<{ nearMissOffers: NearMissOffer[]; currentSubtotal: number }>(
      `/cart/${sessionID}/near-miss-offers${query}`
    );
  },
}

// Offers API
export const offersApi = {
  validate: (code: string, amount: number, userId?: string) =>
    apiCall<{
      valid: boolean
      offer?: {
        _id: string
        code: string
        description: string
        discountType: 'percentage' | 'fixed'
        discountValue: number
        discountAmount: number
      }
      error?: string
    }>('/offers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, amount, userId }),
    }),

  list: (token: string, active?: boolean) =>
    apiCall<Array<{
      _id: string
      code: string
      description: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
      minOrderAmount: number
      maxUses?: number
      usedCount: number
      validFrom: string
      validTo?: string
      isActive: boolean
      applicableTo: 'all' | 'new_users'
    }>>(`/offers${active ? '?active=true' : ''}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getById: (id: string, token: string) =>
    apiCall<{
      _id: string
      code: string
      description: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
      minOrderAmount: number
      maxUses?: number
      usedCount: number
      validFrom: string
      validTo?: string
      isActive: boolean
      applicableTo: 'all' | 'new_users'
    }>(`/offers/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  create: (data: {
    code: string
    description: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minOrderAmount?: number
    maxUses?: number
    validFrom?: string
    validTo?: string
    isActive?: boolean
    applicableTo?: 'all' | 'new_users'
  }, token: string) =>
    apiCall<{
      _id: string
      code: string
      description: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
    }>('/offers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    code?: string
    description?: string
    discountType?: 'percentage' | 'fixed'
    discountValue?: number
    minOrderAmount?: number
    maxUses?: number
    validFrom?: string
    validTo?: string
    isActive?: boolean
    applicableTo?: 'all' | 'new_users'
  }, token: string) =>
    apiCall<{
      _id: string
      code: string
      description: string
    }>(`/offers/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  delete: (id: string, token: string) =>
    apiCall<{ message: string }>(`/offers/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // NEW: Get offer analytics
  getAnalytics: (id: string, token: string) =>
    apiCall<{
      offer: {
        code?: string
        displayName: string
        autoApply: boolean
      }
      usage: {
        autoApplyCount: number
        manualApplyCount: number
        totalApplications: number
      }
      conversion: {
        ordersCreated: number
        conversionRate: string
      }
      revenue: {
        totalRevenue: number
        totalDiscount: number
        orderCount: number
      }
    }>(`/offers/${id}/analytics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
}

// Orders API
export const ordersApi = {
  create: (data: {
    sessionID: string
    deliveryAddressId?: string
    orderNotes?: string
  }, token: string) =>
    apiCall<{ success: boolean; message: string; order: Order }>('/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  getAll: (params: { status?: string; page?: number; limit?: number }, token: string) => {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const query = queryParams.toString()
    return apiCall<{
      success: boolean
      orders: Order[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>(`/orders${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getById: (orderId: string, token: string) =>
    apiCall<{ success: boolean; order: Order }>(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  requestRefund: (orderId: string, reason: string, token: string) =>
    apiCall<{ success: boolean; message: string; order: Order }>(`/orders/${orderId}/refund`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason }),
    }),

  getStats: (token: string) =>
    apiCall<{ success: boolean; stats: OrderStats }>('/orders/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateStatus: (orderId: string, status: string, note: string | undefined, token: string) =>
    apiCall<{ success: boolean; message: string; order: Order }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, note }),
    }),

  getAllOrdersAdmin: (params: { 
    status?: string; 
    paymentStatus?: string; 
    search?: string; 
    page?: number; 
    limit?: number 
  }, token: string) => {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus)
    if (params.search) queryParams.append('search', params.search)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const query = queryParams.toString()
    return apiCall<{
      success: boolean
      orders: Order[]
      stats: {
        totalOrders: number
        pendingOrders: number
        totalRevenue: number
      }
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>(`/orders/admin/all${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getOrderByIdAdmin: (orderId: string, token: string) =>
    apiCall<{ success: boolean; order: Order }>(`/orders/admin/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  addAdminMessage: (orderId: string, message: string, token: string) =>
    apiCall<{ success: boolean; message: string; order: Order }>(`/orders/${orderId}/admin-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message }),
    }),

  updatePaymentStatus: (orderId: string, paymentStatus: string, token: string) =>
    apiCall<{ success: boolean; message: string; order: Order }>(`/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ paymentStatus }),
    }),
}

// Wishlist API
export const wishlistApi = {
  get: (sessionID: string, token?: string) => {
    const queryParams = new URLSearchParams()
    queryParams.append('sessionID', sessionID)
    
    return apiCall<{ success: boolean; wishlist: Wishlist }>(`/wishlist?${queryParams.toString()}`, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    })
  },

  add: (productID: string, sessionID: string, token?: string) =>
    apiCall<{ success: boolean; message: string; wishlist: Wishlist }>('/wishlist', {
      method: 'POST',
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      body: JSON.stringify({ productID, sessionID }),
    }),

  remove: (productId: string, sessionID: string, token?: string) =>
    apiCall<{ success: boolean; message: string; wishlist: Wishlist }>(`/wishlist/item/${productId}`, {
      method: 'DELETE',
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      body: JSON.stringify({ sessionID }),
    }),

  sync: (sessionID: string, token: string) =>
    apiCall<{ success: boolean; message: string; wishlist: Wishlist }>('/wishlist/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sessionID }),
    }),

  clear: (sessionID: string, token?: string) =>
    apiCall<{ success: boolean; message: string; wishlist: Wishlist }>('/wishlist', {
      method: 'DELETE',
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      body: JSON.stringify({ sessionID }),
    }),
}


// FAQ API
export const faqApi = {
  getAll: (params?: { q?: string; isActive?: boolean; sortBy?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    
    const query = queryParams.toString()
    return apiCall<FAQ[]>(`/faqs${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => apiCall<FAQ>(`/faqs/${id}`),

  create: (data: Partial<FAQ>) =>
    apiCall<FAQ>('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<FAQ>) =>
    apiCall<FAQ>(`/faqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/faqs/${id}`, {
      method: 'DELETE',
    }),

  reorder: (orderedIds: string[]) =>
    apiCall<{ message: string }>('/faqs/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    }),
}

// Announcements API
export const announcementsApi = {
  // Public endpoint - get active announcements
  getPublic: () => {
    return apiCall<Announcement[]>('/announcements/public?public=true&sortBy=order')
  },

  // Admin endpoints - require authentication
  getAll: (token: string, params?: { q?: string; isActive?: boolean; sortBy?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    
    const query = queryParams.toString()
    return apiCall<Announcement[]>(`/announcements${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getById: (id: string, token: string) =>
    apiCall<Announcement>(`/announcements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  create: (data: Partial<Announcement>, token: string) =>
    apiCall<Announcement>('/announcements', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Announcement>, token: string) =>
    apiCall<Announcement>(`/announcements/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  delete: (id: string, token: string) =>
    apiCall<{ message: string }>(`/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  reorder: (orderedIds: string[], token: string) =>
    apiCall<{ message: string }>('/announcements/reorder', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderedIds }),
    }),
}

// About Us API
export const aboutUsApi = {
  getAll: (params?: { section?: string; q?: string; isActive?: boolean; sortBy?: string }, token?: string) => {
    const queryParams = new URLSearchParams()
    if (params?.section) queryParams.append('section', params.section)
    if (params?.q) queryParams.append('q', params.q)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    
    const query = queryParams.toString()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return apiCall<AboutUs[]>(`/about-us${query ? `?${query}` : ''}`, {
      headers
    })
  },

  getById: (id: string, token?: string) => {
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return apiCall<AboutUs>(`/about-us/${id}`, { headers })
  },

  create: (data: Partial<AboutUs>, token: string) =>
    apiCall<AboutUs>('/about-us', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AboutUs>, token: string) =>
    apiCall<AboutUs>(`/about-us/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  delete: (id: string, token: string) =>
    apiCall<{ message: string }>(`/about-us/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  reorder: (orderedIds: string[], token: string) =>
    apiCall<{ message: string }>('/about-us/reorder', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderedIds }),
    }),
}

// Contact API
export const contactApi = {
  // Contact Info
  getInfo: (params?: { type?: string; isActive?: boolean }, token?: string) => {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append('type', params.type)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    
    const query = queryParams.toString()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return apiCall<ContactInfo[]>(`/contact/info${query ? `?${query}` : ''}`, {
      headers
    })
  },

  createInfo: (data: Partial<ContactInfo>, token: string) =>
    apiCall<ContactInfo>('/contact/info', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  getInfoById: (id: string, token: string) =>
    apiCall<ContactInfo>(`/contact/info/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateInfo: (id: string, data: Partial<ContactInfo>, token: string) =>
    apiCall<ContactInfo>(`/contact/info/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  deleteInfo: (id: string, token: string) =>
    apiCall<{ message: string }>(`/contact/info/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Contact Inquiries
  submitInquiry: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    apiCall<{ message: string; inquiry: ContactInquiry }>('/contact/inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listInquiries: (token: string, params?: { status?: string; q?: string; sortBy?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    
    const query = queryParams.toString()
    return apiCall<ContactInquiry[]>(`/contact/inquiries${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getInquiry: (id: string, token: string) =>
    apiCall<ContactInquiry>(`/contact/inquiries/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateInquiry: (id: string, data: { status?: string; adminNotes?: string }, token: string) =>
    apiCall<ContactInquiry>(`/contact/inquiries/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }),

  deleteInquiry: (id: string, token: string) =>
    apiCall<{ message: string }>(`/contact/inquiries/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
}

// Analytics API
export const analyticsApi = {
  getDashboardSummary: (token: string) =>
    apiCall<{ success: boolean; data: DashboardSummary }>('/analytics/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getWebsiteVisits: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: WebsiteVisitAnalytics }>(`/analytics/visits${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getRevenueAnalytics: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: RevenueAnalytics }>(`/analytics/revenue${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getProductAnalytics: (token: string, params?: { limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: ProductAnalytics }>(`/analytics/products${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getUserAnalytics: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: UserAnalytics }>(`/analytics/users${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getOrderAnalytics: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: OrderAnalytics }>(`/analytics/orders${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  getConversionAnalytics: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const query = queryParams.toString()
    return apiCall<{ success: boolean; data: ConversionAnalytics }>(`/analytics/conversions${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  triggerDailyAggregation: (token: string, date?: string) =>
    apiCall<{ success: boolean; message: string }>('/analytics/aggregate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ date }),
    }),
}

