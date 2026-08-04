import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const definition = JSON.parse(
  await fs.readFile(path.resolve(dirname, '../content/demo-survey.json'), 'utf8'),
)

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'surveys',
  where: { slug: { equals: definition.slug } },
  limit: 1,
  overrideAccess: true,
})

if (existing.docs[0]) {
  await payload.update({
    collection: 'surveys',
    id: existing.docs[0].id,
    data: {
      name: definition.name,
      slug: definition.slug,
      status: 'published',
      definition: definition.definition,
    },
    overrideAccess: true,
  })
  console.log(`Encuesta actualizada: /${definition.slug}`)
} else {
  await payload.create({
    collection: 'surveys',
    data: {
      name: definition.name,
      slug: definition.slug,
      status: 'published',
      definition: definition.definition,
    },
    overrideAccess: true,
  })
  console.log(`Encuesta creada: /${definition.slug}`)
}

process.exit(0)
