import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@fomoin.com',
      to,
      subject,
      html
    })
  } catch (error) {
    console.error('Email send error:', error)
  }
}

export function getConfirmationEmailHtml(displayName: string, eventName: string, confirmUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Event Confirmation for ${displayName}</h2>
      <p>Are you going to <strong>${eventName}</strong>?</p>
      <p>Your squad needs to know. Please confirm by clicking below:</p>
      <a href="${confirmUrl}" style="background-color: #84cc16; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Yes, I'm in!</a>
      <p style="margin-top: 20px; color: #666;">If you can't make it, please let your squad know in the app.</p>
    </div>
  `
}

export function getMatchFoundEmailHtml(eventName: string, chatUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your squad is ready! 🎉</h2>
      <p>We've found your squad for <strong>${eventName}</strong>!</p>
      <p>Click below to start chatting with your new buddies:</p>
      <a href="${chatUrl}" style="background-color: #84cc16; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Chat</a>
    </div>
  `
}

export function getRatingEmailHtml(eventName: string, rateUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Rate your squad from ${eventName}</h2>
      <p>How was your experience with your event buddies?</p>
      <p>Rate your squad to help improve future matches:</p>
      <a href="${rateUrl}" style="background-color: #84cc16; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Rate Now</a>
      <p style="margin-top: 20px; color: #666;">You have 7 days to submit your rating.</p>
    </div>
  `
}

export function getReminderEmailHtml(eventName: string, eventDate: Date): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Event Tomorrow! 🎉</h2>
      <p><strong>${eventName}</strong> is happening tomorrow!</p>
      <p>Make sure you've confirmed your spot and check with your squad.</p>
      <p>Date: ${eventDate.toLocaleDateString()}</p>
    </div>
  `
}