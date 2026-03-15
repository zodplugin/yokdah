import mongoose, { Schema, Document } from 'mongoose'

export interface IRating extends Document {
  raterId: string
  ratedUserId: string
  matchId: string
  eventId: string
  rating: number
  note?: string
  createdAt: Date
}

const ratingSchema = new Schema<IRating>(
  {
    raterId: {
      type: String,
      required: true,
      index: true
    },
    ratedUserId: {
      type: String,
      required: true,
      index: true
    },
    matchId: {
      type: String,
      required: true
    },
    eventId: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    note: {
      type: String,
      maxlength: 100
    }
  },
  {
    timestamps: true,
    createdAt: 'createdAt'
  }
)

ratingSchema.index({ raterId: 1, matchId: 1, ratedUserId: 1 }, { unique: true })
ratingSchema.index({ ratedUserId: 1 })

export const Rating = mongoose.model<IRating>('Rating', ratingSchema)