'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { productsApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import type { Finish } from '@/types'
import Button from '@/components/ui/Button'
import { compressImage } from '@/utils/imageCompression'

interface ImageData {
  url: string
  file?: File
  mappedFinishID?: string
}

interface ImageFinishMapperProps {
  images: ImageData[]
  onChange: (images: ImageData[]) => void
  availableFinishes: Finish[]
  selectedFinishes: Array<{finishID: string, priceAdjustment: number}>
  productId: string
}

export default function ImageFinishMapper({ 
  images, 
  onChange, 
  availableFinishes, 
  selectedFinishes,
  productId 
}: ImageFinishMapperProps) {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<Record<number, number>>({})
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Shared function to process files (used by both file input and drag-drop)
  const processFiles = async (files: FileList | null, source: 'input' | 'dragdrop') => {
    if (!files || files.length === 0) {
      console.log(`[ImageFinishMapper] No files provided from ${source}`)
      return
    }

    console.log(`[ImageFinishMapper] Processing ${files.length} file(s) from ${source}`)
    const maxFiles = 10
    const remainingSlots = maxFiles - images.length
    const maxFileSize = 10 * 1024 * 1024 // 10MB limit (original file size limit)
    const targetCompressedSize = 2 * 1024 * 1024 // 2MB target for compressed files

    // Validate files first
    const validFiles: File[] = []
    const fileArray = Array.from(files)
    
    console.log(`[ImageFinishMapper] Validating ${fileArray.length} file(s)`, {
      remainingSlots,
      maxFiles,
      currentImageCount: images.length
    })
    
    for (let i = 0; i < Math.min(fileArray.length, remainingSlots); i++) {
      const file = fileArray[i]
      
      // Validate file exists and has required properties
      if (!file || !file.name || file.size === undefined) {
        const errorMsg = `File ${i + 1} is invalid or corrupted`
        console.error(`[ImageFinishMapper] ${errorMsg}`, file)
        toast.error(errorMsg)
        continue
      }
      
      // Validate file type
      if (!file.type || !file.type.startsWith('image/')) {
        const errorMsg = `${file.name} is not an image file (type: ${file.type || 'unknown'})`
        console.error(`[ImageFinishMapper] ${errorMsg}`)
        toast.error(errorMsg)
        continue
      }

      // Validate file size (10MB limit for original)
      if (file.size === 0) {
        const errorMsg = `${file.name} is empty (0 bytes)`
        console.error(`[ImageFinishMapper] ${errorMsg}`)
        toast.error(errorMsg)
        continue
      }
      
      if (file.size > maxFileSize) {
        const errorMsg = `${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB`
        console.error(`[ImageFinishMapper] ${errorMsg}`)
        toast.error(errorMsg)
        continue
      }

      validFiles.push(file)
      console.log(`[ImageFinishMapper] File validated: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type})`)
    }

    if (validFiles.length === 0) {
      const errorMsg = 'No valid images were added after validation'
      console.warn(`[ImageFinishMapper] ${errorMsg}`)
      toast.error('No valid images selected. Please ensure files are images and under 10MB.')
      // Reset input value to ensure onChange fires next time (only for file input)
      if (source === 'input' && fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    console.log(`[ImageFinishMapper] ${validFiles.length} valid file(s) ready for processing`)

    // Compress images
    setCompressing(true)
    setCompressionProgress({})
    const newImages: ImageData[] = []
    let processedCount = 0
    let failedCount = 0

    // Process all files sequentially, ensuring each one is handled even if others fail
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      
      // Defensive check: ensure file is still valid
      if (!file || !file.name || file.size === 0) {
        console.error(`[ImageFinishMapper] File ${i + 1} is invalid, skipping:`, file)
        toast.error(`File ${i + 1} is invalid or corrupted, skipping`)
        continue
      }
      
      console.log(`[ImageFinishMapper] Processing file ${i + 1}/${validFiles.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type})`)

      try {
        // Compress image to target size (2MB)
        // Add timeout protection to prevent hanging
        const compressionPromise = compressImage(
          file,
          2, // 2MB target
          (progress) => {
            setCompressionProgress(prev => ({ ...prev, [i]: progress }))
          }
        )
        
        // Add timeout protection (30 seconds max per file)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Compression timeout')), 30000)
        })
        
        const compressionResult = await Promise.race([compressionPromise, timeoutPromise]) as Awaited<ReturnType<typeof compressImage>>

        const compressedFile = compressionResult.compressedFile
        
        // Defensive check: ensure compressed file is valid
        if (!compressedFile || compressedFile.size === 0) {
          throw new Error('Compressed file is invalid or empty')
        }
        
        console.log(`[ImageFinishMapper] Compression complete for ${file.name}: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB (saved ${(compressionResult.savedBytes / 1024 / 1024).toFixed(2)}MB)`)

        // Create preview URL from compressed file
        try {
          const previewUrl = URL.createObjectURL(compressedFile)
          if (!previewUrl) {
            throw new Error('Failed to create object URL')
          }
          
          newImages.push({
            url: previewUrl,
            file: compressedFile, // Use compressed file for upload
            mappedFinishID: undefined
          })
          processedCount++
          console.log(`[ImageFinishMapper] Successfully processed ${file.name} (${processedCount}/${validFiles.length})`)
        } catch (urlError) {
          console.error(`[ImageFinishMapper] Failed to create preview URL for compressed ${file.name}:`, urlError)
          // Fallback: try with original file
          try {
            const previewUrl = URL.createObjectURL(file)
            if (!previewUrl) {
              throw new Error('Failed to create fallback object URL')
            }
            newImages.push({
              url: previewUrl,
              file: compressedFile,
              mappedFinishID: undefined
            })
            processedCount++
            console.log(`[ImageFinishMapper] Used fallback preview URL for ${file.name}`)
          } catch (fallbackError) {
            console.error(`[ImageFinishMapper] Fallback preview URL creation also failed for ${file.name}:`, fallbackError)
            toast.error(`Failed to create preview for ${file.name}. Please try again.`)
          }
        }
      } catch (error) {
        console.error(`[ImageFinishMapper] Compression failed for ${file.name}, using original:`, error)
        failedCount++
        
        // If compression fails, use original file
        try {
          // Defensive check: ensure original file is still valid
          if (!file || file.size === 0) {
            throw new Error('Original file is invalid or empty')
          }
          
          const previewUrl = URL.createObjectURL(file)
          if (!previewUrl) {
            throw new Error('Failed to create object URL for original file')
          }
          
          newImages.push({
            url: previewUrl,
            file, // Use original file if compression fails
            mappedFinishID: undefined
          })
          processedCount++
          console.log(`[ImageFinishMapper] Using original file for ${file.name} (${processedCount}/${validFiles.length})`)
          toast.warning(`Compression failed for ${file.name}, using original file`)
        } catch (urlError) {
          console.error(`[ImageFinishMapper] Failed to create preview URL for original ${file.name}:`, urlError)
          // If we can't even create a preview URL, log it but don't add the file
          toast.error(`Failed to process ${file.name}. Please try again.`)
        }
      }
    }

    // Update state with all processed images
    if (newImages.length > 0) {
      try {
        const updatedImages = [...images, ...newImages]
        console.log(`[ImageFinishMapper] Updating images state: ${images.length} → ${updatedImages.length} images`)
        onChange(updatedImages)
        
        const totalOriginalSize = validFiles.reduce((sum, f) => sum + f.size, 0)
        const totalCompressedSize = newImages.reduce((sum, img) => sum + (img.file?.size || 0), 0)
        const savedMB = ((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)
        
        let message = `${newImages.length} image(s) added`
        if (savedMB !== '0.00') {
          message += ` (compressed, saved ${savedMB}MB)`
        }
        if (failedCount > 0) {
          message += ` (${failedCount} file(s) used original due to compression issues)`
        }
        
        toast.success(message)
        console.log(`[ImageFinishMapper] Successfully added ${newImages.length} image(s) to the form (${processedCount} processed, ${failedCount} used original)`)
      } catch (error) {
        console.error('[ImageFinishMapper] Error updating images state:', error)
        toast.error('Failed to add images. Please try again.')
      }
    } else if (validFiles.length > 0) {
      const errorMsg = `No images were successfully processed from ${validFiles.length} valid files`
      console.error(`[ImageFinishMapper] ${errorMsg}`)
      toast.error('Failed to process any images. Please try again.')
    } else {
      console.warn('[ImageFinishMapper] No valid files to process')
    }

    setCompressing(false)
    setCompressionProgress({})

    // Reset file input to ensure onChange fires next time (only for file input)
    if (source === 'input' && fileInputRef.current) {
      fileInputRef.current.value = ''
      console.log('[ImageFinishMapper] File input value reset after processing')
    }
  }

  // File input change handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    console.log('[ImageFinishMapper] File input onChange event fired', {
      files: files ? files.length : 0,
      fileInputValue: e.target.value,
      timestamp: new Date().toISOString()
    })
    
    if (!files || files.length === 0) {
      console.log('[ImageFinishMapper] No files selected or files list is empty')
      // Reset input value to ensure onChange fires next time
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    await processFiles(files, 'input')
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    // Only handle file drags, not image reordering
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setIsDraggingOver(true)
      console.log('[ImageFinishMapper] Files dragged into drop zone')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    // Only handle file drags, not image reordering
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.stopPropagation()
      // Set dropEffect to show it's a valid drop target
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we're actually leaving the drop zone (not just a child element)
    const relatedTarget = e.relatedTarget as Node | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDraggingOver(false)
      console.log('[ImageFinishMapper] Files dragged out of drop zone')
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    // Only handle file drops, not image reordering
    if (!e.dataTransfer.types.includes('Files')) {
      console.log('[ImageFinishMapper] Drop event is not for files, ignoring')
      return
    }

    const files = e.dataTransfer.files
    console.log('[ImageFinishMapper] Files dropped', {
      files: files ? files.length : 0,
      timestamp: new Date().toISOString()
    })

    if (!files || files.length === 0) {
      console.log('[ImageFinishMapper] No files in drop event')
      return
    }

    await processFiles(files, 'dragdrop')
  }

  const handleUpload = async () => {
    if (images.length === 0) return

    const filesToUpload = images.filter(img => img.file).map(img => img.file!)
    if (filesToUpload.length === 0) return

    // Check if productId is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId)
    
    if (!isValidObjectId) {
      // For new products, we'll handle the upload after product creation
      // Just show a success message for now
      toast.success('Images will be uploaded after product creation')
      
      // Keep file references for later upload
      onChange(images)
      return
    }

    try {
      setUploading(true)
      const uploadResult = await productsApi.uploadImages(productId, filesToUpload)
      
      // Get uploaded image URLs
      const uploadedImageUrls = uploadResult.images || []
      
      // Update image URLs with the actual uploaded URLs while preserving finish mappings
      // Match uploaded URLs with images by order: find the index of each image with file
      const uploadedImages = images.map((img) => {
        if (img.file) {
          // Find the corresponding uploaded URL by matching the order
          const uploadedImageIndex = images
            .filter(i => i.file)
            .findIndex(i => i === img)
          const uploadedUrl = uploadedImageUrls[uploadedImageIndex] || img.url
          
          return {
            url: uploadedUrl,
            mappedFinishID: img.mappedFinishID // Preserve finish mapping
          }
        }
        // Keep existing images as-is (without file property)
        return img
      })
      
      onChange(uploadedImages)
      
      // Apply finish mappings for images that have finish assignments
      const imagesWithMappings = uploadedImages
        .filter(img => img.mappedFinishID && img.url)
      
      for (const img of imagesWithMappings) {
        try {
          await productsApi.updateImageFinishMapping(productId, img.url, img.mappedFinishID)
        } catch (error) {
          console.error('Failed to update image-finish mapping:', error)
          toast.warning('Images uploaded but some finish mappings failed to apply')
        }
      }
      
      toast.success('Images uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]
    
    // Check if this is an uploaded image (no file property and has a Cloudinary URL)
    const isUploadedImage = !imageToRemove.file && imageToRemove.url
    
    // If it's an uploaded image and we have a productId, delete from server
    if (isUploadedImage && productId) {
      // Check if productId is a valid ObjectId (24 character hex string)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId)
      
      if (isValidObjectId) {
        try {
          setDeleting(index)
          
          // Delete from Cloudinary and database
          await productsApi.deleteImage(productId, imageToRemove.url)
          
          // Remove from local state
          const newImages = images.filter((_, i) => i !== index)
          onChange(newImages)
          
          toast.success('Image deleted successfully')
        } catch (error) {
          console.error('Failed to delete image:', error)
          toast.error('Failed to delete image. Please try again.')
        } finally {
          setDeleting(null)
        }
      } else {
        // Invalid productId, just remove from local state
        const newImages = images.filter((_, i) => i !== index)
        onChange(newImages)
      }
    } else {
      // Local preview image (has file property) or no productId, just remove from local state
      const newImages = images.filter((_, i) => i !== index)
      onChange(newImages)
    }
  }

  const updateFinishMapping = async (index: number, finishID: string) => {
    const newImages = [...images]
    
    // If selecting a finish, remove it from other images first
    if (finishID) {
      newImages.forEach((img, i) => {
        if (i !== index && img.mappedFinishID === finishID) {
          img.mappedFinishID = undefined
        }
      })
    }
    
    newImages[index].mappedFinishID = finishID || undefined
    onChange(newImages)
    
    // Update mapping on server if product exists
    if (productId && images[index].url && !images[index].file) {
      try {
        await productsApi.updateImageFinishMapping(productId, images[index].url, finishID)
      } catch (error) {
        console.error('Failed to update image-finish mapping:', error)
        toast.error('Failed to update image-finish mapping')
      }
    }
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onChange(newImages)
  }

  // Image reordering drag handlers (for reordering existing images)
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    // Only prevent default if this is for image reordering (not file drag)
    if (!e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
    }
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    // Only handle image reordering, not file drops
    if (e.dataTransfer.types.includes('Files')) {
      return // Let the file drop handler handle it
    }
    
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  const getFinishDetails = (finishID: string) => {
    return availableFinishes.find(f => f._id === finishID)
  }

  const mappedImages = images.filter(img => img.mappedFinishID)
  const unmappedImages = images.filter(img => !img.mappedFinishID)

  return (
    <div 
      className="space-y-3 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-charcoal">Product Images</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => {
              try {
                console.log('[ImageFinishMapper] Add button clicked, opening file dialog')
                // Defensive check: ensure file input ref is available
                if (!fileInputRef.current) {
                  console.error('[ImageFinishMapper] File input ref is not available')
                  toast.error('File input not available. Please refresh the page.')
                  return
                }
                
                // Reset file input value BEFORE opening dialog to ensure onChange fires every time
                fileInputRef.current.value = ''
                console.log('[ImageFinishMapper] File input value reset before opening dialog')
                
                // Small delay to ensure value reset is processed
                setTimeout(() => {
                  try {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                      console.log('[ImageFinishMapper] File dialog opened')
                    } else {
                      console.error('[ImageFinishMapper] File input ref lost during timeout')
                      toast.error('Failed to open file dialog. Please try again.')
                    }
                  } catch (clickError) {
                    console.error('[ImageFinishMapper] Error clicking file input:', clickError)
                    toast.error('Failed to open file dialog. Please try again.')
                  }
                }, 10)
              } catch (error) {
                console.error('[ImageFinishMapper] Error in button click handler:', error)
                toast.error('Failed to open file dialog. Please try again.')
              }
            }}
            disabled={images.length >= 10 || compressing}
            className="flex-1 sm:flex-none px-2 py-1 text-xs bg-brass text-white hover:bg-brass/90 disabled:opacity-50 rounded inline-flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {compressing ? 'Compressing...' : 'Add'}
          </button>
          {images.some(img => img.file) && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 sm:flex-none px-2 py-1 text-xs bg-olive text-white hover:bg-olive/90 disabled:opacity-50 rounded"
            >
              {uploading ? 'Uploading...' : (productId ? 'Upload' : 'Prepare')}
            </button>
          )}
        </div>
      </div>

      {/* Compression Progress */}
      {compressing && (
        <div className="bg-olive/10 rounded-md p-2 border border-olive/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-olive border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-charcoal font-medium">Compressing images...</span>
            </div>
            {Object.keys(compressionProgress).length > 0 && (
              <div className="space-y-1 mt-2">
                {Object.entries(compressionProgress).map(([index, progress]) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 bg-olive/20 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-olive h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-charcoal/70 min-w-[35px] text-right">
                      {Math.round(progress)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-brass/10 rounded-md p-2 border border-brass/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-brass border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-charcoal">Uploading images...</span>
          </div>
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-brass/20 border-4 border-dashed border-brass rounded-md flex items-center justify-center backdrop-blur-sm">
          <div className="text-center space-y-2">
            <svg className="w-16 h-16 mx-auto text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-semibold text-brass">Drop images here</h3>
            <p className="text-sm text-charcoal/70">Release to add images to your product</p>
          </div>
        </div>
      )}

      {/* Info for new products */}
      {!productId && images.some(img => img.file) && (
        <div className="bg-blue-50 rounded-md p-2 border border-blue-200">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] text-blue-800">Images will be uploaded when you save the product</span>
          </div>
        </div>
      )}

      {/* Images Grid - Combined */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <ImageCard
              key={`image-${index}`}
              image={image}
              index={index}
              images={images}
              availableFinishes={availableFinishes}
              selectedFinishes={selectedFinishes}
              onRemove={removeImage}
              onFinishChange={updateFinishMapping}
              onDragStart={handleImageDragStart}
              onDragOver={handleImageDragOver}
              onDrop={handleImageDrop}
              isDefault={!image.mappedFinishID}
              isDeleting={deleting === index}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 bg-cream/20 rounded-md border border-dashed border-brass/30">
          <svg className="w-10 h-10 mx-auto mb-2 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xs font-medium text-charcoal mb-1">No Images Added</h3>
          <p className="text-[10px] text-charcoal/60 mb-2">Upload product images or drag and drop them here</p>
          <button 
            onClick={() => {
              try {
                console.log('[ImageFinishMapper] Upload Images button clicked (empty state)')
                // Defensive check: ensure file input ref is available
                if (!fileInputRef.current) {
                  console.error('[ImageFinishMapper] File input ref is not available')
                  toast.error('File input not available. Please refresh the page.')
                  return
                }
                
                // Reset file input value BEFORE opening dialog to ensure onChange fires every time
                fileInputRef.current.value = ''
                console.log('[ImageFinishMapper] File input value reset before opening dialog')
                
                // Small delay to ensure value reset is processed
                setTimeout(() => {
                  try {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                      console.log('[ImageFinishMapper] File dialog opened')
                    } else {
                      console.error('[ImageFinishMapper] File input ref lost during timeout')
                      toast.error('Failed to open file dialog. Please try again.')
                    }
                  } catch (clickError) {
                    console.error('[ImageFinishMapper] Error clicking file input:', clickError)
                    toast.error('Failed to open file dialog. Please try again.')
                  }
                }, 10)
              } catch (error) {
                console.error('[ImageFinishMapper] Error in button click handler:', error)
                toast.error('Failed to open file dialog. Please try again.')
              }
            }}
            className="px-4 py-1.5 text-xs bg-brass text-white hover:bg-brass/90 rounded inline-flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Images
          </button>
        </div>
      )}
    </div>
  )
}

