import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'prefer-not-to-say']),
  photo: z.string().nullable(),
  vibeTags: z.array(z.string()),
  genderPreference: z.enum(['any', 'female', 'male']),
  ageMin: z.number(),
  ageMax: z.number(),
  defaultGroupSize: z.enum(['1+1', '1+2', '1+3', '1+4', 'flexible']),
  reliabilityScore: z.number(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  isVerified: z.boolean(),
  eventsAttended: z.number()
})

export type User = z.infer<typeof UserSchema>

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  venue: z.string(),
  city: z.string(),
  date: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  category: z.enum(['concert', 'party', 'activity', 'sport']),
  description: z.string(),
  coverImage: z.string(),
  ticketUrl: z.string(),
  lookingCount: z.number()
})

export type Event = z.infer<typeof EventSchema>

export const MatchRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventId: z.string(),
  groupSize: z.enum(['1+1', '1+2', '1+3', '1+4', 'flexible']),
  genderPreference: z.enum(['any', 'female', 'male']),
  ageMin: z.number(),
  ageMax: z.number(),
  vibeTags: z.array(z.string()),
  status: z.enum(['pending', 'matched', 'confirmed', 'expired', 'cancelled']),
  priority: z.boolean(),
  createdAt: z.coerce.date()
})

export type MatchRequest = z.infer<typeof MatchRequestSchema>

export const MatchSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  memberIds: z.array(z.string()),
  chatRoomId: z.string(),
  status: z.enum(['matched', 'confirmed', 'cancelled', 'completed']),
  createdAt: z.coerce.date()
})

export type Match = z.infer<typeof MatchSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  senderId: z.string(),
  content: z.string().nullable(),
  photoUrl: z.string().nullable(),
  type: z.enum(['text', 'photo', 'system']),
  systemMessageType: z.enum(['ice-breaker', 'confirmation-prompt', 'member-join', 'member-leave', 'member-removed']).nullable(),
  readBy: z.array(z.string()),
  createdAt: z.coerce.date()
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatRoomSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  eventId: z.string(),
  memberIds: z.array(z.string()),
  confirmationStatus: z.record(z.string(), z.enum(['going', 'pending', 'not-going'])),
  expiresAt: z.coerce.date()
})

export type ChatRoom = z.infer<typeof ChatRoomSchema>

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['match_found', 'confirmation_req', 'new_message', 'member_removed', 'replacement_offer', 'rating_request', 'event_reminder', 'reliability_warn', 'account_locked']),
  title: z.string(),
  message: z.string(),
  data: z.any().nullable(),
  isRead: z.boolean(),
  createdAt: z.coerce.date()
})

export type Notification = z.infer<typeof NotificationSchema>

export const RatingSchema = z.object({
  id: z.string(),
  raterId: z.string(),
  ratedUserId: z.string(),
  matchId: z.string(),
  eventId: z.string(),
  rating: z.number(),
  note: z.string().nullable(),
  createdAt: z.coerce.date()
})

export type Rating = z.infer<typeof RatingSchema>

export const ReportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  reportedUserId: z.string(),
  category: z.enum(['inappropriate_messages', 'fake_profile', 'no_show', 'harassment', 'spam', 'other']),
  detail: z.string().nullable(),
  screenshotUrl: z.string().nullable(),
  status: z.enum(['pending', 'resolved', 'dismissed']),
  adminNote: z.string().nullable(),
  chatRoomId: z.string().nullable(),
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable()
})

export type Report = z.infer<typeof ReportSchema>

export const PublicUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  photo: z.string().nullable(),
  vibeTags: z.array(z.string()),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  isVerified: z.boolean(),
  eventsAttended: z.number(),
  createdAt: z.coerce.date()
})

export type PublicUser = z.infer<typeof PublicUserSchema>

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    age: z.number(),
    gender: z.enum(['male', 'female', 'prefer-not-to-say']),
    photo: z.string().nullable(),
    vibeTags: z.array(z.string()),
    reliabilityScore: z.number(),
    isOnboardingComplete: z.boolean()
  })
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>