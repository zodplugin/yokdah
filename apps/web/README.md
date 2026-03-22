# Gasin Web App

A Next.js web application for the Gasin event buddy matching platform.

## Getting Started

First, ensure the API server is running at `http://localhost:3001`, then:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Configure the following in your `.env` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_PROVIDER=local
```

### Storage Providers

The web app supports multiple storage providers for file uploads:

- **local**: Store files on API server filesystem (development)
- **imagekit**: Use ImageKit CDN for file hosting
- **s3** or **r2**: Use AWS S3 or Cloudflare R2 for file storage

For detailed configuration, see [CONFIG.md](./CONFIG.md).

## Project Structure

- `src/app/`: Next.js app router pages
- `src/lib/`: Utility libraries (API client, upload, config)
- `src/types/`: TypeScript type definitions

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## API Integration

The web app communicates with the Gasin API server through a centralized API client:

```typescript
import api from '@/lib/api'
import { uploadClient } from '@/lib/upload'

// API requests
api.setToken(token)
const events = await api.get('/api/events')

// File uploads
const result = await uploadClient.uploadImage(file, {
  onProgress: (p) => console.log(p)
})
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [CONFIG.md](./CONFIG.md) - Detailed configuration guide
- [API Server](../api/) - Backend API documentation
