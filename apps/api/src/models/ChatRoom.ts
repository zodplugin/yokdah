import mongoose, { Schema, Document } from 'mongoose'

export interface IChatRoom extends Document {
  eventId: string
  matchId: string
  memberIds: string[]
  confirmationStatus: Map<string, 'going' | 'pending' | 'not-going' | 'cant_go'>
  pinnedMessageId?: string
  lastRead: Map<string, Date>
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    eventId: {
      type: String,
      required: true
    },
    matchId: {
      type: String,
      required: true,
      unique: true
    },
    memberIds: {
      type: [String],
      required: true
    },
    confirmationStatus: {
      type: Map,
      of: String,
      default: new Map()
    },
    pinnedMessageId: {
      type: String
    },
    lastRead: {
      type: Map,
      of: Date,
      default: new Map()
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
)

chatRoomSchema.index({ expiresAt: 1 })

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema)