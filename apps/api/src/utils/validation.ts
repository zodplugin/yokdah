import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name required').max(20, 'Display name too long'),
  age: z.number().int().min(18, 'Must be at least 18 years old'),
  gender: z.enum(['male', 'female', 'prefer-not-to-say'])
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required')
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(20).optional(),
  vibeTags: z.array(z.enum(['chill', 'hype', 'first-timer', 'regular', 'introvert-friendly', 'social butterfly', 'early bird', 'night owl'])).min(1).max(3).optional(),
  genderPreference: z.enum(['any', 'female', 'male']).optional(),
  ageMin: z.number().int().min(18).max(50).optional(),
  ageMax: z.number().int().min(18).max(50).optional(),
  defaultGroupSize: z.enum(['1+1', '1+2', '1+3', '1+4', 'flexible']).optional()
}).refine((data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax, {
  message: 'ageMin must be less than or equal to ageMax'
})

export const createMatchRequestSchema = z.object({
  eventId: z.string().min(1, 'Event ID required'),
  groupSize: z.enum(['1+1', '1+2', '1+3', '1+4', 'flexible']),
  genderPreference: z.enum(['any', 'female', 'male']).optional(),
  ageMin: z.number().int().min(18).max(50).optional(),
  ageMax: z.number().int().min(18).max(50).optional(),
  vibeTags: z.array(z.enum(['chill', 'hype', 'first-timer', 'regular', 'introvert-friendly', 'social butterfly', 'early bird', 'night owl'])).optional()
}).refine((data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax, {
  message: 'ageMin must be less than or equal to ageMax'
})

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name required'),
  venue: z.string().min(1, 'Venue required'),
  city: z.string().min(1, 'City required'),
  date: z.string().or(z.date()),
  endTime: z.string().or(z.date()).optional(),
  category: z.enum(['concert', 'party', 'activity', 'sport']),
  description: z.string().min(1, 'Description required'),
  coverImage: z.string().url('Invalid cover image URL'),
  ticketUrl: z.string().url('Invalid ticket URL')
})

export const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  endTime: z.string().or(z.date()).optional(),
  category: z.enum(['concert', 'party', 'activity', 'sport']).optional(),
  description: z.string().min(1).optional(),
  coverImage: z.string().url().optional(),
  ticketUrl: z.string().url().optional()
})

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  photoUrl: z.string().url().optional()
}).refine((data) => data.content || data.photoUrl, {
  message: 'Either content or photoUrl must be provided'
})

export const confirmAttendanceSchema = z.object({
  status: z.enum(['going', 'not-going'])
})

export const submitRatingsSchema = z.object({
  ratings: z.array(z.object({
    ratedUserId: z.string(),
    rating: z.number().int().min(1).max(5),
    note: z.string().max(100).optional()
  })).min(1)
})

export const createReportSchema = z.object({
  reportedUserId: z.string().min(1, 'Reported user ID required'),
  category: z.enum(['inappropriate_messages', 'fake_profile', 'no_show', 'harassment', 'spam', 'other']),
  detail: z.string().max(200).optional(),
  screenshotUrl: z.string().url().optional(),
  chatRoomId: z.string().optional()
})

export const updateEventStatusSchema = z.object({
  status: z.enum(['active', 'hidden', 'expired'])
})

export const adminUserActionSchema = z.object({
  action: z.enum(['warn', 'suspend', 'ban', 'unban', 'reset-score'])
})

export const adminResolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  adminNote: z.string().optional()
})