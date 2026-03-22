import mongoose, { Schema, Document } from 'mongoose'

export interface IMatch extends Document {
  eventId: string
  memberIds: string[]
  chatRoomId: string
  status: 'matched' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const matchSchema = new Schema<IMatch>(
  {
    eventId: {
      type: String,
      required: true,
      index: true
    },
    memberIds: {
      type: [String],
      required: true
    },
    chatRoomId: {
      type: String,
      required: false,
      unique: true,
      sparse: true 
    },
    status: {
      type: String,
      enum: ['matched', 'confirmed', 'cancelled', 'completed'],
      default: 'matched'
    }
  },
  {
    timestamps: true
  }
)

matchSchema.index({ memberIds: 1 })
matchSchema.index({ chatRoomId: 1 })

export const Match = mongoose.model<IMatch>('Match', matchSchema)