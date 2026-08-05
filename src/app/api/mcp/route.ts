import { createMcpHandler } from '@modelcontextprotocol/server'

import { authenticateMcpRequest, createMcpServer } from '../../../lib/mcp/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const unauthorized = () =>
  Response.json(
    { error: 'Autenticación requerida. Usa la sesión, el JWT o la API key de Payload.' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    },
  )

const handleMcp = async (request: Request) => {
  let authenticated

  try {
    authenticated = await authenticateMcpRequest(request)
  } catch {
    return unauthorized()
  }

  if (!authenticated) return unauthorized()

  const handler = createMcpHandler(
    () => createMcpServer(authenticated.user),
    { responseMode: 'auto' },
  )

  return handler.fetch(request)
}

export async function POST(request: Request) {
  return handleMcp(request)
}

export async function GET(request: Request) {
  return handleMcp(request)
}

export async function DELETE(request: Request) {
  return handleMcp(request)
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, DELETE, OPTIONS',
    },
  })
}
