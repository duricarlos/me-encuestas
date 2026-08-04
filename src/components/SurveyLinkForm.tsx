'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i

const getSurveyId = (value: string) => value.trim().replace(/^\/+|\/+$/g, '')

export function SurveyLinkForm() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const slug = getSurveyId(value)

    if (!slug || !slugPattern.test(slug) || slug === 'admin' || slug === 'api') {
      setError('Escribe un ID de encuesta válido, por ejemplo: experiencia')
      return
    }

    router.push(`/${encodeURIComponent(slug)}`)
  }

  return (
    <form className="survey-link-form" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="survey-id">
        ID de la encuesta
      </label>
      <div className="survey-link-control">
        <input
          id="survey-id"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Escribe el ID de la encuesta"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'survey-link-error' : 'survey-link-help'}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
        />
        <button className="button button-primary" type="submit">
          Responder
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="survey-link-help" id="survey-link-help">
        Por ejemplo: <code>experiencia</code>
      </p>
      {error ? (
        <p className="survey-link-error" id="survey-link-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
