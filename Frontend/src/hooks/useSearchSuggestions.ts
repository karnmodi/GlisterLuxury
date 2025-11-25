import { useState, useEffect, useRef, useCallback } from 'react'
import { productsApi } from '@/lib/api'
import type { SearchResults } from '@/types'

const DEBOUNCE_DELAY = 600 // ms - balance between UX and minimizing DB requests

/**
 * Custom hook for fetching search suggestions with debouncing
 * @param query - The search query string
 * @param enabled - Whether to enable search (default: true)
 * @returns SearchResults with products, categories, subcategories, loading state, and error
 */
export function useSearchSuggestions(query: string, enabled: boolean = true): SearchResults {
  const [results, setResults] = useState<SearchResults>({
    products: [],
    categories: [],
    subcategories: [],
    isLoading: false,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    setResults(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch suggestions from optimized endpoint
      const suggestionsData = await productsApi.getSuggestions(
        searchQuery,
        abortControllerRef.current.signal
      )

      setResults({
        products: suggestionsData.products,
        categories: suggestionsData.categories,
        subcategories: suggestionsData.subcategories,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        return
      }

      console.error('Error fetching search suggestions:', error)
      setResults(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch search suggestions',
      }))
    }
  }, [])

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Reset results if query is empty or search is disabled
    if (!enabled || !query || query.trim().length === 0) {
      setResults({
        products: [],
        categories: [],
        subcategories: [],
        isLoading: false,
        error: null,
      })
      return
    }

    // Set up debounced search
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query.trim())
    }, DEBOUNCE_DELAY)

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query, enabled, fetchSuggestions])

  return results
}
