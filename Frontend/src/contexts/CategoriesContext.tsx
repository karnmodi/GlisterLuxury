'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { categoriesApi } from '@/lib/api'
import type { Category } from '@/types'

interface CategoriesContextType {
  categories: Category[]
  loading: boolean
  error: string | null
  refetchCategories: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await categoriesApi.getAllWithProducts()
      // Ensure we always set an array, never null or undefined
      setCategories(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to fetch categories:', err)
      setError(err.message || 'Failed to load categories')
      // Fallback to empty array on error
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const refetchCategories = async () => {
    await fetchCategories()
  }

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, refetchCategories }}>
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

