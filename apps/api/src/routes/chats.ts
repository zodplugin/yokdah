import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { ChatRoom } from '../models/ChatRoom'
import { ChatMessage } from '../models/ChatMessage'
import { Match } from '../models/Match'
import { uploadToR2 } from '../utils/storage'
import { User } from '../models/User'
import { io } from '../config/socket'
import mongoose from 'mongoose'

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
      .populate({
        path: 'replyToId',
        select: 'content senderId type photoUrl',
        populate: { path: 'senderId', select: 'displayName' }
      })

    if (!before && messages.length > 0) {
      chatRoom.lastRead.set(request.user.userId, new Date())
      await chatRoom.save()
    }

    return { messages: messages.reverse() }
  })

  fastify.post('/:chatRoomId/messages', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId } = request.params
    const { content, photoUrl, replyToId } = request.body

    const mongoose = require('mongoose');
    let validReplyToId = replyToId;
    if (replyToId && !mongoose.Types.ObjectId.isValid(replyToId)) {
       validReplyToId = undefined;
    }

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
      replyToId: validReplyToId,
      type: photoUrl ? 'photo' : 'text',
      readBy: [request.user.userId]
    })

    await message.save()

    // Push Notification
    const otherMemberIds = chatRoom.memberIds.filter(id => id.toString() !== request.user.userId.toString())
    if (otherMemberIds.length > 0) {
      const { sendPushNotification } = require('../services/OneSignalService')
      const sender = await User.findById(request.user.userId)
      const Event = mongoose.model('Event')
      const event = await Event.findById(chatRoom.eventId)
      
      sendPushNotification(
        otherMemberIds.map(id => id.toString()),
        event?.name || 'New Message',
        `${sender?.displayName || 'Someone'}: ${content || '📷 Photo'}`,
        { chatId: chatRoomId, matchId: chatRoom.matchId }
      ).catch((err: any) => console.error('Push Error:', err))
    }

    return message
  })

  fastify.post('/:chatRoomId/messages/:messageId/pin', {
    onRequest: [authenticate]
  }, async (request: any, reply) => {
    const { chatRoomId, messageId } = request.params

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return reply.code(400).send({ error: 'Invalid message ID' })
    }

    const chatRoom = await ChatRoom.findById(chatRoomId)
    if (!chatRoom || !chatRoom.memberIds.includes(request.user.userId)) {
      return reply.code(403).send({ error: 'Access denied' })
    }

    const message = await ChatMessage.findById(messageId);
    if (!message || message.chatRoomId !== chatRoomId) {
      return reply.code(404).send({ error: 'Message not found' })
    }

    const previousPinnedId = chatRoom.pinnedMessageId;
    
    if (previousPinnedId === messageId) {
      // Unpin
      chatRoom.pinnedMessageId = undefined;
      message.isPinned = false;
      await message.save();
    } else {
      // Pin new one
      if (previousPinnedId) {
        await ChatMessage.findByIdAndUpdate(previousPinnedId, { isPinned: false });
      }
      chatRoom.pinnedMessageId = messageId;
      message.isPinned = true;
      await message.save();
    }
    
    await chatRoom.save();

    if (io) {
      const chatRoomPopulated = await ChatRoom.findById(chatRoomId).populate('pinnedMessageId');
      
      io.to(`chat:${chatRoomId}`).emit('message-pinned', {
        messageId: chatRoom.pinnedMessageId || null,
        pinnedMessage: chatRoom.pinnedMessageId ? message : null,
        chatRoomId
      });
      
      chatRoom.memberIds.forEach((memberId: string) => {
        if (memberId !== request.user.userId) {
          io.to(`user:${memberId}`).emit('global-message-pinned', {
             messageId: chatRoom.pinnedMessageId || null,
             chatRoomId
          });
        }
      });
    }

    return { success: true, pinnedMessageId: chatRoom.pinnedMessageId }
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

    if (!['going', 'cant_go'].includes(status)) {
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

    const currentUser = await User.findById(request.user.userId);
    const displayName = currentUser?.displayName || 'Unknown';

    if (io) {
      const payload = {
        userId: request.user.userId,
        userName: displayName,
        status,
        chatId: chatRoomId,
        matchId: chatRoom.matchId
      };
      io.to(`chat:${chatRoomId}`).emit('confirmation_update', payload);

      const Event = mongoose.model('Event');
      const event = await Event.findById(chatRoom.eventId);

      chatRoom.memberIds.forEach((memberId: string) => {
        if (memberId !== request.user.userId.toString()) {
          io.to(`user:${memberId}`).emit('global-confirmation_update', payload);
          // Also emit as a new message so it shows up as a toast/notification
          io.to(`user:${memberId}`).emit('global-new-message', {
            chatId: chatRoomId,
            message: `${displayName} is ${status === 'going' ? 'confirmed' : 'unable to go'}.`,
            senderId: 'system',
            senderName: 'System',
            eventName: event?.name || 'Squad',
            matchId: chatRoom.matchId,
            timestamp: new Date()
          });
        }
      });
    }

    if (status === 'going') {
      let allGoing = true;
      for (const memberId of chatRoom.memberIds) {
        if (chatRoom.confirmationStatus.get(memberId.toString()) !== 'going') {
          allGoing = false;
          break;
        }
      }

      if (allGoing && chatRoom.memberIds.length > 0) {
        const match = await Match.findOne({ chatRoomId });
        if (match && match.status !== 'confirmed') {
          match.status = 'confirmed';
          await match.save();
        }

        const sysMessage = new ChatMessage({
          chatRoomId,
          content: 'Squad confirmed! See you all there! 🎉',
          type: 'system',
          senderId: 'system',
          readBy: [request.user.userId]
        })
        await sysMessage.save();

        if (io) {
          const Event = mongoose.model('Event');
          const event = await Event.findById(chatRoom.eventId);
          const sysPayload = {
             _id: sysMessage._id,
             chatId: chatRoomId,
             message: sysMessage.content,
             senderId: 'system',
             senderName: 'System',
             eventName: event?.name || 'Squad',
             matchId: chatRoom.matchId,
             timestamp: sysMessage.createdAt
          };
          io.to(`chat:${chatRoomId}`).emit('new-message', sysPayload);
          chatRoom.memberIds.forEach((memberId: string) => {
            if (memberId !== request.user.userId.toString()) {
              io.to(`user:${memberId}`).emit('global-new-message', sysPayload);
            }
          });
        }
      }
    } else if (status === 'cant_go') {
        const sysMessage = new ChatMessage({
          chatRoomId,
          content: `${displayName} can't make it.`,
          type: 'system',
          senderId: 'system',
          systemMessageType: 'member-leave',
          readBy: [request.user.userId]
        })
        await sysMessage.save();

        // Update Match and MatchRequest
        const MatchRequest = mongoose.model('MatchRequest');
        const match = await Match.findOne({ chatRoomId });
        
        if (match) {
          // Remove from memberIds in both Match and ChatRoom
          match.memberIds = match.memberIds.filter(id => id !== request.user.userId.toString());
          if (match.memberIds.length === 0) {
            match.status = 'cancelled';
          }
          await match.save();

          chatRoom.memberIds = chatRoom.memberIds.filter(id => id !== request.user.userId.toString());
          await chatRoom.save();

          // Reset MatchRequest to pending so they can match again
          await MatchRequest.updateOne(
            { userId: request.user.userId, eventId: match.eventId, status: { $in: ['matched', 'confirmed'] } },
            { $set: { status: 'pending' } }
          );
        }

        if (io) {
          const Event = mongoose.model('Event');
          const event = await Event.findById(chatRoom.eventId);
          const sysPayload = {
             _id: sysMessage._id,
             chatId: chatRoomId,
             message: sysMessage.content,
             senderId: 'system',
             senderName: 'System',
             eventName: event?.name || 'Squad',
             matchId: chatRoom.matchId,
             timestamp: sysMessage.createdAt
          };
          io.to(`chat:${chatRoomId}`).emit('new-message', sysPayload);
          io.to(`chat:${chatRoomId}`).emit('member_left', {
            userId: request.user.userId,
            userName: displayName,
            matchId: chatRoom.matchId
          });

          chatRoom.memberIds.forEach((memberId: string) => {
            if (memberId !== request.user.userId.toString()) {
              io.to(`user:${memberId}`).emit('global-new-message', sysPayload);
              io.to(`user:${memberId}`).emit('global-member_left', {
                userId: request.user.userId,
                userName: displayName,
                chatId: chatRoomId,
                matchId: chatRoom.matchId
              });
            }
          });
          
          // Push Notification
          const { sendPushNotification } = require('../services/OneSignalService')
          sendPushNotification(
            chatRoom.memberIds.filter(id => id.toString() !== request.user.userId.toString()),
            event?.name || 'Squad Update',
            `${displayName} is ${status === 'going' ? 'confirmed' : 'unable to go'}.`,
            { chatId: chatRoomId, matchId: chatRoom.matchId }
          ).catch((err: any) => console.error('Push Error:', err))
        }
    }

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