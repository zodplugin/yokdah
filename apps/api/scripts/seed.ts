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

    // await createMatches(users, events)
    // console.log('Created matches and chat rooms')
    
    console.log('Note: Matches and chat rooms skipped due to circular dependency')
    console.log('Seed completed successfully!')
    process.exit(0)

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
      whatsappNumber: '081234567890',
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
      whatsappNumber: '081234567891',
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
      whatsappNumber: '081234567892',
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
      whatsappNumber: '081234567893',
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
      whatsappNumber: '081234567894',
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
  const cities = [
    'Amsterdam', 'Jakarta', 'Bandung', 'Depok', 'Surabaya', 'Bali',
    'Singapore', 'Tokyo', 'Seoul', 'Bangkok', 'London', 'Berlin', 'Barcelona', 'New York'
  ]

  const categories = ['concert', 'festival', 'activity', 'sport', 'party']

  const venues: Record<string, string[]> = {
    'Amsterdam': ['Johan Cruijff Arena', 'Paradiso', 'AFAS Live', 'Melkweg', 'Heineken Music Hall'],
    'Jakarta': ['Gelora Bung Karno', 'JIS', 'GBK', 'Tennis Indoor Senayan', 'Senayan City'],
    'Bandung': ['Stadion Siliwangi', 'JCC', 'GOR Saparua', 'Sabuga', 'Trans Studio'],
    'Depok': ['D\'Mall', 'Margo City', 'Cinere Bellevue', 'Lippo Cibubur', 'Pesona Square'],
    'Surabaya': ['GBA', 'Tunjungan Plaza', 'JX International', 'Delta Plaza', 'Graha Cakrawala'],
    'Bali': ['GWK Cultural Park', 'Hard Rock Cafe', 'Beach Club', 'Kuta Beach', 'Nusa Dua'],
    'Singapore': ['Marina Bay Sands', 'Esplanade', 'Singapore Indoor Stadium', 'Fort Canning', 'Sentosa'],
    'Tokyo': ['Tokyo Dome', 'Budokan', 'Zepp Tokyo', 'Yoyogi Park', 'Saitama Super Arena'],
    'Seoul': ['Olympic Park', 'Gangnam District', 'Hongdae', 'Jamsil Arena', 'COEX'],
    'Bangkok': ['RCA', 'Siam Paragon', 'Impact Arena', 'Terminal 21', 'Asiatique'],
    'London': ['O2 Arena', 'Wembley Stadium', 'Royal Albert Hall', 'Hyde Park', 'Brixton Academy'],
    'Berlin': ['Mercedes-Benz Arena', 'O2 World', 'Funkhaus', 'Berghain', 'Arena Berlin'],
    'Barcelona': ['Camp Nou', 'Sagrada Familia', 'Palau Sant Jordi', 'Razzmatazz', 'L\'Auditori'],
    'New York': ['Madison Square Garden', 'Barclays Center', 'Radio City', 'Brooklyn Steel', 'Carnegie Hall']
  }

  const eventTemplates = [
    {
      category: 'concert',
      titles: ['Summer Music Festival', 'Live Concert Night', 'Acoustic Evening', 'Rock Festival', 'Indie Night'],
      descriptions: [
        'Join us for the biggest music festival with top artists from around the world.',
        'Experience live performances from amazing local artists and bands.',
        'Intimate acoustic evening with talented musicians.',
        'Rock out with legendary bands and emerging artists.',
        'Discover new indie artists in this showcase event.'
      ]
    },
    {
      category: 'festival',
      titles: ['Electronic Music Festival', 'Street Food Festival', 'Art Festival', 'Cultural Celebration', 'Summer Carnival'],
      descriptions: [
        'Dance the night away to the best electronic beats from top DJs.',
        'Experience delicious street food from around the world.',
        'Explore contemporary art pieces from emerging artists.',
        'Celebrate diverse cultures with music, food, and art.',
        'Join the summer carnival with rides, games, and live performances.'
      ]
    },
    {
      category: 'activity',
      titles: ['Art Exhibition Opening', 'Museum Night', 'Book Launch', 'Workshop Session', 'Networking Event'],
      descriptions: [
        'Explore contemporary art pieces in this exclusive exhibition.',
        'Experience museums in a whole new light at night.',
        'Meet your favorite author at this book launch event.',
        'Learn new skills in this interactive workshop.',
        'Connect with professionals in your industry.'
      ]
    },
    {
      category: 'sport',
      titles: ['Football Championship', 'Basketball Tournament', 'Tennis Open', 'Marathon Race', 'Swimming Competition'],
      descriptions: [
        'Watch the championship finals live with top athletes.',
        'Exciting basketball tournament with teams from across the region.',
        'Professional tennis tournament featuring world-class players.',
        'Join the marathon race through the city streets.',
        'Competitive swimming competition with elite athletes.'
      ]
    }
  ]

  const events: any[] = []
  let eventIdCounter = 1

  const loketEvents = [
    {
      name: 'SCENTROPOLIS.JKT',
      venue: 'Chillax Sudirman',
      city: 'Jakarta',
      date: new Date('2026-04-11T10:00:00'),
      endTime: new Date('2026-04-12T20:00:00'),
      category: 'festival' as const,
      description: 'Experience the ultimate scent journey at SCENTROPOLIS.JKT. Discover fragrances from around the world and immerse yourself in the art of perfumery.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260316093448_69b76c485c567.jpg',
      ticketUrl: 'https://www.loket.com/event/scentropolis-jkt26'
    },
    {
      name: 'KONSER 30th Project Pop',
      venue: 'Tennis Indoor Senayan',
      city: 'Jakarta',
      date: new Date('2026-08-08T19:00:00'),
      endTime: new Date('2026-08-08T21:00:00'),
      category: 'concert' as const,
      description: 'Celebrate 30 years of Project Pop in this spectacular concert! Featuring all their greatest hits and special guests.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260310140535_69afc2bf08c80.jpeg',
      ticketUrl: 'https://www.loket.com/event/Konser30thProjectPop'
    },
    {
      name: 'Pestapora 2026',
      venue: 'JAKARTA',
      city: 'Jakarta',
      date: new Date('2026-09-25T15:00:00'),
      endTime: new Date('2026-09-27T23:59:00'),
      category: 'concert' as const,
      description: 'The biggest music festival is back! Pestapora 2026 brings you the best Indonesian and international artists.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260312180954_69b29f0232e5c.jpeg',
      ticketUrl: 'https://www.loket.com/event/pestapora-2026_kbgT'
    },
    {
      name: '2026 WOODZ WORLD TOUR \' Archive. 1 \' IN JAKARTA',
      venue: 'The Kasablanka',
      city: 'Jakarta',
      date: new Date('2026-05-09T19:00:00'),
      endTime: new Date('2026-05-09T21:00:00'),
      category: 'concert' as const,
      description: 'Experience WOODZ\'s 2026 World Tour \'Archive. 1\' live in Jakarta. A night of incredible music and performances.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260220203541_6998632d63fce.png',
      ticketUrl: 'https://www.loket.com/event/2026-woodz-world-tour-archive-1-in-jakarta_kDcDc'
    },
    {
      name: '2026 MONSTA X WORLD TOUR [THE X : NEXUS] IN JAKARTA',
      venue: 'THE KASABLANKA HALL',
      city: 'Jakarta',
      date: new Date('2026-04-18T19:00:00'),
      endTime: new Date('2026-04-18T22:00:00'),
      category: 'concert' as const,
      description: 'MONSTA X brings their 2026 World Tour \'THE X : NEXUS\' to Jakarta. Get ready for an unforgettable night!',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260204111225_6982c729f28af.jpeg',
      ticketUrl: 'https://www.loket.com/event/2026-monsta-x-world-tour-the-x-nexus_kbbl'
    },
    {
      name: 'Afgan - retrospektif The Concert 2026',
      venue: 'Plenary Hall JCC, Senayan',
      city: 'Jakarta',
      date: new Date('2026-07-18T13:00:00'),
      endTime: new Date('2026-07-18T22:00:00'),
      category: 'concert' as const,
      description: 'Join Afgan for retrospektif The Concert 2026 - an intimate evening of music reflecting on his journey.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260210115746_698abacae37c4.jpg',
      ticketUrl: 'https://www.loket.com/event/afganretrospektif'
    },
    {
      name: 'Interaksi Festival 2026',
      venue: 'Stadion Pakansari',
      city: 'Bogor',
      date: new Date('2026-07-25T15:00:00'),
      endTime: new Date('2026-07-25T23:00:00'),
      category: 'concert' as const,
      description: 'Interaksi Festival 2026 - A celebration of music, art, and community at Stadion Pakansari.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260309125156_69ae5ffc942dd.jpg',
      ticketUrl: 'https://www.loket.com/event/interaksifestival2026'
    },
    {
      name: 'WHISKY LIVE JAKARTA 2026',
      venue: 'Park Hyatt Jakarta',
      city: 'Jakarta',
      date: new Date('2026-04-11T13:00:00'),
      endTime: new Date('2026-04-12T23:00:00'),
      category: 'festival' as const,
      description: 'WHISKY LIVE JAKARTA 2026 - The premier whisky festival featuring rare and exclusive selections.',
      coverImage: 'https://assets.loket.com/neo/production/images/banner/20260112143208_6964a378608c8.png',
      ticketUrl: 'https://www.loket.com/event/whisky-live-jakarta-2026_kb1U1'
    }
  ]

  loketEvents.forEach((evt, index) => {
    events.push({
      ...evt,
      source: 'loket',
      sourceId: `loket-${index + 1}`,
      status: 'active'
    })
  })

  cities.forEach(city => {
    const cityVenues = venues[city] || ['City Venue']

    for (let day = 1; day <= 30; day++) {
      const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000)

      categories.forEach(category => {
        const template = eventTemplates.find(t => t.category === category)
        if (!template) return

        const randomTitle = template.titles[Math.floor(Math.random() * template.titles.length)]
        const randomDesc = template.descriptions[Math.floor(Math.random() * template.descriptions.length)]
        const randomVenue = cityVenues[Math.floor(Math.random() * cityVenues.length)]
        const duration = Math.floor(Math.random() * 5) + 3

        const event = {
          name: `${randomTitle} - ${city}`,
          venue: randomVenue,
          city: city,
          date: date,
          endTime: new Date(date.getTime() + duration * 60 * 60 * 1000),
          category: category,
          description: randomDesc,
          coverImage: `https://via.placeholder.com/800x400?text=${encodeURIComponent(city + '-' + category)}`,
          ticketUrl: `https://example.com/tickets/${city.toLowerCase()}-${eventIdCounter++}`,
          source: 'manual',
          sourceId: `manual-${eventIdCounter}`,
          status: 'active'
        }

        events.push(event)
      })
    }
  })

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
  const eventId = events[0]._id.toString()

  const match = new Match({
    eventId: eventId,
    memberIds: [users[0]._id, users[1]._id],
    status: 'matched'
  })
  await match.save()

  const chatRoom = new ChatRoom({
    eventId: eventId,
    matchId: match._id,
    memberIds: [users[0]._id, users[1]._id],
    confirmationStatus: new Map([
      [users[0]._id.toString(), 'going'],
      [users[1]._id.toString(), 'pending']
    ]),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  })
  await chatRoom.save()

  match.chatRoomId = chatRoom._id
  await match.save()

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
    content: 'Hey everyone! Looking forward to festival!',
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