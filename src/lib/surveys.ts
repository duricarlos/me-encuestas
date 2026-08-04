import { getPayload } from 'payload'

import config from '@payload-config'

export type SurveyOption = {
  label: string
  value: string
}

export type SurveyQuestion = {
  id: string
  type: 'text' | 'textarea' | 'email' | 'number' | 'date' | 'single' | 'multiple' | 'rating' | 'boolean'
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  options?: SurveyOption[]
  min?: number
  max?: number
  maxSelections?: number
}

export type SurveyDefinition = {
  version?: number
  intro?: {
    eyebrow?: string
    title?: string
    description?: string
    buttonLabel?: string
  }
  questions: SurveyQuestion[]
  thankYou?: {
    eyebrow?: string
    title?: string
    description?: string
    buttonLabel?: string
  }
  capture?: {
    clientContext?: boolean
  }
}

export type PublicSurvey = {
  id: string
  name: string
  slug: string
  definition: SurveyDefinition
}

export async function getSurveyBySlug(slug: string): Promise<PublicSurvey | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'surveys',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    depth: 0,
    limit: 1,
    overrideAccess: false,
  })

  const survey = result.docs[0]
  if (!survey || !survey.definition || typeof survey.definition !== 'object') return null

  return {
    id: String(survey.id),
    name: survey.name,
    slug: survey.slug,
    definition: survey.definition as SurveyDefinition,
  }
}
