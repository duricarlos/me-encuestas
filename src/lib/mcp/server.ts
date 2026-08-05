import { McpServer } from '@modelcontextprotocol/server'
import { getPayload } from 'payload'
import { z } from 'zod'

import config from '../../payload.config'

export type McpUser = {
  id: number
  email?: string
  name?: string
  role?: 'admin' | 'editor'
}

type SurveyDocument = {
  id: number
  name: string
  slug: string
  definition?: {
    questions?: Array<{
      id?: string
      type?: string
      label?: string
      description?: string
      options?: unknown
    }>
  }
}

type ResponseDocument = {
  id: number
  answers?: Record<string, unknown>
  completedAt?: string
  durationMs?: number
}

const textResult = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})

const errorResult = (message: string) => ({
  isError: true,
  content: [{ type: 'text' as const, text: message }],
})

const getPayloadInstance = () => getPayload({ config })

const canReadAllSurveys = (user: McpUser) => user.role === 'admin'

const findAccessibleSurvey = async (user: McpUser, slug: string) => {
  const payload = await getPayloadInstance()
  const result = await payload.find({
    collection: 'surveys',
    where: canReadAllSurveys(user)
      ? { slug: { equals: slug } }
      : { and: [{ owner: { equals: user.id } }, { slug: { equals: slug } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  return { payload, survey: result.docs[0] as SurveyDocument | undefined }
}

const redactAnswers = (
  answers: Record<string, unknown> | undefined,
  survey: SurveyDocument,
) => {
  const emailQuestionIds = new Set(
    (survey.definition?.questions || [])
      .filter((question) => question.type === 'email' && question.id)
      .map((question) => question.id as string),
  )

  return Object.fromEntries(
    Object.entries(answers || {}).filter(([questionId]) => !emailQuestionIds.has(questionId)),
  )
}

export const createMcpServer = (user: McpUser) => {
  const server = new McpServer(
    { name: 'me-encuestas', version: '0.1.0' },
    {
      instructions:
        'Revisa encuestas accesibles para el usuario autenticado. Los editores solo pueden revisar sus propias encuestas; los administradores también pueden revisar encuestas legacy sin propietario. Antes de revisar respuestas, identifica la encuesta con list_surveys y usa get_survey_responses. Los correos y otros campos de tipo email se omiten por privacidad.',
    },
  )

  server.registerTool(
    'list_surveys',
    {
      title: 'Listar encuestas del usuario',
      description:
        'Devuelve las encuestas asignadas al usuario autenticado. Un administrador también puede ver encuestas legacy sin propietario.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const payload = await getPayloadInstance()
      const result = await payload.find({
        collection: 'surveys',
        ...(canReadAllSurveys(user) ? {} : { where: { owner: { equals: user.id } } }),
        depth: 0,
        limit: 100,
        sort: '-updatedAt',
        overrideAccess: true,
      })

      return textResult(
        result.docs.map((survey) => {
          const item = survey as SurveyDocument & { status?: string }
          return {
            id: String(item.id),
            name: item.name,
            slug: item.slug,
            status: item.status,
            url: `/${item.slug}`,
          }
        }),
      )
    },
  )

  server.registerTool(
    'get_survey_responses',
    {
      title: 'Consultar respuestas de una encuesta',
      description:
        'Devuelve respuestas anonimizadas de una encuesta accesible para el usuario. No incluye campos de tipo email ni metadatos técnicos.',
      inputSchema: z.object({
        slug: z.string().min(1).describe('Slug público de la encuesta.'),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ slug, limit }) => {
      const { payload, survey } = await findAccessibleSurvey(user, slug)
      if (!survey) return errorResult('La encuesta no existe o no es accesible para el usuario autenticado.')

      const result = await payload.find({
        collection: 'responses',
        where: { survey: { equals: survey.id } },
        depth: 0,
        limit,
        sort: '-completedAt',
        overrideAccess: true,
      })

      return textResult({
        survey: { name: survey.name, slug: survey.slug },
        questions: (survey.definition?.questions || []).map((question) => ({
          id: question.id,
          type: question.type,
          label: question.label,
          description: question.description,
          options: question.options,
        })),
        total: result.totalDocs,
        returned: result.docs.length,
        responses: result.docs.map((response) => {
          const item = response as ResponseDocument
          return {
            id: String(item.id),
            completedAt: item.completedAt,
            durationMs: item.durationMs,
            answers: redactAnswers(item.answers, survey),
          }
        }),
      })
    },
  )

  server.registerTool(
    'save_response_analysis',
    {
      title: 'Guardar revisión de respuestas',
      description:
        'Guarda el análisis generado por la IA en la colección response-analyses, enlazado al usuario autenticado, a la encuesta y a las respuestas revisadas.',
      inputSchema: z.object({
        slug: z.string().min(1),
        responseIds: z.array(z.string().min(1)).min(1).max(100),
        title: z.string().min(1).max(160),
        summary: z.string().min(1).max(5000),
        analysis: z.string().min(1).max(30000),
        recommendations: z.array(z.string().min(1).max(1000)).max(20).default([]),
        model: z.string().max(120).optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ slug, responseIds, title, summary, analysis, recommendations, model }) => {
      const { payload, survey } = await findAccessibleSurvey(user, slug)
      if (!survey) return errorResult('La encuesta no existe o no es accesible para el usuario autenticado.')

      const uniqueResponseIds = [...new Set(responseIds)]
      const numericResponseIds = uniqueResponseIds.map(Number)
      if (numericResponseIds.some((id) => !Number.isSafeInteger(id))) {
        return errorResult('Los IDs de respuesta deben ser numéricos.')
      }

      const responses = await payload.find({
        collection: 'responses',
        where: {
          and: [
            { survey: { equals: survey.id } },
            { id: { in: numericResponseIds } },
          ],
        },
        depth: 0,
        limit: uniqueResponseIds.length,
        overrideAccess: true,
      })

      if (responses.docs.length !== uniqueResponseIds.length) {
        return errorResult('Una o más respuestas no pertenecen a la encuesta indicada.')
      }

      const created = await payload.create({
        collection: 'response-analyses',
        overrideAccess: true,
        data: {
          title,
          user: user.id,
          survey: survey.id,
          responses: responses.docs.map((response) => response.id),
          summary,
          analysis,
          recommendations,
          status: 'complete',
          source: 'mcp',
          model,
        },
      })

      return textResult({
        id: String(created.id),
        message: 'Revisión guardada en response-analyses.',
        title,
      })
    },
  )

  return server
}

export const authenticateMcpRequest = async (request: Request) => {
  const payload = await getPayloadInstance()
  const { user } = await payload.auth({
    headers: request.headers,
    canSetHeaders: false,
  })

  if (!user || typeof user !== 'object' || !('id' in user)) return null

  const candidate = user as {
    id?: unknown
    email?: unknown
    name?: unknown
    role?: unknown
  }
  if (typeof candidate.id !== 'string' && typeof candidate.id !== 'number') return null
  const userId = typeof candidate.id === 'number' ? candidate.id : Number(candidate.id)
  if (!Number.isSafeInteger(userId)) return null

  return {
    payload,
    user: {
      id: userId,
      ...(typeof candidate.email === 'string' ? { email: candidate.email } : {}),
      ...(typeof candidate.name === 'string' ? { name: candidate.name } : {}),
      ...(candidate.role === 'admin' || candidate.role === 'editor'
        ? { role: candidate.role }
        : {}),
    } satisfies McpUser,
  }
}
