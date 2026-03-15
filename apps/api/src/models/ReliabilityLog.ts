import mongoose, { Schema, Document } from 'mongoose'

export interface IReliabilityLog extends Document {
  userId: string
  type: 'ghost' | 'late-cancel' | 'early-cancel' | 'kicked' | 'no-show' | 'confirm' | 'attend' | 'rated-positive' | 'no-incident'
  points: number
  description: string
  eventId?: string
  matchId?: string
  createdAt: Date
}

const reliabilityLogSchema = new Schema<IReliabilityLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['ghost', 'late-cancel', 'early-cancel', 'kicked', 'no-show', 'confirm', 'attend', 'rated-positive', 'no-incident'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    eventId: {
      type: String
    },
    matchId: {
      type: String
    }
  },
  {
    timestamps: true,
    createdAt: 'createdAt'
  }
)

reliabilityLogSchema.index({ userId: 1, createdAt: -1 })

export const ReliabilityLog = mongoose.model<IReliabilityLog>('ReliabilityLog', reliabilityLogSchema)