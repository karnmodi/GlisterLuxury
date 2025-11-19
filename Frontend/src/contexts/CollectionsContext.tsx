'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { collectionsApi } from '@/lib/api'
import type { Collection } from '@/types'

interface CollectionsContextType {
  collections: Collection[]
  loading: boolean
  error: string | null
  collectionsWithProducts: Set<string>
  refetchCollections: () => Promise<void>
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectionsWithProducts, setCollectionsWithProducts] = useState<Set<string>>(new Set())

  const fetchCollections = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await collectionsApi.getAll({ isActive: true, includeProductCount: true })
      
      if (data && Array.isArray(data)) {
        // Sort collections by displayOrder
        const sortedCollections = data.sort((a, b) => a.displayOrder - b.displayOrder)
        setCollections(sortedCollections)
        
        // Track collections with products
        const collectionSet = new Set<string>()
        data.forEach((collection: Collection) => {
          if (collection.productCount && collection.productCount > 0) {
            collectionSet.add(collection._id)
          }
        })
        setCollectionsWithProducts(collectionSet)
      } else {
        setCollections([])
        setCollectionsWithProducts(new Set())
      }
    } catch (err: any) {
      console.error('Failed to fetch collections:', err)
      setError(err.message || 'Failed to load collections')
      // Fallback to empty array on error
      setCollections([])
      setCollectionsWithProducts(new Set())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const refetchCollections = async () => {
    await fetchCollections()
  }

  return (
    <CollectionsContext.Provider value={{ collections, loading, error, collectionsWithProducts, refetchCollections }}>
      {children}
    </CollectionsContext.Provider>
  )
}

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider')
  }
  return context
}

