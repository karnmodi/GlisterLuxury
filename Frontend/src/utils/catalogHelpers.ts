/**
 * Utility functions for processing Google Drive catalog URLs (client-side)
 */

/**
 * Extract Google Drive file ID from various URL formats
 * @param url - Google Drive URL in various formats
 * @returns File ID or null if not a valid Google Drive URL
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Format 2: https://drive.google.com/file/d/FILE_ID/view
  const fileIdMatch1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch1 && fileIdMatch1[1]) {
    return fileIdMatch1[1];
  }

  // Format 3: https://drive.google.com/open?id=FILE_ID
  const fileIdMatch2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch2 && fileIdMatch2[1]) {
    return fileIdMatch2[1];
  }

  return null;
}

/**
 * Convert Google Drive file ID to preview URL
 * @param fileId - Google Drive file ID
 * @returns Preview URL
 */
export function convertToPreviewUrl(fileId: string): string {
  if (!fileId) {
    return '';
  }
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Convert Google Drive file ID to download URL
 * @param fileId - Google Drive file ID
 * @returns Download URL
 */
export function convertToDownloadUrl(fileId: string): string {
  if (!fileId) {
    return '';
  }
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Process a catalog URL and return preview and download URLs
 * Detects Google Drive URLs and converts them automatically
 * @param url - Original catalog URL (Google Drive sharing URL or direct URL)
 * @returns Object with previewUrl and downloadUrl, or null if URL is invalid
 */
export function processCatalogUrl(url: string): { previewUrl: string; downloadUrl: string } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Try to extract Google Drive file ID
  const fileId = extractGoogleDriveFileId(url);
  
  if (fileId) {
    // It's a Google Drive URL, convert it
    return {
      previewUrl: convertToPreviewUrl(fileId),
      downloadUrl: convertToDownloadUrl(fileId)
    };
  }

  // If it's not a Google Drive URL, assume it's a direct URL
  // Use the same URL for both preview and download
  return {
    previewUrl: url,
    downloadUrl: url
  };
}

