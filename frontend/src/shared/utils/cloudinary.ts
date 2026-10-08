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
