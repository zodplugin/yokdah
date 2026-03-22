import { io, Socket } from 'socket.io-client'

class SocketClient {
  private socket: any = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket && this.socket.connected && this.token === token) {
      return; 
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    this.token = token
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  joinChat(chatId: string) {
    this.emit('join-chat', chatId)
  }

  leaveChat(chatId: string) {
    this.emit('leave-chat', chatId)
  }

  sendMessage(chatId: string, message: string, photoUrl?: string, replyTo?: any, _id?: string) {
    this.emit('send-message', { chatId, message, photoUrl, replyTo, _id })
  }

  startTyping(chatId: string) {
    this.emit('typing-start', { chatId })
  }

  stopTyping(chatId: string) {
    this.emit('typing-stop', { chatId })
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

const socket = new SocketClient()

export default socket