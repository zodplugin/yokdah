export async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (error) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

export async function requireAdmin(request: any, reply: any) {
  try {
    await request.jwtVerify()
    
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden - Admin access required' })
    }
  } catch (error) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}