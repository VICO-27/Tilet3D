/**
 * Safely adds Cloudinary transformation parameters to a Cloudinary URL.
 * Does not expose any secrets, simply manipulates the public delivery URL.
 */
export function optimizeCloudinaryUrl(url: string | undefined | null, transform: string): string {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url || '';
  
  // Cloudinary URLs typically contain '/upload/'
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex !== -1) {
    const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
    const afterUpload = url.substring(uploadIndex + 8);
    // Avoid double transformations if already present
    if (afterUpload.startsWith(transform + '/')) {
        return url;
    }
    return `${beforeUpload}${transform}/${afterUpload}`;
  }
  return url;
}

/**
 * Ensures video URLs on Cloudinary use universally-supported H.264 (avc1) codec,
 * preventing blank/white video rendering caused by raw HEVC (hvc1) files in web browsers.
 */
export function optimizeCloudinaryVideoUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url || '';
  if (url.includes('/vc_h264/') || url.includes('/vc_auto/')) return url;
  
  const uploadIndex = url.indexOf('/video/upload/');
  if (uploadIndex !== -1) {
    const beforeUpload = url.substring(0, uploadIndex + 14); // includes '/video/upload/'
    const afterUpload = url.substring(uploadIndex + 14);
    return `${beforeUpload}vc_h264/${afterUpload}`;
  }
  return url;
}
