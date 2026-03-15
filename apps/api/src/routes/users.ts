import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { User } from '../models/User'
import { uploadToR2 } from '../utils/storage'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const user = await User.findById(request.user.userId)
    if (!user) {
      throw { code: 404, message: 'User not found' }
    }

    return {
      id: user._id,
      email: user.email,
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
      eventsAttended: user.eventsAttended
    }
  })

  fastify.patch('/profile', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { displayName, vibeTags, genderPreference, ageMin, ageMax, defaultGroupSize } = request.body

    const user = await User.findById(request.user.userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    if (displayName) user.displayName = displayName
    if (vibeTags) user.vibeTags = vibeTags
    if (genderPreference) user.genderPreference = genderPreference
    if (ageMin) user.ageMin = ageMin
    if (ageMax) user.ageMax = ageMax
    if (defaultGroupSize) user.defaultGroupSize = defaultGroupSize

    await user.save()

    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      age: user.age,
      gender: user.gender,
      photo: user.photo,
      vibeTags: user.vibeTags,
      genderPreference: user.genderPreference,
      ageMin: user.ageMin,
      ageMax: user.ageMax,
      defaultGroupSize: user.defaultGroupSize,
      reliabilityScore: user.reliabilityScore
    }
  })

  fastify.post('/photo', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const data = await request.file()
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    const buffer = await data.toBuffer()
    const filename = `photos/${request.user.userId}-${Date.now()}.${data.filename.split('.').pop()}`
    const contentType = data.mimetype

    const photoUrl = await uploadToR2(buffer, filename, contentType)

    const user = await User.findById(request.user.userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    user.photo = photoUrl
    await user.save()

    return { photoUrl }
  })

  fastify.get('/:userId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { userId } = request.params
    const currentUser = await User.findById(request.user.userId)

    if (!currentUser) {
      return reply.code(404).send({ error: 'User not found' })
    }

    if (currentUser.blockedUsers.includes(userId)) {
      return reply.code(403).send({ error: 'User blocked' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    return {
      id: user._id,
      displayName: user.displayName,
      photo: user.photo,
      vibeTags: user.vibeTags,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      isVerified: user.isVerified,
      eventsAttended: user.eventsAttended,
      createdAt: user.createdAt
    }
  })

  fastify.post('/block/:userId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { userId } = request.params

    const user = await User.findById(request.user.userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId)
      await user.save()
    }

    return { success: true }
  })

  fastify.delete('/block/:userId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { userId } = request.params

    const user = await User.findById(request.user.userId)
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    user.blockedUsers = user.blockedUsers.filter((id: string) => id !== userId)
    await user.save()

    return { success: true }
  })

  fastify.get('/blocks', {
    onRequest: [authenticate]
  }, async (request: any) => {
    const user = await User.findById(request.user.userId).populate('blockedUsers')
    if (!user) {
      throw { code: 404, message: 'User not found' }
    }

    return user.blockedUsers.map((blockedUser: any) => ({
      id: blockedUser._id,
      displayName: blockedUser.displayName,
      photo: blockedUser.photo
    }))
  })
}