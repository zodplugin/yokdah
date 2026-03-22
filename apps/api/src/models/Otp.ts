import mongoose, { Schema, Document } from 'mongoose'

export interface IOtp extends Document {
  whatsappNumber: string
  otp: string
  expiresAt: Date
}

const otpSchema = new Schema<IOtp>({
  whatsappNumber: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' } // Automatically delete after 5 minutes
  }
})

export const Otp = mongoose.model<IOtp>('Otp', otpSchema)
