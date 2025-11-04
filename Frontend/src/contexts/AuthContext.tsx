'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/auth'
import { cartApi, wishlistApi } from '@/lib/api'
import { setAuthCookie, removeAuthCookie, getAuthCookie } from '@/app/actions/auth'
import type { User, Address } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: {
    name?: string
    email?: string
    phone?: string
  }) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  addAddress: (data: {
    label: string
    addressLine1: string
    addressLine2?: string
    city: string
    county?: string
    postcode: string
    country?: string
    isDefault?: boolean
  }) => Promise<void>
  updateAddress: (addressId: string, data: {
    label?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    county?: string
    postcode?: string
    country?: string
    isDefault?: boolean
  }) => Promise<void>
  deleteAddress: (addressId: string) => Promise<void>
  setDefaultAddress: (addressId: string) => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Get session ID for cart and wishlist linking
  const getSessionID = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('glister_session_id') || ''
  }

  // Check authentication on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        setUser(null)
        return
      }

      const response = await authApi.getMe(token)
      if (response.success) {
        setUser(response.user)
        setToken(token)
      } else {
        setUser(null)
        setToken(null)
        await removeAuthCookie()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      await removeAuthCookie()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await authApi.login({ email, password })
      
      if (response.success && response.token) {
        await setAuthCookie(response.token)
        setUser(response.user)
        setToken(response.token)
        
        // Link cart to user account
        const sessionID = getSessionID()
        if (sessionID) {
          try {
            await cartApi.linkToUser(sessionID, response.token)
          } catch (error) {
            console.error('Failed to link cart:', error)
          }

          // Sync wishlist
          try {
            await wishlistApi.sync(sessionID, response.token)
          } catch (error) {
            console.error('Failed to sync wishlist:', error)
          }
        }
        
        // Role-based routing
        if (response.user.role === 'admin') {
          router.push('/admin/products')
        } else {
          router.push('/profile')
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    phone?: string
  }) => {
    try {
      setLoading(true)
      const response = await authApi.register(data)
      
      if (response.success && response.token) {
        await setAuthCookie(response.token)
        setUser(response.user)
        setToken(response.token)
        
        // Link cart to user account after registration
        const sessionID = getSessionID()
        if (sessionID) {
          try {
            await cartApi.linkToUser(sessionID, response.token)
          } catch (error) {
            console.error('Failed to link cart after registration:', error)
          }

          // Sync wishlist
          try {
            await wishlistApi.sync(sessionID, response.token)
          } catch (error) {
            console.error('Failed to sync wishlist after registration:', error)
          }
        }
        
        router.push('/profile')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      const authToken = await getAuthCookie()
      
      if (authToken) {
        try {
          await authApi.logout(authToken)
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error)
        }
      }
      
      await removeAuthCookie()
      setUser(null)
      setToken(null)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: {
    name?: string
    email?: string
    phone?: string
  }) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.updateDetails(data, token)
      
      if (response.success) {
        setUser(response.user)
      }
    } catch (error) {
      console.error('Update profile failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const addAddress = async (data: {
    label: string
    addressLine1: string
    addressLine2?: string
    city: string
    county?: string
    postcode: string
    country?: string
    isDefault?: boolean
  }) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.addAddress(data, token)
      
      if (response.success && user) {
        setUser({ ...user, addresses: response.addresses })
      }
    } catch (error) {
      console.error('Add address failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateAddress = async (addressId: string, data: {
    label?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    county?: string
    postcode?: string
    country?: string
    isDefault?: boolean
  }) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.updateAddress(addressId, data, token)
      
      if (response.success && user) {
        setUser({ ...user, addresses: response.addresses })
      }
    } catch (error) {
      console.error('Update address failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteAddress = async (addressId: string) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.deleteAddress(addressId, token)
      
      if (response.success && user) {
        setUser({ ...user, addresses: response.addresses })
      }
    } catch (error) {
      console.error('Delete address failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const setDefaultAddress = async (addressId: string) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.setDefaultAddress(addressId, token)
      
      if (response.success && user) {
        setUser({ ...user, addresses: response.addresses })
      }
    } catch (error) {
      console.error('Set default address failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true)
      const token = await getAuthCookie()
      
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await authApi.updatePassword(
        { currentPassword, newPassword },
        token
      )
      
      if (response.success && response.token) {
        await setAuthCookie(response.token)
        setUser(response.user)
      }
    } catch (error) {
      console.error('Update password failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        token,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

