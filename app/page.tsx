import { redirect } from 'next/navigation'
import { AuthPageClient } from '@/components/auth-page-client'
import { getServerSessionState } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { email } = await getServerSessionState()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedMode = resolvedSearchParams?.mode
  const isSignupRequest = requestedMode === 'signup'

  if (email && !isSignupRequest) {
    redirect('/dashboard')
  }

  return <AuthPageClient />
}
