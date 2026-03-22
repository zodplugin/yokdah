import { config } from './config'

interface ApiError {
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL?: string) {
    this.baseURL = baseURL || config.apiUrl
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw data as ApiError
    }

    return data as T
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {}

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data as T)
          } catch {
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

      xhr.open('POST', url, true)
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key as string])
      })
      xhr.send(formData)
    })
  }

  async uploadMultiple<T>(endpoint: string, files: File[], onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {}

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          resolve(data as T)
        } else {
          const error = JSON.parse(xhr.responseText)
          reject(error)
        }
      })

      xhr.addEventListener('error', () => {
        reject({ error: 'Upload failed' })
      })

      xhr.open('POST', url, true)
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key as string])
      })
      xhr.send(formData)
    })
  }
}

// Create and export a single instance
const api = new ApiClient()

// Load token from localStorage on initialization
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    api.setToken(token);
  }
}

export default api