# Fomoin API

Backend API for the Fomoin event buddy matching platform.

## Tech Stack

- **Framework**: Fastify
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Job Queue**: BullMQ with Redis
- **Authentication**: JWT tokens
- **Email**: Resend
- **Storage**: Cloudflare R2 (S3-compatible)

## Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Resend API key
- Cloudflare R2 credentials

## Installation

1. Install dependencies:
```bash
cd apps/api
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your values:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/fomoin
REDIS_URI=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@fomoin.com

AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
AWS_REGION=ap-southeast-1
R2_BUCKET_NAME=fomoin-uploads
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

BASE_URL=http://localhost:3000
API_URL=http://localhost:3001

CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the API

Development mode with hot reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3001/docs
- Health check: http://localhost:3001/health

## Project Structure

```
src/
├── config/
│   ├── database.ts      # MongoDB connection
│   ├── socket.ts        # Socket.io setup
│   └── queue.ts         # BullMQ setup
├── jobs/
│   └── scheduler.ts     # Scheduled jobs
├── middleware/
│   └── auth.ts          # Authentication middleware
├── models/
│   ├── User.ts
│   ├── Event.ts
│   ├── MatchRequest.ts
│   ├── Match.ts
│   ├── ChatRoom.ts
│   ├── ChatMessage.ts
│   ├── Rating.ts
│   ├── Notification.ts
│   ├── Report.ts
│   └── ReliabilityLog.ts
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   ├── events.ts
│   ├── matches.ts
│   ├── chats.ts
│   ├── ratings.ts
│   ├── notifications.ts
│   ├── reports.ts
│   └── admin.ts
├── services/
│   ├── matchingService.ts
│   ├── notificationService.ts
│   ├── reliabilityService.ts
│   ├── confirmationService.ts
│   ├── ratingService.ts
│   └── eventService.ts
├── types/
│   └── index.ts
├── utils/
│   ├── helpers.ts
│   ├── storage.ts
│   └── email.ts
└── server.ts            # Entry point
```

## Key Features

### Authentication
- Password-based registration/login
- JWT tokens for stateless auth
- 30-day token expiration

### User Management
- Profile management
- Vibe tags selection
- Matching preferences
- Blocking users
- Reliability score tracking

### Events
- Event discovery and listing
- Filtering by city, category, date
- Admin approval workflow
- Automatic scraping from external sources

### Match Request System
- Group size preferences
- Gender and age filters
- Vibe tag matching
- Priority queue for rematch

### Matching Engine
- Algorithm scoring (max 100 points)
  - Gender match (25 pts)
  - Age overlap (25 pts)
  - Vibe tags (25 pts, 5pt per tag)
  - Past ratings (15 pts)
  - Verified bonus (10 pts)
- Debounced job queue (30 seconds)
- Dynamic threshold based on event proximity

### Real-time Chat
- Socket.io for instant messaging
- Photo sharing
- Read receipts
- Typing indicators
- System messages (ice-breakers, etc.)

### Confirmation System
- H-5: Soft reminder
- H-2: Hard prompt with email
- H-1: Final warning
- Auto-remove for non-responders
- Reliability score penalties

### Rating System
- 1-5 star ratings
- Post-event (24 hours)
- 7-day window
- Anonymous ratings
- Affects future matching

### Reliability Score
- Starting: 100 points
- Caps: 0-100
- Penalties:
  - Ghost/no response: -20
  - Late cancel: -15
  - Kicked: -25
  - No-show: -30
- Bonuses:
  - Confirm on time: +2
  - Attend + rate: +5
  - Receive ≥4 stars: +3
  - 30 days incident-free: +5

### Notifications
- In-app notifications
- Email notifications via Resend
- 30-day history
- Unread count badge

### Admin Panel
- Dashboard stats
- Event management
- User management
- Reports queue
- Warning/suspend/ban actions

## Scheduled Jobs

- **Every 6 hours**: Scrape events from external sources
- **Daily**: Hide expired events
- **Every 6 hours**: Send confirmation prompts
- **Hourly**: Check confirmation deadlines
- **Daily**: Send rating requests
- **Every 30 days**: Check monthly bonus

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/photo` - Upload photo
- `GET /api/users/:userId` - Get public profile
- `POST /api/users/block/:userId` - Block user
- `DELETE /api/users/block/:userId` - Unblock user
- `GET /api/users/blocks` - Get blocked users

### Events
- `GET /api/events` - List events with filters
- `GET /api/events/cities` - Get available cities
- `GET /api/events/:eventId` - Get event details
- `POST /api/events` - Create event (admin)
- `PATCH /api/events/:eventId` - Update event (admin)
- `POST /api/events/:eventId/status` - Update status (admin)

### Matches
- `POST /api/matches/request` - Create match request
- `GET /api/matches/requests` - Get my requests
- `GET /api/matches/:matchId` - Get match details
- `DELETE /api/matches/:requestId` - Cancel request

### Chats
- `GET /api/chats/:chatRoomId/messages` - Get messages
- `POST /api/chats/:chatRoomId/messages` - Send message
- `POST /api/chats/:chatRoomId/upload` - Upload photo
- `PATCH /api/chats/:chatRoomId/messages/:messageId/read` - Mark read
- `POST /api/chats/:chatRoomId/confirm` - Confirm attendance
- `GET /api/chats/:chatRoomId` - Get chat room details

### Ratings
- `POST /api/ratings/:matchId` - Submit ratings
- `GET /api/ratings/match/:matchId` - Get my ratings for match

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:notificationId/read` - Mark read
- `POST /api/notifications/read-all` - Mark all read
- `GET /api/notifications/count` - Get unread count

### Reports
- `POST /api/reports` - Create report

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/events` - List events
- `GET /api/admin/events/:eventId` - Get event details
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:userId` - Get user details
- `PATCH /api/admin/users/:userId` - User actions
- `GET /api/admin/reports` - List reports
- `PATCH /api/admin/reports/:reportId` - Handle report

## Development Notes

- The API uses Fastify for high performance
- MongoDB indexes are configured for optimal queries
- Socket.io enables real-time chat functionality
- BullMQ with Redis handles background jobs
- R2 provides scalable file storage
- All passwords are hashed with bcrypt

## License

MIT