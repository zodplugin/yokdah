import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  userId: string
  type: 'match_found' | 'confirmation_req' | 'new_message' | 'member_removed' | 'replacement_offer' | 'rating_request' | 'event_reminder' | 'reliability_warn' | 'account_locked'
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['match_found', 'confirmation_req', 'new_message', 'member_removed', 'replacement_offer', 'rating_request', 'event_reminder', 'reliability_warn', 'account_locked'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    data: {
      type: Schema.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    createdAt: 'createdAt'
  }
)

notificationSchema.index({ userId: 1, isRead: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)