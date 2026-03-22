import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  whatsappNumber: string
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
  oneSignalSubscriptionId?: string
  otp?: string
  otpExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    whatsappNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      maxlength: 20
    },
    age: {
      type: Number,
      required: true,
      min: 18
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'prefer-not-to-say'],
      required: true
    },
    photo: {
      type: String
    },
    vibeTags: {
      type: [String],
      enum: ['chill', 'hype', 'first-timer', 'regular', 'introvert-friendly', 'social butterfly', 'early bird', 'night owl','adventurous', 'quiet vibes'],
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 3,
        message: 'Must select 1-3 vibe tags'
      }
    },
    genderPreference: {
      type: String,
      enum: ['any', 'female', 'male'],
      default: 'any'
    },
    ageMin: {
      type: Number,
      default: 18
    },
    ageMax: {
      type: Number,
      default: 35
    },
    defaultGroupSize: {
      type: String,
      enum: ['1+1', '1+2', '1+3', '1+4', 'flexible'],
      default: '1+1'
    },
    reliabilityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    eventsAttended: {
      type: Number,
      default: 0
    },
    blockedUsers: {
      type: [String],
      default: []
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    oneSignalSubscriptionId: {
      type: String
    },
    otp: {
      type: String
    },
    otpExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

userSchema.index({ email: 1 })
userSchema.index({ whatsappNumber: 1 })
userSchema.index({ reliabilityScore: 1 })

export const User = mongoose.model<IUser>('User', userSchema)