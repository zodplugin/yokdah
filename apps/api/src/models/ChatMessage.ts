import mongoose, { Schema, Document } from 'mongoose'

export interface IChatMessage extends Document {
  chatRoomId: string
  senderId: string
  content?: string
  photoUrl?: string
  type: 'text' | 'photo' | 'system'
  systemMessageType?: 'ice-breaker' | 'confirmation-prompt' | 'member-join' | 'member-leave' | 'member-removed'
  readBy: string[]
  createdAt: Date
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    chatRoomId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    content: {
      type: String
    },
    photoUrl: {
      type: String
    },
    type: {
      type: String,
      enum: ['text', 'photo', 'system'],
      required: true
    },
    systemMessageType: {
      type: String,
      enum: ['ice-breaker', 'confirmation-prompt', 'member-join', 'member-leave', 'member-removed']
    },
    readBy: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    createdAt: 'createdAt'
  }
)

chatMessageSchema.index({ chatRoomId: 1, createdAt: 1 })

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema)