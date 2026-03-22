# Gasin Web App - Configuration Guide

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_PROVIDER=local
```

### Storage Providers

The web app supports multiple storage providers for file uploads:

1. **Local Storage** (Default)
   - `NEXT_PUBLIC_STORAGE_PROVIDER=local`
   - Files are uploaded to the API server's local filesystem
   - Best for development and testing

2. **ImageKit**
   - `NEXT_PUBLIC_STORAGE_PROVIDER=imagekit`
   - Files are uploaded to ImageKit CDN
   - Requires API server to be configured with ImageKit credentials

3. **AWS S3 / Cloudflare R2**
   - `NEXT_PUBLIC_STORAGE_PROVIDER=s3` or `r2`
   - Files are uploaded to S3-compatible storage
   - Requires API server to be configured with S3/R2 credentials

## Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## File Upload

The web app uses the `uploadClient` from `@/lib/upload.ts` for file uploads:

```typescript
import { uploadClient } from '@/lib/upload'

// Upload a file with progress tracking
const result = await uploadClient.uploadImage(file, {
  onProgress: (progress) => {
    console.log(`${progress}% uploaded`)
  }
})

console.log('File URL:', result.url)
```

### File Validation

The `uploadClient` automatically validates uploaded files:
- Allowed formats: JPEG, PNG, WEBP
- Maximum file size: 5MB

## API Client

The web app uses the `api` client from `@/lib/api.ts` for API communication:

```typescript
import api from '@/lib/api'

// Set authentication token
api.setToken(user.token)

// Get data
const events = await api.get('/api/events')

// Post data
const result = await api.post('/api/matches', { eventId })

// Upload file
const upload = await api.upload('/api/upload', file, (progress) => {
  console.log(progress)
})
```

## Configuration

The web app uses centralized configuration from `@/lib/config.ts`:

```typescript
import { config, isLocalStorage, isProduction } from '@/lib/config'

console.log('API URL:', config.apiUrl)
console.log('Storage Provider:', config.storageProvider)
console.log('Is Local Storage:', isLocalStorage())
console.log('Is Production:', isProduction())
```

## Integration with API

The web app is designed to work with the Gasin API server. Make sure the API server is running and accessible at the `NEXT_PUBLIC_API_URL`.

For API configuration, refer to the API server documentation at `apps/api/`.
