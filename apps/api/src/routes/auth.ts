import { FastifyInstance } from 'fastify'
import { User } from '../models/User'
import { sendWhatsApp, formatWhatsAppNumber, getMagicLinkMessage } from '../utils/whatsapp'

export async function authRoutes(fastify: FastifyInstance) {
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
          isOnboardingComplete: user.vibeTags.length > 0
        }
      }
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid or expired token' })
    }
  })

  fastify.post('/register', async (request: any, reply) => {
    const { email, whatsappNumber, displayName, age, gender } = request.body

    if (!email || !whatsappNumber || !displayName || !age || !gender) {
      return reply.code(400).send({ error: 'Missing required fields' })
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

    const token = fastify.jwt.sign({ userId: 'temp', type: 'onboarding', data: { email: email.toLowerCase(), whatsappNumber: formattedNumber, displayName, age, gender } }, { expiresIn: '1h' })

    return {
      token,
      user: {
        id: null,
        email: email.toLowerCase(),
        whatsappNumber: formattedNumber,
        displayName,
        age,
        gender,
        photo: null,
        vibeTags: [],
        reliabilityScore: 100,
        isOnboardingComplete: false
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
      isOnboardingComplete: user.vibeTags.length > 0
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
    const { photo, vibeTags, genderPreference, ageMin, ageMax, defaultGroupSize } = request.body
    const userId = request.user.userId

    if (userId === 'temp') {
      return reply.code(400).send({ error: 'Cannot complete onboarding with temporary token' })
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
        isOnboardingComplete: true
      }
    }
  })
}
