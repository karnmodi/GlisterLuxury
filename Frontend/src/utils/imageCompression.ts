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

  // If file is already smaller than target, return as-is
  if (originalSize <= targetSizeBytes) {
    console.log(`[compressImage] File ${file.name} is already ${(originalSize / 1024 / 1024).toFixed(2)}MB, skipping compression`);
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      savedBytes: 0,
    };
  }

  console.log(`[compressImage] Compressing ${file.name} from ${(originalSize / 1024 / 1024).toFixed(2)}MB to target ${targetSizeMB}MB`);

  // Compression options
  const options = {
    maxSizeMB: targetSizeMB,
    maxWidthOrHeight: 2000, // Max dimension to prevent huge images
    useWebWorker: true, // Use web worker for better performance
    initialQuality: 0.85, // Start with 85% quality
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

