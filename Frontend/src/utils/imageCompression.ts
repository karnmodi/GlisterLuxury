import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedBytes: number;
}

/**
 * Compress an image file to target size while maintaining acceptable quality
 * @param file - The image file to compress
 * @param targetSizeMB - Target file size in MB (default: 2MB)
 * @param onProgress - Optional progress callback
 * @returns Promise with compressed file and compression stats
 */
export async function compressImage(
  file: File,
  targetSizeMB: number = 2,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  // Always compress images to optimize payload size, even if already below target
  // This ensures all images are optimized for upload
  console.log(`[compressImage] Compressing ${file.name} from ${(originalSize / 1024 / 1024).toFixed(2)}MB to target ${targetSizeMB}MB`);

  // Compression options - adjust quality based on file size
  // For smaller files, use higher quality to maintain visual quality
  // For larger files, use lower quality to meet target size
  const isSmallFile = originalSize <= targetSizeBytes;
  const options = {
    maxSizeMB: targetSizeMB,
    maxWidthOrHeight: 2000, // Max dimension to prevent huge images
    useWebWorker: true, // Use web worker for better performance
    initialQuality: isSmallFile ? 0.92 : 0.85, // Higher quality for small files, standard for large
    ...(onProgress && {
      onProgress: (progress: number) => {
        // Progress is a number between 0 and 100
        onProgress(progress);
      }
    }),
  };

  try {
    // Compress the image
    const compressedFile = await imageCompression(file, options);

    const compressedSize = compressedFile.size;
    const compressionRatio = compressedSize / originalSize;
    const savedBytes = originalSize - compressedSize;

    console.log(`[compressImage] Compression complete: ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${(compressionRatio * 100).toFixed(1)}% of original, saved ${(savedBytes / 1024 / 1024).toFixed(2)}MB)`);

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      savedBytes,
    };
  } catch (error) {
    console.error(`[compressImage] Compression failed for ${file.name}:`, error);
    // If compression fails, return original file
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compress multiple image files
 * @param files - Array of image files to compress
 * @param targetSizeMB - Target file size in MB (default: 2MB)
 * @param onProgress - Optional progress callback for each file
 * @returns Promise with array of compression results
 */
export async function compressImages(
  files: File[],
  targetSizeMB: number = 2,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[compressImages] Processing file ${i + 1}/${files.length}: ${file.name}`);

    try {
      const result = await compressImage(
        file,
        targetSizeMB,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      results.push(result);
    } catch (error) {
      console.error(`[compressImages] Failed to compress ${file.name}:`, error);
      // If compression fails, use original file
      results.push({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        savedBytes: 0,
      });
    }
  }

  return results;
}

/**
 * Calculate total size of multiple files
 * @param files - Array of files to calculate total size for
 * @returns Total size in bytes
 */
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Calculate total size in MB
 * @param files - Array of files to calculate total size for
 * @returns Total size in MB
 */
export function calculateTotalSizeMB(files: File[]): number {
  return calculateTotalSize(files) / (1024 * 1024);
}

/**
 * Compress images with adaptive compression based on total payload size
 * If total payload exceeds limit, compress more aggressively
 * @param files - Array of image files to compress
 * @param maxPayloadMB - Maximum total payload size in MB (default: 4MB for Vercel safety margin)
 * @param onProgress - Optional progress callback for each file
 * @returns Promise with array of compression results
 */
export async function compressImagesAdaptive(
  files: File[],
  maxPayloadMB: number = 4,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<CompressionResult[]> {
  const totalSizeMB = calculateTotalSizeMB(files);
  console.log(`[compressImagesAdaptive] Total payload size: ${totalSizeMB.toFixed(2)}MB (limit: ${maxPayloadMB}MB)`);

  // If total size is already under limit, use standard compression
  if (totalSizeMB <= maxPayloadMB) {
    const targetSizeMB = 2; // Standard target per file
    console.log(`[compressImagesAdaptive] Total size within limit, using standard compression (${targetSizeMB}MB per file)`);
    return compressImages(files, targetSizeMB, onProgress);
  }

  // Calculate target size per file to stay under total limit
  // Distribute the max payload across all files with some safety margin
  const safetyMargin = 0.9; // Use 90% of limit to be safe
  const availableSizeMB = (maxPayloadMB * safetyMargin) / files.length;
  const targetSizeMB = Math.max(0.5, Math.min(availableSizeMB, 2)); // Between 0.5MB and 2MB per file

  console.log(`[compressImagesAdaptive] Total size exceeds limit, using aggressive compression (${targetSizeMB.toFixed(2)}MB per file)`);
  return compressImages(files, targetSizeMB, onProgress);
}

