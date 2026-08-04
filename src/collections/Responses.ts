import type { CollectionConfig } from 'payload'

export const Responses: CollectionConfig = {
  slug: 'responses',
  admin: {
    useAsTitle: 'surveySlug',
    defaultColumns: ['surveySlug', 'sessionId', 'completedAt', 'country'],
    description: 'Respuestas recibidas junto con contexto técnico y geográfico aproximado, sin almacenar la IP.',
  },
  access: {
    // Las respuestas entran exclusivamente por la ruta de servidor propia, que valida el JSON.
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'survey',
      type: 'relationship',
      relationTo: 'surveys',
      required: true,
      index: true,
    },
    {
      name: 'surveySlug',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'answers',
      type: 'json',
      required: true,
    },
    {
      name: 'client',
      type: 'json',
      admin: {
        description: 'Metadatos del navegador disponibles sin solicitar permisos.',
      },
    },
    {
      name: 'server',
      type: 'json',
      admin: {
        description: 'Metadatos derivados de la petición y de ip.guide. La IP no se almacena.',
      },
    },
    {
      name: 'durationMs',
      type: 'number',
    },
    {
      name: 'startedAt',
      type: 'date',
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'country',
      type: 'text',
      index: true,
    },
    {
      name: 'region',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
    },
  ],
  timestamps: true,
}
