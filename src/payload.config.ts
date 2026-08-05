import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Responses } from './collections/Responses'
import { ResponseAnalyses } from './collections/ResponseAnalyses'
import { Surveys } from './collections/Surveys'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const appURL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
const allowedOrigins = Array.from(
  new Set([
    appURL,
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
        ]),
  ]),
)
const databaseURLs = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL_NON_POOLING,
].filter((value): value is string => Boolean(value))
const isHostedProduction = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production'
const isLocalDatabaseURL = (value: string) => {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname)
  } catch {
    return false
  }
}
const databaseURL = isHostedProduction
  ? databaseURLs.find((value) => !isLocalDatabaseURL(value))
  : databaseURLs[0] || 'postgresql://postgres:postgres@localhost:5432/me_encuestas'

if (isHostedProduction && !databaseURL) {
  throw new Error(
    'No hay una URL de Postgres remota configurada. Define DATABASE_URL (o POSTGRES_URL) en producción; localhost no está disponible desde Vercel.',
  )
}

export default buildConfig({
  serverURL: appURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Surveys, Responses, ResponseAnalyses],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'local-development-secret-change-me',
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  cors: allowedOrigins,
  csrf: allowedOrigins,
})
