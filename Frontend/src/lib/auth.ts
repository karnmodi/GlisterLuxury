import type { User, AuthResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }) =>
    apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (token: string) =>
    apiCall<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    }, token),

  getMe: (token: string) =>
    apiCall<{ success: boolean; user: User }>('/auth/me', {
      method: 'GET',
    }, token),

  updateDetails: (data: {
    name?: string
    email?: string
    phone?: string
  }, token: string) =>
    apiCall<{ success: boolean; message: string; user: User }>('/auth/update-details', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token),

  // Address management
  addAddress: (data: {
    label: string
    addressLine1: string
    addressLine2?: string
    city: string
    county?: string
    postcode: string
    country?: string
    isDefault?: boolean
  }, token: string) =>
    apiCall<{ success: boolean; message: string; addresses: any[] }>('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateAddress: (addressId: string, data: {
    label?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    county?: string
    postcode?: string
    country?: string
    isDefault?: boolean
  }, token: string) =>
    apiCall<{ success: boolean; message: string; addresses: any[] }>(`/auth/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token),

  deleteAddress: (addressId: string, token: string) =>
    apiCall<{ success: boolean; message: string; addresses: any[] }>(`/auth/addresses/${addressId}`, {
      method: 'DELETE',
    }, token),

  setDefaultAddress: (addressId: string, token: string) =>
    apiCall<{ success: boolean; message: string; addresses: any[] }>(`/auth/addresses/${addressId}/default`, {
      method: 'PUT',
    }, token),

  updatePassword: (data: {
    currentPassword: string
    newPassword: string
  }, token: string) =>
    apiCall<AuthResponse>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token),

  forgotPassword: (data: { email: string }) =>
    apiCall<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (resetToken: string, data: { newPassword: string }) =>
    apiCall<AuthResponse>(`/auth/reset-password/${resetToken}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

