import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_SECRET } from "./CLOUDINARY"

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

const cloudinaryConfig: CloudinaryConfig = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  apiSecret: CLOUDINARY_SECRET,
}

// Generate signature for secure uploads
export function generateSignature(params: Record<string, any>): string {
  const crypto = require('crypto')
  const timestamp = Math.round(new Date().getTime() / 1000)
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const stringToSign = `${paramsString}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`
  return crypto.createHash('sha1').update(stringToSign).digest('hex')
}

// Upload image to Cloudinary
export async function uploadImage(
  file: File | Blob,
  folder: string = 'dev-space',
  publicId?: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'images') // You'll need to create this preset
  formData.append('folder', folder)
  
  if (publicId) {
    formData.append('public_id', publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`)
  }

  return await response.json()
}

// Upload video to Cloudinary
export async function uploadVideo(
  file: File | Blob,
  folder: string = 'dev-space/videos',
  publicId?: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'dev_space_videos') // You'll need to create this preset
  formData.append('folder', folder)
  
  if (publicId) {
    formData.append('public_id', publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/video/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary video upload failed: ${response.statusText}`)
  }

  return await response.json()
}

// Transform image URL
export function getTransformedImageUrl(
  publicId: string,
  transformations: Record<string, any> = {}
): string {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',')
  
  return `${baseUrl}/${transformString}/${publicId}`
}

// Delete asset from Cloudinary
export async function deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const params = {
    public_id: publicId,
    timestamp: timestamp,
  }
  
  const signature = generateSignature(params)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/destroy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        signature,
        api_key: cloudinaryConfig.apiKey,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to delete asset: ${response.statusText}`)
  }
}

// Get optimized image URL for different use cases
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number,
  quality: 'auto' | number = 'auto',
  format: 'auto' | 'webp' | 'jpg' | 'png' = 'auto'
): string {
  const transformations: Record<string, any> = {
    quality,
    format,
  }
  
  if (width) transformations.width = width
  if (height) transformations.height = height
  
  return getTransformedImageUrl(publicId, transformations)
}

// Generate responsive image URLs
export function getResponsiveImageUrls(publicId: string) {
  return {
    thumbnail: getOptimizedImageUrl(publicId, 150, 150, 80, 'webp'),
    small: getOptimizedImageUrl(publicId, 400, 300, 'auto', 'webp'),
    medium: getOptimizedImageUrl(publicId, 800, 600, 'auto', 'webp'),
    large: getOptimizedImageUrl(publicId, 1200, 900, 'auto', 'webp'),
    original: getOptimizedImageUrl(publicId, undefined, undefined, 'auto', 'auto'),
  }
}
