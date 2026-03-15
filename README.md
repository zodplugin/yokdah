# Fomoin - Event Buddy Matching Platform

Full-stack application for matching event-goers with similar interests to attend events together.

## Tech Stack

### Backend (apps/api)
- **Framework**: Fastify
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Job Queue**: BullMQ with Redis
- **Authentication**: JWT tokens
- **Email**: Resend
- **Storage**: Cloudflare R2
- **Validation**: Zod

### Frontend (apps/web)
- **Framework**: Next.js 16
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React

## Features

### User Features
- ✅ Password-based authentication
- ✅ User onboarding (profile, vibe tags, preferences)
- ✅ Event discovery and filtering
- ✅ Match request system with preferences
- ✅ AI-powered matching algorithm
- ✅ Real-time group chat
- ✅ Photo sharing
- ✅ Event confirmation system
- ✅ Post-event rating system
- ✅ Reliability score tracking
- ✅ User blocking
- ✅ Report system

### Admin Features
- ✅ Dashboard with real-time stats
- ✅ Event management (approve, hide, edit)
- ✅ User management (warn, suspend, ban)
- ✅ Report queue management
- ✅ Event scraping from external sources

### System Features
- ✅ Automatic event scraping (Ticketmaster, Eventbrite, etc.)
- ✅ Scheduled jobs (confirmations, ratings, etc.)
- ✅ Email notifications
- ✅ In-app notifications
- ✅ Real-time chat with Socket.io
- ✅ Scalable with Redis and MongoDB

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- Docker (optional)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd gasin
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables:
```env
JWT_SECRET=your-super-secret-jwt-key
RESEND_API_KEY=re_xxxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

4. Start all services:
```bash
docker-compose up -d
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

### Local Development

1. Install dependencies:
```bash
npm install
cd apps/web && npm install
cd ../api && npm install
```

2. Set up environment variables:
```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local
```

3. Start MongoDB and Redis:
```bash
docker-compose up -d mongodb redis
```

4. Start backend API:
```bash
cd apps/api
npm run dev
```

5. Start frontend (new terminal):
```bash
cd apps/web
npm run dev
```

6. Seed database (optional):
```bash
cd apps/api
npm run seed
```

## Project Structure

```
gasin/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── config/      # Database, Socket, Queue config
│   │   │   ├── jobs/        # Scheduled jobs
│   │   │   ├── middleware/  # Auth, error handling
│   │   │   ├── models/      # Mongoose models
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── utils/       # Helpers, validators
│   │   │   └── server.ts    # Entry point
│   │   ├── scripts/
│   │   │   └── seed.ts      # Database seed script
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                 # Frontend Web App
│       ├── src/
│       │   ├── app/         # Next.js app directory
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities (api, socket)
│       │   └── types/       # TypeScript types
│       ├── public/
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml        # Docker services
└── README.md
```

## API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:3001/docs

Key endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/events` - List events
- `POST /api/matches/request` - Create match request
- `GET /api/chats/:id/messages` - Get chat messages

## Environment Variables

### API (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/fomoin
REDIS_URI=redis://localhost:6379
JWT_SECRET=your-secret-key
RESEND_API_KEY=re_xxxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Scripts

### Backend (apps/api)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database with test data
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Frontend (apps/web)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Matching Algorithm

The matching system uses a scoring algorithm (max 100 points):

1. **Gender Match** (25 pts) - Based on preferences
2. **Age Overlap** (25 pts) - Compatibility of age ranges
3. **Vibe Tags** (25 pts, 5pt per matching tag) - Shared interests
4. **Past Ratings** (15 pts) - Average rating from previous matches
5. **Verified Bonus** (10 pts) - Extra for verified users

Thresholds vary based on event proximity:
- 5+ days before event: 55 pts
- 3 days before event: 45 pts
- 1 day before event: 35 pts

## Reliability Score

Starting score: 100 points (0-100 range)

**Penalties:**
- Ghost/no response: -20 pts
- Late cancel: -15 pts
- Kicked: -25 pts
- No-show: -30 pts

**Bonuses:**
- Confirm on time: +2 pts
- Attend + rate: +5 pts
- Receive ≥4 stars: +3 pts
- 30 days incident-free: +5 pts

**Score Effects:**
- 80-100: Normal matching, "Reliable" badge
- 60-79: Normal matching
- 40-59: Match only with similar scores, "Check in" badge
- 20-39: Last in queue, 24h confirm deadline, "Low reliability" badge
- 0-19: 7-day temporary lock

## Docker Services

The `docker-compose.yml` includes:

1. **mongodb** - MongoDB database
2. **redis** - Redis for job queue
3. **api** - Backend API server
4. **web** - Frontend web application

All services are connected via a Docker network.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.