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
      connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/me_encuestas',
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  cors: allowedOrigins,
  csrf: allowedOrigins,
})
