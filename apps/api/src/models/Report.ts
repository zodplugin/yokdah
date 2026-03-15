import mongoose, { Schema, Document } from 'mongoose'

export interface IReport extends Document {
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

const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: String,
      required: true,
      index: true
    },
    reportedUserId: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['inappropriate_messages', 'fake_profile', 'no_show', 'harassment', 'spam', 'other'],
      required: true
    },
    detail: {
      type: String,
      maxlength: 200
    },
    screenshotUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    },
    adminNote: {
      type: String
    },
    chatRoomId: {
      type: String
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    createdAt: 'createdAt'
  }
)

reportSchema.index({ reportedUserId: 1, status: 1 })
reportSchema.index({ status: 1, createdAt: -1 })

export const Report = mongoose.model<IReport>('Report', reportSchema)