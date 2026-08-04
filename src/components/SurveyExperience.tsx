'use client'

import type { FormEvent } from 'react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { PublicSurvey, SurveyQuestion } from '@/lib/surveys'

type SurveyExperienceProps = {
  survey: PublicSurvey
}

type Phase = 'intro' | 'questions' | 'success'

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const getSessionId = () => {
  if (typeof window === 'undefined') return ''
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const collectClientContext = () => {
  if (typeof window === 'undefined') return {}

  const browserNavigator = navigator as Navigator & {
    connection?: {
      downlink?: number
      effectiveType?: string
      rtt?: number
      saveData?: boolean
    }
    deviceMemory?: number
    userAgentData?: {
      brands?: Array<{ brand: string; version: string }>
      mobile?: boolean
      platform?: string
    }
  }
  const connection = browserNavigator.connection
  const userAgentData = browserNavigator.userAgentData

  return {
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    userAgentData: userAgentData
      ? {
          brands: userAgentData.brands,
          mobile: userAgentData.mobile,
          platform: userAgentData.platform,
        }
      : undefined,
    language: navigator.language,
    languages: navigator.languages,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelDepth: window.screen.pixelDepth,
      colorDepth: window.screen.colorDepth,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    touchPoints: navigator.maxTouchPoints,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: browserNavigator.deviceMemory,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    online: navigator.onLine,
    referrer: document.referrer || undefined,
    landingUrl: window.location.href,
    connection: connection
      ? {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }
      : undefined,
  }
}

const optionsFor = (question: SurveyQuestion) => {
  if (question.options?.length) return question.options
  if (question.type === 'boolean') {
    return [
      { label: 'Sí', value: 'yes' },
      { label: 'No', value: 'no' },
    ]
  }
  return []
}

export function SurveyExperience({ survey }: SurveyExperienceProps) {
  const questions = survey.definition.questions
  const intro = survey.definition.intro
  const thankYou = survey.definition.thankYou
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sessionId] = useState(getSessionId)
  const [startedAt] = useState(() => new Date().toISOString())
  const [clientMetadata] = useState<Record<string, unknown>>(collectClientContext)

  const question = questions[currentIndex]
  const multipleMaxSelections =
    question.type === 'multiple' ? Math.max(1, question.maxSelections ?? 3) : undefined
  const selectedMultipleValues = stringArray(answers[question.id])
  const multipleLimitReached =
    multipleMaxSelections !== undefined && selectedMultipleValues.length >= multipleMaxSelections
  const progress = useMemo(
    () => (questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0),
    [currentIndex, questions.length],
  )

  const setAnswer = (value: unknown) => {
    setAnswers((current) => ({ ...current, [question.id]: value }))
    setError('')
  }

  const sendResponse = async () => {
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/surveys/${encodeURIComponent(survey.slug)}/responses`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers,
          clientMetadata,
          durationMs: Date.now() - new Date(startedAt).getTime(),
          sessionId: sessionId || getSessionId(),
          startedAt,
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No pudimos guardar tu respuesta.')
      setPhase('success')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos guardar tu respuesta.')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = async () => {
    if (question.required && isEmpty(answers[question.id])) {
      setError('Elige una respuesta para continuar.')
      return
    }

    if (currentIndex === questions.length - 1) {
      await sendResponse()
      return
    }

    setCurrentIndex((index) => index + 1)
    setError('')
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void goNext()
  }

  if (phase === 'intro') {
    return (
      <main className="survey-page">
        <div className="survey-topbar page-width">
          <Link className="survey-brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>{survey.name}</span>
          </Link>
          <span className="survey-meta">{questions.length} preguntas</span>
        </div>
        <section className="survey-intro survey-surface">
          <p className="eyebrow">{intro?.eyebrow || 'ENCUESTA'}</p>
          <h1>{intro?.title || survey.name}</h1>
          <p className="survey-description">
            {intro?.description || 'Comparte tu opinión. Solo te llevará unos minutos.'}
          </p>
          <button className="button button-primary button-large" type="button" onClick={() => setPhase('questions')}>
            {intro?.buttonLabel || 'Empezar'}
            <span aria-hidden="true">→</span>
          </button>
          <p className="privacy-note">
            Al responder guardamos tus respuestas y contexto técnico básico del navegador para interpretar mejor los
            resultados.
          </p>
        </section>
      </main>
    )
  }

  if (phase === 'success') {
    return (
      <main className="survey-page">
        <div className="survey-topbar page-width">
          <Link className="survey-brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>{survey.name}</span>
          </Link>
        </div>
        <section className="survey-intro survey-surface success-surface">
          <span className="success-icon" aria-hidden="true">✓</span>
          <p className="eyebrow">{thankYou?.eyebrow || 'LISTO'}</p>
          <h1>{thankYou?.title || 'Gracias por responder.'}</h1>
          <p className="survey-description">
            {thankYou?.description || 'Tu respuesta se ha guardado correctamente.'}
          </p>
          <Link className="button button-secondary button-large" href="/">
            {thankYou?.buttonLabel || 'Volver al inicio'}
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="survey-page">
      <div className="survey-topbar page-width">
        <button className="text-button" type="button" onClick={() => setPhase('intro')}>
          <span aria-hidden="true">‹</span> {survey.name}
        </button>
        <span className="survey-meta">{currentIndex + 1} de {questions.length}</span>
      </div>

      <section className="survey-progress page-width" aria-label={`Progreso: ${currentIndex + 1} de ${questions.length}`}>
        <div className="progress-track">
          <div className="progress-value" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <form className="question-surface survey-surface" onSubmit={submitForm}>
        <div className="question-heading">
          <p className="step-label">Pregunta {String(currentIndex + 1).padStart(2, '0')}</p>
          <h1 id={`question-${question.id}`}>{question.label}</h1>
          {question.description ? <p>{question.description}</p> : null}
          {multipleMaxSelections ? (
            <p className="selection-limit">Puedes elegir hasta {multipleMaxSelections} opciones.</p>
          ) : null}
        </div>

        <div className="answer-area" aria-labelledby={`question-${question.id}`}>
          {question.type === 'textarea' ? (
            <textarea
              autoFocus
              className="text-input text-area"
              id={`answer-${question.id}`}
              value={String(answers[question.id] || '')}
              placeholder={question.placeholder}
              required={question.required}
              aria-required={question.required}
              onChange={(event) => setAnswer(event.target.value)}
            />
          ) : ['text', 'email', 'number', 'date'].includes(question.type) ? (
            <input
              autoFocus
              className="text-input"
              id={`answer-${question.id}`}
              type={question.type}
              value={String(answers[question.id] ?? '')}
              placeholder={question.placeholder}
              min={question.min}
              max={question.max}
              required={question.required}
              aria-required={question.required}
              onChange={(event) =>
                setAnswer(question.type === 'number' ? event.target.value : event.target.value)
              }
            />
          ) : question.type === 'rating' ? (
            <div className="rating-group" role="radiogroup" aria-label={question.label}>
              {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }, (_, index) => {
                const value = (question.min || 1) + index
                const selected = answers[question.id] === value
                return (
                  <button
                    className={`rating-choice${selected ? ' is-selected' : ''}`}
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAnswer(value)}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="option-list">
              {optionsFor(question).map((option) => {
                const selected =
                  question.type === 'multiple'
                    ? selectedMultipleValues.includes(option.value)
                    : answers[question.id] === option.value
                const disabled = question.type === 'multiple' && multipleLimitReached && !selected
                return (
                  <label
                    className={`option-card${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                    key={option.value}
                  >
                    <input
                      type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                      name={question.id}
                      value={option.value}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => {
                        if (question.type === 'multiple') {
                          const current = selectedMultipleValues
                          if (!selected && multipleMaxSelections && current.length >= multipleMaxSelections) {
                            setError(`Puedes seleccionar hasta ${multipleMaxSelections} opciones.`)
                            return
                          }
                          setAnswer(
                            selected
                              ? current.filter((value) => value !== option.value)
                              : [...current, option.value],
                          )
                        } else {
                          setAnswer(option.value)
                        }
                      }}
                    />
                    <span>{option.label}</span>
                    <span className="option-indicator" aria-hidden="true" />
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="question-footer">
          <div className="footer-status" aria-live="polite">
            {error ? (
              <span className="form-error">{error}</span>
            ) : multipleLimitReached ? (
              `Máximo ${multipleMaxSelections} opciones`
            ) : question.required ? (
              'Obligatorio'
            ) : (
              'Opcional'
            )}
          </div>
          <div className="question-actions">
            {currentIndex > 0 ? (
              <button className="button button-secondary" type="button" onClick={() => setCurrentIndex((index) => index - 1)}>
                Atrás
              </button>
            ) : null}
            {!question.required && isEmpty(answers[question.id]) ? (
              <button className="text-button" type="button" onClick={() => void goNext()}>
                Omitir
              </button>
            ) : null}
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : currentIndex === questions.length - 1 ? 'Enviar respuestas' : 'Continuar'}
              {!submitting ? <span aria-hidden="true">→</span> : null}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
