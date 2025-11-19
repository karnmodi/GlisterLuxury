'use client'

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { categoriesApi } from '@/lib/api'
import type { Category } from '@/types'

interface CategoriesContextType {
  categories: Category[]
  loading: boolean
  error: string | null
  hasAttemptedFetch: boolean
  refetchCategories: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const fetchAttemptedRef = useRef(false)

  const fetchCategories = async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await categoriesApi.getAllWithProducts()
      
      // Ensure we always set an array, never null or undefined
      const categoriesArray = Array.isArray(data) ? data : []
      setCategories(categoriesArray)
      setHasAttemptedFetch(true)
      
      if (categoriesArray.length === 0) {
        console.warn('Categories API returned empty array. This may indicate no categories with products exist.')
      }
    } catch (err: any) {
      console.error(`Failed to fetch categories (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err)
      
      // Retry logic for transient errors
      if (retryCount < MAX_RETRIES - 1) {
        const isNetworkError = err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('timeout')
        const isServerError = err.message?.includes('503') || err.message?.includes('Service Unavailable')
        
        if (isNetworkError || isServerError) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount) // Exponential backoff
          console.log(`Retrying categories fetch in ${delay}ms...`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchCategories(retryCount + 1)
        }
      }
      
      // Final error state after all retries exhausted
      setError(err.message || 'Failed to load categories')
      setCategories([])
      setHasAttemptedFetch(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Ensure fetch only runs once
    if (!fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true
      fetchCategories()
    }
  }, [])

  const refetchCategories = async () => {
    fetchAttemptedRef.current = false
    setHasAttemptedFetch(false)
    await fetchCategories()
  }

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, hasAttemptedFetch, refetchCategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider')
  }
  return context
}

