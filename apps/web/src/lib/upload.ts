import { config } from './config'

export interface UploadOptions {
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  url: string
}

export class UploadClient {
  private baseURL: string

  constructor(baseURL?: string) {
    this.baseURL = baseURL || config.apiUrl
  }

  async upload(
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          options.onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data as UploadResult)
          } catch (error) {
            reject({ error: 'Failed to parse response' })
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(error)
          } catch {
            reject({ error: xhr.statusText || 'Upload failed' })
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject({ error: 'Network error during upload' })
      })

      xhr.addEventListener('abort', () => {
        reject({ error: 'Upload cancelled' })
      })

      xhr.open('POST', `${this.baseURL}/api/upload`, true)
      xhr.send(formData)
    })
  }

  validateImage(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WEBP files are allowed' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    return { valid: true }
  }

  async uploadImage(
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const validation = this.validateImage(file)

    if (!validation.valid) {
      return Promise.reject({ error: validation.error })
    }

    return this.upload(file, options)
  }

  getUploadUrl(): string {
    return `${this.baseURL}/api/upload`
  }
}

export const uploadClient = new UploadClient()

export function getStorageProvider(): string {
  return process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'local'
}

export function isLocalStorage(): boolean {
  return getStorageProvider() === 'local'
}

export function isImageKitStorage(): boolean {
  return getStorageProvider() === 'imagekit'
}

export function isS3Storage(): boolean {
  return getStorageProvider() === 's3' || getStorageProvider() === 'r2'
}
