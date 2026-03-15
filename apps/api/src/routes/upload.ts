import { FastifyInstance } from 'fastify'
import { uploadFile } from '../utils/storage'

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', async (request: any, reply) => {
    try {
      const data = await request.file()

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed' })
      }

      const maxSize = 5 * 1024 * 1024
      if (data.file.bytesRead > maxSize) {
        return reply.code(400).send({ error: 'File size exceeds 5MB limit' })
      }

      const buffer = await data.toBuffer()
      const fileName = `${Date.now()}-${data.filename}`

      const url = await uploadFile(buffer, fileName, data.mimetype)

      return { url }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: 'Failed to upload file' })
    }
  })
}