interface ImageCardProps {
  image: ImageData
  index: number
  images: ImageData[]
  availableFinishes: Finish[]
  selectedFinishes: Array<{finishID: string, priceAdjustment: number}>
  onRemove: (index: number) => void
  onFinishChange: (index: number, finishID: string) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, dropIndex: number) => void
  isDefault: boolean
  isDeleting?: boolean
}

function ImageCard({
  image,
  index,
  images,
  availableFinishes,
  selectedFinishes,
  onRemove,
  onFinishChange,
  onDragStart,
  onDragOver,
  onDrop,
  isDefault,
  isDeleting = false
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getFinishDetails = (finishID: string) => {
    return availableFinishes.find(f => f._id === finishID)
  }

  // Only show finishes that are selected for this product and not already mapped to other images
  const availableFinishesForMapping = availableFinishes.filter(finish => 
    selectedFinishes.some(sf => sf.finishID === finish._id)
  ).filter(finish => {
    // Check if this finish is already mapped to another image
    const isAlreadyMapped = images.some((img, imgIndex) => 
      imgIndex !== index && img.mappedFinishID === finish._id
    )
    return !isAlreadyMapped
  })

  const mappedFinish = image.mappedFinishID ? getFinishDetails(image.mappedFinishID) : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-md border overflow-hidden cursor-move transition-all ${
        isDefault 
          ? 'border-brass/30 bg-brass/5' 
          : 'border-olive/30 bg-olive/5'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square">
        {isDeleting && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-t-md">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-white">Deleting...</span>
            </div>
          </div>
        )}
        <Image
          src={image.url}
          alt={`Image ${index + 1}`}
          fill
          className={`object-cover ${isDeleting ? 'opacity-50' : ''}`}
        />
        
        {/* Overlay */}
        <AnimatePresence>
          {isHovered && !isDeleting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
            >
              <button
                onClick={() => onRemove(index)}
                disabled={isDeleting}
                className="px-1.5 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finish Badge */}
        {mappedFinish && (
          <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] font-medium text-charcoal flex items-center gap-0.5">
            {mappedFinish.photoURL && (
              <div className="relative w-2 h-2 rounded-full overflow-hidden">
                <Image
                  src={mappedFinish.photoURL}
                  alt={mappedFinish.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            {mappedFinish.color && !mappedFinish.photoURL && (
              <div
                className="w-2 h-2 rounded-full border border-charcoal/20"
                style={{ backgroundColor: mappedFinish.color }}
              />
            )}
            <span className="truncate max-w-12">{mappedFinish.name}</span>
          </div>
        )}

        {/* Default Badge */}
        {isDefault && (
          <div className="absolute top-1 right-1 bg-brass/90 text-white rounded px-1 py-0.5 text-[9px] font-medium">
            Default
          </div>
        )}
      </div>

      {/* Finish Mapping */}
      <div className="p-1.5 border-t border-brass/20">
        <select
          value={image.mappedFinishID || ''}
          onChange={(e) => onFinishChange(index, e.target.value)}
          className="w-full text-[10px] px-1 py-0.5 bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="">Default</option>
          {availableFinishesForMapping.map((finish) => (
            <option key={finish._id} value={finish._id}>
              {finish.name}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  )
}
