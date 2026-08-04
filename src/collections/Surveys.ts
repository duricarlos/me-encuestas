import type { CollectionConfig } from 'payload'

const isDefinition = (value: unknown): value is { questions: unknown[] } => {
  if (!value || typeof value !== 'object') return false
  const definition = value as { questions?: unknown }
  return Array.isArray(definition.questions) && definition.questions.length > 0
}

export const Surveys: CollectionConfig = {
  slug: 'surveys',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'updatedAt'],
    description: 'Cada encuesta se define en JSON y se publica en /[slug].',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => {
      if (req.user) return true
      return { status: { equals: 'published' } }
    },
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nombre interno para localizarla en Payload.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Identificador público usado en /[slug]. Solo letras, números y guiones.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicada', value: 'published' },
        { label: 'Archivada', value: 'archived' },
      ],
    },
    {
      name: 'definition',
      type: 'json',
      required: true,
      admin: {
        description:
          'Pega aquí el JSON completo. Debe incluir un array questions con al menos una pregunta.',
      },
      validate: (value) =>
        isDefinition(value) || 'La definición debe ser un objeto JSON con questions[].',
    },
  ],
  timestamps: true,
}
