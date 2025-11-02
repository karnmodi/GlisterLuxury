'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartApi } from '@/lib/api'
import type { Cart, CartItem } from '@/types'

interface CartContextType {
  cart: Cart | null
  loading: boolean
  error: string | null
  sessionID: string
  addToCart: (data: {
    productID: string
    selectedMaterial: { materialID?: string; name: string; basePrice?: number }
    selectedSize?: number
    selectedSizeName?: string
    selectedFinish?: string
    quantity?: number
    includePackaging?: boolean
  }) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Generate or retrieve session ID from localStorage
const getSessionID = (): string => {
  if (typeof window === 'undefined') return ''
  
  let sessionID = localStorage.getItem('glister_session_id')
  if (!sessionID) {
    sessionID = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('glister_session_id', sessionID)
  }
  return sessionID
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionID, setSessionID] = useState('')

  // Initialize session ID on mount
  useEffect(() => {
    setSessionID(getSessionID())
  }, [])

  // Fetch cart when sessionID is available
  const refreshCart = useCallback(async () => {
    if (!sessionID) return

    try {
      setLoading(true)
      setError(null)
      const cartData = await cartApi.get(sessionID)
      setCart(cartData)
    } catch (err) {
      // If cart doesn't exist, that's okay - it will be created when adding items
      if (err instanceof Error && err.message.includes('not found')) {
        setCart(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch cart')
      }
    } finally {
      setLoading(false)
    }
  }, [sessionID])

  useEffect(() => {
    if (sessionID) {
      refreshCart()
    }
  }, [sessionID, refreshCart])

  const addToCart = async (data: {
    productID: string
    selectedMaterial: { materialID?: string; name: string; basePrice?: number }
    selectedSize?: number
    selectedSizeName?: string
    selectedFinish?: string
    quantity?: number
    includePackaging?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await cartApi.add({ ...data, sessionID })
      setCart(result.cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      setError(null)
      const result = await cartApi.updateItem(itemId, sessionID, quantity)
      setCart(result.cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await cartApi.removeItem(itemId, sessionID)
      setCart(result.cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await cartApi.clear(sessionID)
      setCart(result.cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        sessionID,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

