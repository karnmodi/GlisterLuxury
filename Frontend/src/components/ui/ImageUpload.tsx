'use client'

import { useState, useRef } from 'react'
import Button from './Button'

interface ImageUploadProps {
  images: string[]
  onUpload: (files: File[]) => Promise<void>
  onDelete: (imageUrl: string) => Promise<void>
  multiple?: boolean
  maxImages?: number
  disabled?: boolean
}

export default function ImageUpload({
  images,
  onUpload,
  onDelete,
  multiple = false,
  maxImages = 10,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate file count
    if (multiple && images.length + fileArray.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`)
      return
    }

    // Validate file types
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'))
    if (validFiles.length !== fileArray.length) {
      alert('Only image files are allowed')
      return
    }

    // Validate file sizes (5MB max)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Files must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      await onUpload(validFiles)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      setDeleting(imageUrl)
      await onDelete(imageUrl)
    } catch (error) {
      console.error('Delete failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  const canUploadMore = multiple ? images.length < maxImages : images.length === 0

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canUploadMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {images.length === 0 ? 'Upload Image' : 'Upload More Images'}
              </span>
            )}
          </Button>
          {multiple && (
            <p className="text-xs text-charcoal/60 mt-2">
              {images.length} of {maxImages} images • Max 5MB per image • JPEG, PNG, GIF, WebP
            </p>
          )}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className={`grid ${multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {images.map((imageUrl, index) => (
            <div
              key={imageUrl}
              className="relative group aspect-square bg-cream border border-brass/30 rounded-sm overflow-hidden"
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Delete Button Overlay */}
              <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(imageUrl)}
                  disabled={deleting === imageUrl}
                >
                  {deleting === imageUrl ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-brass/30 rounded-sm p-8 text-center">
          <svg className="w-12 h-12 text-brass/40 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-charcoal/60 mb-2">No images uploaded yet</p>
          <p className="text-xs text-charcoal/40">
            {multiple ? 'Upload multiple product images' : 'Upload a single finish image'}
          </p>
        </div>
      )}
    </div>
  )
}

