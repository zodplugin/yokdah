import { FastifyInstance } from 'fastify'
import { User } from '../models/User'
import { sendWhatsApp, formatWhatsAppNumber, getMagicLinkMessage } from '../utils/whatsapp'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/otp/request', async (request: any, reply) => {
    const { whatsappNumber } = request.body

    if (!whatsappNumber) {
      return reply.code(400).send({ error: 'WhatsApp number required' })
    }

    let formattedNumber: string
    try {
      formattedNumber = formatWhatsAppNumber(whatsappNumber)
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid WhatsApp number format' })
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save/Update OTP in DB
    const { Otp } = require('../models/Otp')
    await Otp.findOneAndUpdate(
      { whatsappNumber: formattedNumber },
      { otp: otpCode, expiresAt },
      { upsert: true, new: true }
    )

    // Send via WhatsApp
    try {
      await sendWhatsApp(formattedNumber, `Your Budd OTP code is: ${otpCode}. It expires in 5 minutes.`)
    } catch (error) {
       if (process.env.NODE_ENV === 'production') {
         throw error
       }
    }

    return { message: 'OTP sent successfully', debug: process.env.NODE_ENV !== 'production' ? otpCode : undefined }
  })

  fastify.post('/otp/verify', async (request: any, reply) => {
    const { whatsappNumber, otp } = request.body

    if (!whatsappNumber || !otp) {
      return reply.code(400).send({ error: 'WhatsApp number and OTP are required' })
    }

    let formattedNumber: string
    try {
      formattedNumber = formatWhatsAppNumber(whatsappNumber)
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid WhatsApp number format' })
    }

    const { Otp } = require('../models/Otp')
    const otpRecord = await Otp.findOne({ whatsappNumber: formattedNumber, otp })

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Invalid or expired OTP' })
    }

    await Otp.deleteOne({ _id: otpRecord._id })

    const user = await User.findOne({ whatsappNumber: formattedNumber })

    if (user) {
      const token = fastify.jwt.sign({ userId: user._id, type: 'session' }, { expiresIn: '30d' })
      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          whatsappNumber: user.whatsappNumber,
          displayName: user.displayName,
          age: user.age,
          gender: user.gender,
          photo: user.photo,
          vibeTags: user.vibeTags,
          reliabilityScore: user.reliabilityScore,
          onboardingCompleted: user.vibeTags && user.vibeTags.length > 0
        }
      }
    } else {
      const token = fastify.jwt.sign(
        { userId: 'temp', type: 'onboarding', data: { whatsappNumber: formattedNumber } },
        { expiresIn: '1h' }
      )
      return {
        isNewUser: true,
        token,
        user: {
          id: null,
          whatsappNumber: formattedNumber,
          onboardingCompleted: false
        }
      }
    }
  })

  fastify.post('/magic-link/request', async (request: any, reply) => {
    const { whatsappNumber } = request.body

    if (!whatsappNumber) {
      return reply.code(400).send({ error: 'WhatsApp number required' })
    }

    const formattedNumber = formatWhatsAppNumber(whatsappNumber)
    const user = await User.findOne({ whatsappNumber: formattedNumber })

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const token = fastify.jwt.sign(
      { userId: user._id, type: 'magic_link' },
      { expiresIn: '15m' }
    )

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    await sendWhatsApp(formattedNumber, getMagicLinkMessage(user.displayName, magicLink))

    return { message: 'Magic link sent' }
  })

  fastify.get('/magic-link/verify', async (request: any, reply) => {
    try {
      await request.jwtVerify()
      
      if (request.user.type !== 'magic_link') {
        return reply.code(400).send({ error: 'Invalid token type' })
      }

      const user = await User.findById(request.user.userId)
      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      const newToken = fastify.jwt.sign({ userId: user._id, type: 'session' }, { expiresIn: '30d' })

      return {
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          whatsappNumber: user.whatsappNumber,
          displayName: user.displayName,
          age: user.age,
          gender: user.gender,
          photo: user.photo,
          vibeTags: user.vibeTags,
          reliabilityScore: user.reliabilityScore,
          onboardingCompleted: user.vibeTags && user.vibeTags.length > 0
        }
      }
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid or expired token' })
    }
  })

  fastify.post('/register', async (request: any, reply) => {
    const { email, whatsappNumber } = request.body

    if (!email || !whatsappNumber) {
      return reply.code(400).send({ error: 'Missing required fields: email and whatsappNumber are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.code(400).send({ error: 'Invalid email format' })
    }

    let formattedNumber: string
    try {
      formattedNumber = formatWhatsAppNumber(whatsappNumber)
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid WhatsApp number format' })
    }

    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { whatsappNumber: formattedNumber }
      ]
    })
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return reply.code(409).send({ error: 'Email already registered' })
      }
      return reply.code(409).send({ error: 'WhatsApp number already registered' })
    }

    const token = fastify.jwt.sign(
      { userId: 'temp', type: 'onboarding', data: { email: email.toLowerCase(), whatsappNumber: formattedNumber } },
      { expiresIn: '1h' }
    )

    return {
      token,
      user: {
        id: null,
        email: email.toLowerCase(),
        whatsappNumber: formattedNumber,
        displayName: '',
        age: null,
        gender: null,
        photo: null,
        vibeTags: [],
        reliabilityScore: 100,
        onboardingCompleted: false
      }
    }
  })

  fastify.get('/me', {
    onRequest: [async (request: any, reply: any) => {
      try {
        await request.jwtVerify()
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
    }]
  }, async (request: any) => {
    const user = await User.findById(request.user.userId)
    if (!user) {
      throw { code: 404, message: 'User not found' }
    }

    return {
      id: user._id,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      displayName: user.displayName,
      age: user.age,
      gender: user.gender,
      photo: user.photo,
      vibeTags: user.vibeTags,
      genderPreference: user.genderPreference,
      ageMin: user.ageMin,
      ageMax: user.ageMax,
      defaultGroupSize: user.defaultGroupSize,
      reliabilityScore: user.reliabilityScore,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      isVerified: user.isVerified,
      eventsAttended: user.eventsAttended,
      onboardingCompleted: user.vibeTags && user.vibeTags.length > 0
    }
  })

  fastify.post('/complete-onboarding', {
    onRequest: [async (request: any, reply: any) => {
      try {
        await request.jwtVerify()
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
    }]
  }, async (request: any, reply) => {
    const { photo, vibeTags, genderPreference, ageMin, ageMax, defaultGroupSize, displayName, age, gender, email } = request.body
    const userId = request.user.userId

    if (userId === 'temp') {
      const tempData = request.user.data || {}

      const newUser = await User.create({
        email: email || tempData.email || `temp-${Date.now()}@gasin.com`,
        whatsappNumber: tempData.whatsappNumber,
        displayName: displayName || '',
        age: parseInt(age) || null,
        gender: gender || null,
        photo: photo || null,
        vibeTags: vibeTags || [],
        genderPreference: genderPreference || 'any',
        ageMin: parseInt(ageMin) || 18,
        ageMax: parseInt(ageMax) || 50,
        defaultGroupSize: defaultGroupSize || 'flexible',
        reliabilityScore: 100,
        ratingAvg: 0,
        ratingCount: 0,
        isVerified: false,
        eventsAttended: 0
      })

      const newToken = fastify.jwt.sign({ userId: newUser._id }, { expiresIn: '30d' })

      return {
        token: newToken,
        user: {
          id: newUser._id,
          email: newUser.email,
          whatsappNumber: newUser.whatsappNumber,
          displayName: newUser.displayName,
          age: newUser.age,
          gender: newUser.gender,
          photo: newUser.photo,
          vibeTags: newUser.vibeTags,
          reliabilityScore: newUser.reliabilityScore,
          onboardingCompleted: true
        }
      }
    }

    const user = await User.findById(userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    if (photo) user.photo = photo
    if (vibeTags) user.vibeTags = vibeTags
    if (genderPreference) user.genderPreference = genderPreference
    if (ageMin) user.ageMin = ageMin
    if (ageMax) user.ageMax = ageMax
    if (defaultGroupSize) user.defaultGroupSize = defaultGroupSize
    if (displayName) user.displayName = displayName
    if (age) user.age = parseInt(age)
    if (gender) user.gender = gender

    await user.save()

    const newToken = fastify.jwt.sign({ userId: user._id }, { expiresIn: '30d' })

    return {
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        displayName: user.displayName,
        age: user.age,
        gender: user.gender,
        photo: user.photo,
        vibeTags: user.vibeTags,
        reliabilityScore: user.reliabilityScore,
        onboardingCompleted: true
      }
    }
  })
}
