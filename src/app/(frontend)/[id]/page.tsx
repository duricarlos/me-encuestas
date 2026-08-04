import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SurveyExperience } from '@/components/SurveyExperience'
import { getSurveyBySlug } from '@/lib/surveys'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const survey = await getSurveyBySlug(id)
  return {
    title: survey?.name || 'Encuesta',
    description: survey?.definition.intro?.description || 'Comparte tu opinión.',
  }
}

export default async function SurveyPage({ params }: PageProps) {
  const { id } = await params
  const survey = await getSurveyBySlug(id)

  if (!survey) notFound()

  return <SurveyExperience survey={survey} />
}
