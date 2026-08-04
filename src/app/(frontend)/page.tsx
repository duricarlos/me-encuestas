import Link from 'next/link'

import { SurveyLinkForm } from '@/components/SurveyLinkForm'

export default function HomePage() {
  return (
    <>
      <header className="site-nav page-width">
        <Link className="brand" href="/" aria-label="Me Encuestas, inicio">
          <span className="brand-mark" aria-hidden="true" />
          <span>me encuestas</span>
        </Link>
        <span className="nav-note">Responde en pocos minutos</span>
      </header>

      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow">TIENES UNA ENCUESTA</p>
            <h1>Escribe el ID. Empieza a responder.</h1>
            <p className="hero-lede">
              Si te han enviado una encuesta, escribe aquí su ID y entra directamente. Solo necesitas ese código para
              comenzar.
            </p>
            <SurveyLinkForm />
            <p className="quiet-note">
              No necesitas registrarte para responder. No pedimos permisos de ubicación.
            </p>
          </div>

          <div className="hero-visual" aria-label="Vista previa de una encuesta">
            <div className="visual-window-bar">
              <span className="window-dot window-dot-red" />
              <span className="window-dot window-dot-yellow" />
              <span className="window-dot window-dot-green" />
              <span className="visual-file">tu encuesta</span>
            </div>
            <div className="survey-preview">
              <div className="preview-topline">
                <span>Pregunta 2 de 5</span>
                <span>40%</span>
              </div>
              <div className="preview-progress" aria-hidden="true">
                <span />
              </div>
              <p className="preview-eyebrow">SOBRE TU EXPERIENCIA</p>
              <h2>¿Qué fue lo mejor de tu visita?</h2>
              <div className="preview-options" aria-hidden="true">
                <span>La atención</span>
                <span className="is-selected">La facilidad</span>
                <span>La rapidez</span>
              </div>
            </div>
            <div className="visual-caption">
              <span className="caption-pulse" />
              Una pregunta a la vez
            </div>
          </div>
        </section>

        <section className="principles page-width" aria-labelledby="principles-title">
          <div className="section-intro">
            <p className="eyebrow">HECHO PARA EL FLUJO</p>
            <h2 id="principles-title">Lo esencial, en el lugar correcto.</h2>
          </div>
          <div className="principle-list">
            <article className="principle-row">
              <span className="principle-index">01</span>
              <div>
                <h3>Solo necesitas el ID</h3>
                <p>Escríbelo arriba y entra directamente a la encuesta que te han enviado.</p>
              </div>
            </article>
            <article className="principle-row">
              <span className="principle-index">02</span>
              <div>
                <h3>Una pregunta a la vez</h3>
                <p>Responde con calma, sin formularios largos ni pantallas llenas de campos.</p>
              </div>
            </article>
            <article className="principle-row">
              <span className="principle-index">03</span>
              <div>
                <h3>Tu opinión importa</h3>
                <p>Unos minutos pueden ayudar a que un producto, servicio o experiencia mejore.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="page-footer page-width">
        <span>Me Encuestas</span>
        <span>Simple por diseño.</span>
      </footer>
    </>
  )
}
