import { z } from 'zod'

export const VibeTags = z.enum([
  'chill',
  'hype',
  'first-timer',
  'regular',
  'introvert-friendly',
  'social butterfly',
  'early bird',
  'night owl'
])

export const Gender = z.enum(['male', 'female', 'prefer-not-to-say'])

export const GenderPreference = z.enum(['any', 'female', 'male'])

export const GroupSize = z.enum(['1+1', '1+2', '1+3', '1+4', 'flexible'])

export const MatchStatus = z.enum(['pending', 'matched', 'confirmed', 'expired', 'cancelled'])

export const EventCategory = z.enum(['concert', 'party', 'activity', 'sport'])

export const EventStatus = z.enum(['pending_review', 'active', 'hidden', 'expired'])

export const NotificationType = z.enum([
  'match_found',
  'confirmation_req',
  'new_message',
  'member_removed',
  'replacement_offer',
  'rating_request',
  'event_reminder',
  'reliability_warn',
  'account_locked'
])

export const ReportCategory = z.enum([
  'inappropriate_messages',
  'fake_profile',
  'no_show',
  'harassment',
  'spam',
  'other'
])

export const Role = z.enum(['user', 'admin'])

export interface IUser {
  _id: string
  email: string
  password: string
  displayName: string
  age: number
  gender: 'male' | 'female' | 'prefer-not-to-say'
  photo?: string
  vibeTags: string[]
  genderPreference: 'any' | 'female' | 'male'
  ageMin: number
  ageMax: number
  defaultGroupSize: string
  reliabilityScore: number
  ratingAvg: number
  ratingCount: number
  isVerified: boolean
  eventsAttended: number
  blockedUsers: string[]
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface IEvent {
  _id: string
  name: string
  venue: string
  city: string
  date: Date
  endTime?: Date
  category: 'concert' | 'party' | 'activity' | 'sport'
  description: string
  coverImage: string
  ticketUrl: string
  source: string
  sourceId: string
  status: 'pending_review' | 'active' | 'hidden' | 'expired'
  maxAttendees?: number
  createdAt: Date
  updatedAt: Date
}

export interface IMatchRequest {
  _id: string
  userId: string
  eventId: string
  groupSize: string
  genderPreference: 'any' | 'female' | 'male'
  ageMin: number
  ageMax: number
  vibeTags: string[]
  status: 'pending' | 'matched' | 'confirmed' | 'expired' | 'cancelled'
  priority: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IMatch {
  _id: string
  eventId: string
  memberIds: string[]
  chatRoomId: string
  status: 'matched' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface IChatMessage {
  _id: string
  chatRoomId: string
  senderId: string
  content?: string
  photoUrl?: string
  type: 'text' | 'photo' | 'system'
  systemMessageType?: 'ice-breaker' | 'confirmation-prompt' | 'member-join' | 'member-leave' | 'member-removed'
  readBy: string[]
  createdAt: Date
}

export interface IChatRoom {
  _id: string
  eventId: string
  matchId: string
  memberIds: string[]
  confirmationStatus: { [userId: string]: 'going' | 'pending' | 'not-going' }
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IRating {
  _id: string
  raterId: string
  ratedUserId: string
  matchId: string
  eventId: string
  rating: number
  note?: string
  createdAt: Date
}

export interface INotification {
  _id: string
  userId: string
  type: 'match_found' | 'confirmation_req' | 'new_message' | 'member_removed' | 'replacement_offer' | 'rating_request' | 'event_reminder' | 'reliability_warn' | 'account_locked'
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

export interface IReport {
  _id: string
  reporterId: string
  reportedUserId: string
  category: 'inappropriate_messages' | 'fake_profile' | 'no_show' | 'harassment' | 'spam' | 'other'
  detail?: string
  screenshotUrl?: string
  status: 'pending' | 'resolved' | 'dismissed'
  adminNote?: string
  chatRoomId?: string
  createdAt: Date
  resolvedAt?: Date
}

export interface IReliabilityLog {
  _id: string
  userId: string
  type: 'ghost' | 'late-cancel' | 'early-cancel' | 'kicked' | 'no-show' | 'confirm' | 'attend' | 'rated-positive' | 'no-incident'
  points: number
  description: string
  eventId?: string
  matchId?: string
  createdAt: Date
}