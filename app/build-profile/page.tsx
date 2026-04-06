import { OnboardingPageClient } from '@/components/onboarding-page-client'
import { getServerSessionState } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function BuildProfilePage() {
  const { email } = await getServerSessionState()

  return <OnboardingPageClient initialSessionEmail={email} />
}
