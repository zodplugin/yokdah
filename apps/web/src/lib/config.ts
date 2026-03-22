export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  storageProvider: process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'local',
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isLocalStorage(): boolean {
  return config.storageProvider === 'local'
}

export function isImageKitStorage(): boolean {
  return config.storageProvider === 'imagekit'
}

export function isS3Storage(): boolean {
  return config.storageProvider === 's3' || config.storageProvider === 'r2'
}
