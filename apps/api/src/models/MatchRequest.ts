import mongoose, { Schema, Document } from 'mongoose'

export interface IMatchRequest extends Document {
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

const matchRequestSchema = new Schema<IMatchRequest>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    eventId: {
      type: String,
      required: true,
      index: true
    },
    groupSize: {
      type: String,
      enum: ['1+1', '1+2', '1+3', '1+4', 'flexible'],
      required: true
    },
    genderPreference: {
      type: String,
      enum: ['any', 'female', 'male'],
      default: 'any'
    },
    ageMin: {
      type: Number,
      required: true
    },
    ageMax: {
      type: Number,
      required: true
    },
    vibeTags: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'confirmed', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },
    priority: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

matchRequestSchema.index({ eventId: 1, status: 1 })
matchRequestSchema.index({ userId: 1, status: 1 })
matchRequestSchema.index({ createdAt: 1 })

export const MatchRequest = mongoose.model<IMatchRequest>('MatchRequest', matchRequestSchema)