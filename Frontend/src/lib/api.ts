import type { Product, Category, Finish, MaterialMaster, Cart, CartItem, Order, OrderStats, Wishlist } from '@/types'

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
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Products API
export const productsApi = {
  getAll: (params?: { q?: string; material?: string; category?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.material) queryParams.append('material', params.material)
    if (params?.category) queryParams.append('category', params.category)
    
    const query = queryParams.toString()
    return apiCall<Product[]>(`/products${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => apiCall<Product>(`/products/${id}`),

  create: (data: Partial<Product>) => 
    apiCall<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Product>) =>
    apiCall<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  uploadImages: async (id: string, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await fetch(`${API_BASE_URL}/products/${id}/images`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  },

  deleteImage: (id: string, imageUrl: string) =>
    apiCall<{ message: string; product: Product }>(`/products/${id}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl }),
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
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSubcategory: (id: string, subcategoryId: string) =>
    apiCall<{ message: string; category: Category }>(`/categories/${id}/subcategories/${subcategoryId}`, {
      method: 'DELETE',
    }),
}

// Finishes API
export const finishesApi = {
  getAll: () => apiCall<Finish[]>('/finishes'),

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

  create: (data: Partial<MaterialMaster>) =>
    apiCall<MaterialMaster>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
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

