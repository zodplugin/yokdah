import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { User } from '../src/models/User'
import { Event } from '../src/models/Event'
import { MatchRequest } from '../src/models/MatchRequest'
import { Match } from '../src/models/Match'
import { ChatRoom } from '../src/models/ChatRoom'
import { ChatMessage } from '../src/models/ChatMessage'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fomoin'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    await clearDatabase()
    console.log('Database cleared')

    const users = await createUsers()
    console.log(`Created ${users.length} users`)

    const events = await createEvents()
    console.log(`Created ${events.length} events`)

    const matchRequests = await createMatchRequests(users, events)
    console.log(`Created ${matchRequests.length} match requests`)

    await createMatches(users, events)
    console.log('Created matches and chat rooms')

    console.log('Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  await User.deleteMany({})
  await Event.deleteMany({})
  await MatchRequest.deleteMany({})
  await Match.deleteMany({})
  await ChatRoom.deleteMany({})
  await ChatMessage.deleteMany({})
}

async function createUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = [
    {
      email: 'alice@example.com',
      password: hashedPassword,
      displayName: 'Alice',
      age: 25,
      gender: 'female',
      photo: 'https://via.placeholder.com/400x400',
      vibeTags: ['chill', 'introvert-friendly', 'early bird'],
      genderPreference: 'any',
      ageMin: 20,
      ageMax: 35,
      defaultGroupSize: '1+1',
      reliabilityScore: 95,
      ratingAvg: 4.5,
      ratingCount: 5,
      isVerified: true,
      eventsAttended: 3,
      role: 'user'
    },
    {
      email: 'bob@example.com',
      password: hashedPassword,
      displayName: 'Bob',
      age: 28,
      gender: 'male',
      photo: 'https://via.placeholder.com/400x400',
      vibeTags: ['hype', 'social butterfly', 'night owl'],
      genderPreference: 'any',
      ageMin: 22,
      ageMax: 35,
      defaultGroupSize: '1+2',
      reliabilityScore: 90,
      ratingAvg: 4.2,
      ratingCount: 3,
      isVerified: false,
      eventsAttended: 2,
      role: 'user'
    },
    {
      email: 'charlie@example.com',
      password: hashedPassword,
      displayName: 'Charlie',
      age: 22,
      gender: 'male',
      photo: 'https://via.placeholder.com/400x400',
      vibeTags: ['chill', 'first-timer', 'regular'],
      genderPreference: 'female',
      ageMin: 18,
      ageMax: 30,
      defaultGroupSize: '1+1',
      reliabilityScore: 100,
      ratingAvg: 5.0,
      ratingCount: 8,
      isVerified: true,
      eventsAttended: 5,
      role: 'user'
    },
    {
      email: 'diana@example.com',
      password: hashedPassword,
      displayName: 'Diana',
      age: 26,
      gender: 'female',
      photo: 'https://via.placeholder.com/400x400',
      vibeTags: ['chill', 'hype', 'early bird'],
      genderPreference: 'any',
      ageMin: 21,
      ageMax: 35,
      defaultGroupSize: 'flexible',
      reliabilityScore: 85,
      ratingAvg: 3.8,
      ratingCount: 4,
      isVerified: true,
      eventsAttended: 4,
      role: 'user'
    },
    {
      email: 'admin@example.com',
      password: hashedPassword,
      displayName: 'Admin',
      age: 30,
      gender: 'male',
      vibeTags: ['chill'],
      genderPreference: 'any',
      ageMin: 18,
      ageMax: 50,
      defaultGroupSize: '1+1',
      reliabilityScore: 100,
      ratingAvg: 0,
      ratingCount: 0,
      isVerified: true,
      eventsAttended: 0,
      role: 'admin'
    }
  ]

  return await User.create(users)
}

