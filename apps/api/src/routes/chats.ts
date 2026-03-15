import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { Match } from '../models/Match'
import { uploadToR2 } from '../utils/storage'

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/:chatRoomId/messages', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params
    const { before, limit = 50 } = request.query

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom) {
      return reply.code(404).send({ error: 'Chat room not found' })
    }

    if (!chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const query: any = { chatRoomId }
    if (before) query.createdAt = { $lt: new Date(before) }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'displayName photo')

    return { messages: messages.reverse() }
  })

  fastify.post('/:chatRoomId/messages', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params
    const { content, photoUrl } = request.body

    if (!content && !photoUrl) {
      return reply.code(400).send({ error: 'Content or photo required' })
    }

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom) {
      return reply.code(404).send({ error: 'Chat room not found' })
    }

    if (!chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const message = new ChatMessage({
      chatRoomId,
      senderId: request.user.userId,
      content,
      photoUrl,
      type: photoUrl ? 'photo' : 'text',
      readBy: [request.user.userId]
    })

    await message.save()

    return message
  })

  fastify.post('/:chatRoomId/upload', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom) {
      return reply.code(404).send({ error: 'Chat room not found' })
    }

    if (!chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const data = await request.file()
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    const buffer = await data.toBuffer()
    const filename = `chats/${chatRoomId}-${Date.now()}.${data.filename.split('.').pop()}`
    const contentType = data.mimetype

    const photoUrl = await uploadToR2(buffer, filename, contentType)

    return { photoUrl }
  })

  fastify.patch('/:chatRoomId/messages/:messageId/read', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId, messageId } = request.params

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom || !chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const message = await ChatMessage.findOneAndUpdate(
      { _id: messageId, chatRoomId },
      { $addToSet: { readBy: request.user.userId } },
      { new: true }
    )

    if (!message) {
      return reply.code(404).send({ error: 'Message not found' })
    }

    return { success: true }
  })

  fastify.post('/:chatRoomId/confirm', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params
    const { status } = request.body

    if (!['going', 'not-going'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' })
    }

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom) {
      return reply.code(404).send({ error: 'Chat room not found' })
    }

    if (!chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const currentStatus = chatRoom.confirmationStatus.get(request.user.userId.toString())
    if (currentStatus === 'going') {
      return reply.code(400).send({ error: 'Already confirmed' })
    }

    chatRoom.confirmationStatus.set(request.user.userId.toString(), status)
    await chatRoom.save()

    return { success: true }
  })

  fastify.get('/:chatRoomId', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom || !chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(404).send({ error: 'Chat room not found' })
    }

    const match = await Match.findOne({ chatRoomId })
    const members = await User.find({ _id: { $in: chatRoom.memberIds } })

    return {
      id: chatRoom._id,
      matchId: chatRoom.matchId,
      eventId: chatRoom.eventId,
      members: members.map(m => ({
        id: m._id,
        displayName: m.displayName,
        photo: m.photo,
        confirmationStatus: chatRoom.confirmationStatus.get(m._id.toString()) || 'pending'
      })),
      confirmationStatus: chatRoom.confirmationStatus,
      expiresAt: chatRoom.expiresAt
    }
  })
}