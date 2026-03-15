import { Queue, Worker } from 'bullmq'

let connection: any = null
let matchQueue: Queue | null = null
let notificationQueue: Queue | null = null
let eventQueue: Queue | null = null

const redisEnabled = process.env.REDIS_ENABLED !== 'false'

if (redisEnabled && process.env.REDIS_URI) {
  try {
    const Redis = require('ioredis')
    connection = new Redis(process.env.REDIS_URI, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      tls: {
        rejectUnauthorized: false,
        servername: null
      },
      keepAlive: 30000,
      connectTimeout: 10000,
      lazyConnect: false
    })

    connection.on('connect', () => {
      console.log('✓ Redis connected successfully')
    })

    connection.on('ready', () => {
      console.log('✓ Redis ready')
    })

    connection.on('reconnecting', () => {
      console.log('⚠ Redis reconnecting...')
    })

    connection.on('error', (error: any) => {
      if (error.message !== 'Connection is closed.' && error.message !== 'Stream connection ended' && error.message !== 'read ECONNRESET') {
        console.log('✗ Redis connection error:', error.message)
      }
    })

    connection.on('close', () => {
      console.log('⚠ Redis connection closed')
    })

    matchQueue = new Queue('match-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })

    notificationQueue = new Queue('notification-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })

    eventQueue = new Queue('event-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })

    console.log('✓ Redis queues initialized')
  } catch (error) {
    console.log('✗ Redis setup failed, running without queues:', error)
    connection = null
  }
} else {
  console.log('⚠ Redis is disabled, running without queues')
}

export { matchQueue, notificationQueue, eventQueue }

export function getRedisConnection() {
  return connection
}

export function setupQueue() {
  if (!connection) {
    console.log('Redis not available, queue workers not started')
    return
  }

  new Worker('match-queue', async (job) => {
    const { eventId } = job.data
    const { runMatching } = await import('../services/matchingService')
    await runMatching(eventId)
  }, { connection })

  new Worker('notification-queue', async (job) => {
    const { type, data } = job.data
    const { sendNotification } = await import('../services/notificationService')
    await sendNotification(type, data)
  }, { connection })

  new Worker('event-queue', async (job) => {
    const { type } = job.data
    const { scrapeEvents } = await import('../services/eventService')
    await scrapeEvents()
  }, { connection })
}

export async function addMatchJob(eventId: string) {
  if (matchQueue) {
    await matchQueue.add('run-matching', { eventId }, { delay: 30000 })
  } else {
    const { runMatching } = await import('../services/matchingService')
    setTimeout(() => runMatching(eventId), 30000)
  }
}

export async function addNotificationJob(type: string, data: any) {
  if (notificationQueue) {
    await notificationQueue.add('send-notification', { type, data })
  } else {
    const { sendNotification } = await import('../services/notificationService')
    await sendNotification(type, data)
  }
}

export async function addEventJob(type: string) {
  if (eventQueue) {
    await eventQueue.add('scrape-events', { type })
  } else {
    const { scrapeEvents } = await import('../services/eventService')
    await scrapeEvents()
  }
}