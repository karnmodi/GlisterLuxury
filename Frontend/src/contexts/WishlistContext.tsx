'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { wishlistApi } from '@/lib/api'
import type { Wishlist, Product } from '@/types'
import { useAuth } from './AuthContext'

interface WishlistContextType {
  wishlist: Wishlist | null
  loading: boolean
  error: string | null
  sessionID: string
  addToWishlist: (productID: string) => Promise<void>
  removeFromWishlist: (productID: string) => Promise<void>
  isInWishlist: (productID: string) => boolean
  clearWishlist: () => Promise<void>
  refreshWishlist: () => Promise<void>
  syncWishlist: () => Promise<void>
  itemCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionID, setSessionID] = useState('')
  const { token, isAuthenticated } = useAuth()

  // Initialize session ID on mount
  useEffect(() => {
    setSessionID(getSessionID())
  }, [])

  // Fetch wishlist when sessionID is available
  const refreshWishlist = useCallback(async () => {
    if (!sessionID) return

    try {
      setLoading(true)
      setError(null)
      const response = await wishlistApi.get(sessionID, token || undefined)
      setWishlist(response.wishlist)
    } catch (err) {
      // If wishlist doesn't exist, that's okay
      if (err instanceof Error && err.message.includes('not found')) {
        setWishlist({ items: [], count: 0 } as Wishlist)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch wishlist')
      }
    } finally {
      setLoading(false)
    }
  }, [sessionID, token])

  useEffect(() => {
    if (sessionID) {
      refreshWishlist()
    }
  }, [sessionID, refreshWishlist])

  // Sync wishlist when user logs in
  const syncWishlist = useCallback(async () => {
    if (!isAuthenticated || !token || !sessionID) return

    try {
      const response = await wishlistApi.sync(sessionID, token)
      setWishlist(response.wishlist)
    } catch (err) {
      console.error('Failed to sync wishlist:', err)
    }
  }, [isAuthenticated, token, sessionID])

  // Auto-sync on auth state change
  useEffect(() => {
    if (isAuthenticated && token && sessionID) {
      syncWishlist()
    }
  }, [isAuthenticated, token, sessionID, syncWishlist])

  const addToWishlist = async (productID: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await wishlistApi.add(productID, sessionID, token || undefined)
      setWishlist(response.wishlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productID: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await wishlistApi.remove(productID, sessionID, token || undefined)
      setWishlist(response.wishlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const isInWishlist = (productID: string): boolean => {
    if (!wishlist || !wishlist.items) return false
    return wishlist.items.some(item => {
      const pid = typeof item.productID === 'string' ? item.productID : item.productID._id
      return pid === productID
    })
  }

  const clearWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await wishlistApi.clear(sessionID, token || undefined)
      setWishlist(response.wishlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear wishlist')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const itemCount = wishlist?.items?.length || 0

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        sessionID,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        refreshWishlist,
        syncWishlist,
        itemCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

