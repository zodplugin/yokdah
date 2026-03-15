import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import ImageKit from 'imagekit'
import * as fs from 'fs'
import * as path from 'path'

const provider = process.env.STORAGE_PROVIDER || 'local'

let s3Client: S3Client | null = null
let imagekit: ImageKit | null = null

if (provider === 's3' || provider === 'r2') {
  const endpoint = process.env.R2_ENDPOINT

  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    ...(endpoint && { endpoint: new URL(endpoint) }),
    forcePathStyle: !!endpoint
  })
}

if (provider === 'imagekit') {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
  })
}

const uploadPath = process.env.UPLOAD_PATH || './uploads'
if (provider === 'local' && !fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `${Date.now()}-${filename}`

  if (provider === 'local') {
    const filePath = path.join(uploadPath, key)
    fs.writeFileSync(filePath, file)
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    return `${baseUrl}/uploads/${key}`
  }

  if ((provider === 's3' || provider === 'r2') && s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || 'fomoin-uploads'
    const endpoint = process.env.R2_ENDPOINT

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType
    })

    await s3Client.send(command)

    if (endpoint) {
      const url = new URL(key, endpoint).toString()
      return url
    }

    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`
  }

  if (provider === 'imagekit' && imagekit) {
    const result = await imagekit.upload({
      file: file.toString('base64'),
      fileName: key,
      folder: 'uploads'
    })
    return result.url
  }

  throw new Error(`Unknown storage provider: ${provider}`)
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (provider === 'local') {
    const baseUrl = process.env.API_URL || 'http://localhost:3001'
    return `${baseUrl}/uploads/${key}`
  }

  if ((provider === 's3' || provider === 'r2') && s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || 'fomoin-uploads'
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  if (provider === 'imagekit') {
    const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || ''
    return `${baseUrl}${key}`
  }

  throw new Error(`Unknown storage provider: ${provider}`)
}

export async function deleteFile(key: string): Promise<void> {
  if (provider === 'local') {
    const filePath = path.join(uploadPath, key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return
  }

  if ((provider === 's3' || provider === 'r2') && s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || 'fomoin-uploads'
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    })

    await s3Client.send(command)
    return
  }

  if (provider === 'imagekit' && imagekit) {
    await imagekit.deleteFile(key)
    return
  }

  throw new Error(`Unknown storage provider: ${provider}`)
}

export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  return uploadFile(file, filename, contentType)
}

export async function deleteFromR2(key: string): Promise<void> {
  return deleteFile(key)
}