async function createEvents() {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const events = [
    {
      name: 'Summer Music Festival',
      venue: 'City Park Arena',
      city: 'Amsterdam',
      date: nextWeek,
      endTime: new Date(nextWeek.getTime() + 6 * 60 * 60 * 1000),
      category: 'concert',
      description: 'Join us for the biggest summer music festival with top artists from around the world. Experience amazing performances, food vendors, and great vibes.',
      coverImage: 'https://via.placeholder.com/800x400',
      ticketUrl: 'https://example.com/tickets/summer-festival',
      source: 'manual',
      sourceId: 'manual-1',
      status: 'active'
    },
    {
      name: 'Electronic Night',
      venue: 'Club XYZ',
      city: 'Amsterdam',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      category: 'party',
      description: 'Dance the night away to the best electronic beats. Top DJs will be spinning until the early morning.',
      coverImage: 'https://via.placeholder.com/800x400',
      ticketUrl: 'https://example.com/tickets/electric-night',
      source: 'manual',
      sourceId: 'manual-2',
      status: 'active'
    },
    {
      name: 'Art Exhibition Opening',
      venue: 'Modern Art Gallery',
      city: 'London',
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      category: 'activity',
      description: 'Explore contemporary art pieces from emerging artists. Wine and snacks will be served during the opening night.',
      coverImage: 'https://via.placeholder.com/800x400',
      ticketUrl: 'https://example.com/tickets/art-exhibition',
      source: 'manual',
      sourceId: 'manual-3',
      status: 'active'
    },
    {
      name: 'Football Championship',
      venue: 'National Stadium',
      city: 'London',
      date: twoWeeks,
      endTime: new Date(twoWeeks.getTime() + 3 * 60 * 60 * 1000),
      category: 'sport',
      description: 'Watch the championship finals live! Get your tickets now for the most anticipated match of the season.',
      coverImage: 'https://via.placeholder.com/800x400',
      ticketUrl: 'https://example.com/tickets/football',
      source: 'manual',
      sourceId: 'manual-4',
      status: 'active'
    },
    {
      name: 'Jazz Night',
      venue: 'Blue Note Cafe',
      city: 'Jakarta',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      category: 'concert',
      description: 'Smooth jazz and good company. Join us for an intimate evening with local jazz musicians.',
      coverImage: 'https://via.placeholder.com/800x400',
      ticketUrl: 'https://example.com/tickets/jazz-night',
      source: 'manual',
      sourceId: 'manual-5',
      status: 'active'
    }
  ]

  return await Event.create(events)
}

async function createMatchRequests(users: any[], events: any[]) {
  const matchRequests = [
    {
      userId: users[0]._id,
      eventId: events[0]._id,
      groupSize: '1+2',
      genderPreference: 'any',
      ageMin: 20,
      ageMax: 30,
      vibeTags: ['chill', 'hype'],
      status: 'pending',
      priority: false
    },
    {
      userId: users[1]._id,
      eventId: events[0]._id,
      groupSize: '1+2',
      genderPreference: 'any',
      ageMin: 20,
      ageMax: 30,
      vibeTags: ['hype', 'social butterfly'],
      status: 'pending',
      priority: false
    },
    {
      userId: users[2]._id,
      eventId: events[1]._id,
      groupSize: '1+1',
      genderPreference: 'female',
      ageMin: 18,
      ageMax: 28,
      vibeTags: ['chill', 'hype'],
      status: 'pending',
      priority: false
    }
  ]

  return await MatchRequest.create(matchRequests)
}

async function createMatches(users: any[], events: any[]) {
  const chatRoom = new ChatRoom({
    eventId: events[0]._id,
    matchId: null,
    memberIds: [users[0]._id, users[1]._id],
    confirmationStatus: new Map([
      [users[0]._id.toString(), 'going'],
      [users[1]._id.toString(), 'pending']
    ]),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  })
  await chatRoom.save()

  const match = new Match({
    eventId: events[0]._id,
    memberIds: [users[0]._id, users[1]._id],
    chatRoomId: chatRoom._id,
    status: 'matched'
  })
  await match.save()

  chatRoom.matchId = match._id
  await chatRoom.save()

  const iceBreaker = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: 'system',
    type: 'system',
    systemMessageType: 'ice-breaker',
    content: `🎉 Your squad for ${events[0].name} is ready! Introduce yourselves and get excited!`,
    readBy: []
  })
  await iceBreaker.save()

  const message1 = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: users[0]._id,
    content: 'Hey everyone! Looking forward to the festival!',
    type: 'text',
    readBy: [users[0]._id]
  })
  await message1.save()

  const message2 = new ChatMessage({
    chatRoomId: chatRoom._id,
    senderId: users[1]._id,
    content: 'Same here! Anybody know which artists are performing?',
    type: 'text',
    readBy: [users[1]._id]
  })
  await message2.save()
}

seed()