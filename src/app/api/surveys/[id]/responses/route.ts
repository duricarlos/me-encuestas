import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import type { SurveyDefinition, SurveyQuestion } from '@/lib/surveys'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

type ResponsePayload = {
  answers?: Record<string, unknown>
  clientMetadata?: Record<string, unknown>
  durationMs?: number
  sessionId?: string
  startedAt?: string
}

const header = (requestHeaders: Headers, ...names: string[]) => {
  for (const name of names) {
    const value = requestHeaders.get(name)
    if (value) return value.split(',')[0].trim()
  }
  return undefined
}

const finiteNumber = (value: string | undefined) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

type IpGuideResponse = {
  location?: {
    city?: unknown
    country?: unknown
    timezone?: unknown
    latitude?: unknown
    longitude?: unknown
  }
}

type IpGuideMetadata = {
  city?: string
  country?: string
  timezone?: string
  latitude?: number
  longitude?: number
}

const safeString = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined)

const safeNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const lookupIpGuide = async (ip: string | undefined): Promise<IpGuideMetadata | undefined> => {
  if (!ip) return undefined

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2_500)

  try {
    const response = await fetch(`https://ip.guide/${encodeURIComponent(ip)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) return undefined

    const data = (await response.json()) as IpGuideResponse
    const location = data.location
    return {
      city: safeString(location?.city),
      country: safeString(location?.country),
      timezone: safeString(location?.timezone),
      latitude: safeNumber(location?.latitude),
      longitude: safeNumber(location?.longitude),
    }
  } catch {
    return undefined
  } finally {
    clearTimeout(timeout)
  }
}

const emptyAnswer = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

const validateAnswer = (question: SurveyQuestion, value: unknown) => {
  if (question.required && emptyAnswer(value)) return `Falta responder: ${question.label}`
  if (emptyAnswer(value)) return null

  if (question.type === 'email' && typeof value === 'string' && !/^\S+@\S+\.\S+$/.test(value)) {
    return `El valor de ${question.label} no parece un correo válido.`
  }

  if (question.type === 'multiple' && !Array.isArray(value)) {
    return `${question.label} debe contener una lista de opciones.`
  }

  if (question.type === 'multiple' && Array.isArray(value)) {
    const maxSelections = Math.max(1, question.maxSelections ?? 3)
    if (value.length > maxSelections) {
      return `${question.label} permite seleccionar como máximo ${maxSelections} opciones.`
    }
  }

  if (question.type === 'number' && !Number.isFinite(Number(value))) {
    return `${question.label} debe ser un número.`
  }

  return null
}

const validateAnswers = (definition: SurveyDefinition, answers: Record<string, unknown>) => {
  for (const question of definition.questions) {
    const error = validateAnswer(question, answers[question.id])
    if (error) return error
  }
  return null
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const payload = await getPayload({ config })

  let body: ResponsePayload
  try {
    body = (await request.json()) as ResponsePayload
  } catch {
    return NextResponse.json({ error: 'El cuerpo debe ser JSON válido.' }, { status: 400 })
  }

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}
  const clientMetadata =
    body.clientMetadata && typeof body.clientMetadata === 'object' ? body.clientMetadata : {}

  if (JSON.stringify(clientMetadata).length > 20_000) {
    return NextResponse.json({ error: 'Los metadatos enviados son demasiado grandes.' }, { status: 413 })
  }

  const surveyResult = await payload.find({
    collection: 'surveys',
    where: {
      and: [{ slug: { equals: id } }, { status: { equals: 'published' } }],
    },
    depth: 0,
    limit: 1,
    overrideAccess: false,
  })
  const survey = surveyResult.docs[0]

  if (!survey) {
    return NextResponse.json({ error: 'Encuesta no encontrada.' }, { status: 404 })
  }

  const definition = survey.definition as SurveyDefinition
  const validationError = validateAnswers(definition, answers)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 })
  }

  const requestHeaders = await headers()
  const clientIp = header(requestHeaders, 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip')
  const ipGuide = await lookupIpGuide(clientIp)
  const country = ipGuide?.country || header(requestHeaders, 'x-vercel-ip-country', 'cf-ipcountry')
  const region = header(requestHeaders, 'x-vercel-ip-country-region')
  const city = ipGuide?.city || header(requestHeaders, 'x-vercel-ip-city')
  const latitude = ipGuide?.latitude ?? finiteNumber(header(requestHeaders, 'x-vercel-ip-latitude'))
  const longitude = ipGuide?.longitude ?? finiteNumber(header(requestHeaders, 'x-vercel-ip-longitude'))
  const completedAt = new Date().toISOString()

  await payload.create({
    collection: 'responses',
    overrideAccess: true,
    data: {
      survey: survey.id,
      surveySlug: survey.slug,
      sessionId: body.sessionId || crypto.randomUUID(),
      answers,
      client: clientMetadata,
      server: {
        userAgent: header(requestHeaders, 'user-agent'),
        referer: header(requestHeaders, 'referer'),
        acceptedLanguage: header(requestHeaders, 'accept-language'),
        country,
        region,
        city,
        latitude,
        longitude,
        timezone: ipGuide?.timezone,
        geoSource: ipGuide ? 'ip.guide' : country || latitude || longitude ? 'provider-headers' : 'unavailable',
      },
      durationMs:
        typeof body.durationMs === 'number' && Number.isFinite(body.durationMs)
          ? Math.max(0, Math.round(body.durationMs))
          : undefined,
      startedAt: body.startedAt,
      completedAt,
      country,
      region,
      city,
    },
  })

  return NextResponse.json({ ok: true })
}
