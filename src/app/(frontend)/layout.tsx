import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './styles.css'

export const metadata: Metadata = {
  title: {
    default: 'Me Encuestas',
    template: '%s · Me Encuestas',
  },
  description: 'Encuestas sencillas de responder y fáciles de analizar.',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <div className="site-frame">{children}</div>
      </body>
    </html>
  )
}
