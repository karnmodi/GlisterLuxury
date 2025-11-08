'use client'

import { useMemo } from 'react'
import type { Collection } from '@/types'

interface CollectionVisualProps {
  collection: Collection
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
  className?: string
}

export default function CollectionVisual({
  collection,
  size = 'md',
  showBadge = true,
  className = '',
}: CollectionVisualProps) {
  // Generate a unique color based on collection name
  const colorHash = useMemo(() => {
    let hash = 0
    for (let i = 0; i < collection.name.length; i++) {
      hash = collection.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return hash
  }, [collection.name])

  // Generate solid color from existing palette (charcoal, brass, ivory, olive)
  const solidColor = useMemo(() => {
    const colors = [
      { name: 'ivory', value: '#F5F5F0' },
      { name: 'charcoal', value: '#1E1E1E' },
      { name: 'brass', value: '#C9A66B' },
      { name: 'olive', value: '#9A9774' },
    ]
    const index = Math.abs(colorHash) % colors.length
    return colors[index]
  }, [colorHash])

  // Size classes - removed fixed heights, will use container height
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-5xl sm:text-6xl',
  }

  // Pattern type based on collection name for texture
  const patternType = useMemo(() => {
    const patterns = ['grid', 'dots', 'lines', 'waves', 'embossed']
    return patterns[Math.abs(colorHash) % patterns.length]
  }, [colorHash])

  return (
    <div className={`relative ${sizeClasses[size]} ${className} overflow-hidden h-full w-full`}>
      {/* Solid Color Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: solidColor.value,
        }}
      />

      {/* Luxury Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        {patternType === 'grid' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
        )}
        {patternType === 'dots' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        )}
        {patternType === 'lines' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(0, 0, 0, 0.08) 20px,
                rgba(0, 0, 0, 0.08) 40px
              )`,
            }}
          />
        )}
        {patternType === 'waves' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 4px,
                rgba(0, 0, 0, 0.08) 4px,
                rgba(0, 0, 0, 0.08) 8px
              )`,
            }}
          />
        )}
        {patternType === 'embossed' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)
              `,
            }}
          />
        )}
      </div>

      {/* Subtle Depth Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5" />

      {/* Product Count Badge */}
      {showBadge && collection.productCount !== undefined && (
        <div className="absolute top-4 right-4 bg-charcoal/90 backdrop-blur-md text-ivory px-3 py-1.5 rounded-full border border-brass/40 shadow-lg z-20">
          <span className="text-xs font-semibold">
            {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
          </span>
        </div>
      )}
    </div>
  )
}

