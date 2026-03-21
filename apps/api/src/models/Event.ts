import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  name: string
  venue: string
  city: string
  date: Date
  endTime?: Date
  category: 'concert' | 'festival' | 'party' | 'activity' | 'sport'
  description: string
  coverImage: string
  ticketUrl: string
  source: string
  sourceId: string
  status: 'pending_review' | 'active' | 'hidden' | 'expired'
  maxAttendees?: number
  createdAt: Date
  updatedAt: Date
  location_name?: string
  province?: string
}

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true
    },
    venue: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    category: {
      type: String,
      enum: ['concert', 'festival', 'party', 'activity', 'sport'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      required: true
    },
    ticketUrl: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    sourceId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending_review', 'active', 'hidden', 'expired'],
      default: 'pending_review'
    },
    maxAttendees: {
      type: Number
    },
    location_name: {
      type: String
    },
    province: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

eventSchema.index({ city: 1, date: 1 })
eventSchema.index({ status: 1, date: 1 })
eventSchema.index({ category: 1 })
eventSchema.index({ source: 1, sourceId: 1 }, { unique: true })

export const Event = mongoose.model<IEvent>('Event', eventSchema)