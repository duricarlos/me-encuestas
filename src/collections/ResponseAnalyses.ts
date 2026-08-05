import type { Access, CollectionConfig } from 'payload'

const ownedByUser: Access = ({ req }) => {
  if (!req.user?.id) return false

  return { user: { equals: req.user.id } }
}

export const ResponseAnalyses: CollectionConfig = {
  slug: 'response-analyses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'survey', 'status', 'createdAt'],
    description: 'Revisiones de respuestas guardadas por la IA para un usuario.',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ownedByUser,
    update: ownedByUser,
    delete: ownedByUser,
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => ({
        ...data,
        user: req.user?.id || data.user,
      }),
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'Usuario propietario de esta revisión.',
      },
    },
    {
      name: 'survey',
      type: 'relationship',
      relationTo: 'surveys',
      required: true,
      index: true,
    },
    {
      name: 'responses',
      type: 'relationship',
      relationTo: 'responses',
      hasMany: true,
      required: true,
      admin: {
        description: 'Respuestas que se utilizaron para generar esta revisión.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'analysis',
      type: 'textarea',
      required: true,
    },
    {
      name: 'recommendations',
      type: 'json',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'complete',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Completada', value: 'complete' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'mcp',
      options: [{ label: 'MCP', value: 'mcp' }],
    },
    {
      name: 'model',
      type: 'text',
      admin: {
        description: 'Modelo utilizado por el cliente MCP, si el cliente lo informa.',
      },
    },
  ],
  timestamps: true,
}
