import { HomePageClient } from '@/components/home-page-client'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Logged-out visitors are expected to have no auth session.
      if (error.message !== 'Auth session missing!') {
        console.error('[HomePage] supabase.auth.getUser failed:', error.message)
      }
      return <HomePageClient initialSessionEmail={null} />
    }

    return <HomePageClient initialSessionEmail={user?.email ?? null} />
  } catch (error) {
    console.error(
      '[HomePage] Failed to initialize Supabase server client:',
      error instanceof Error ? error.message : String(error),
    )
    return <HomePageClient initialSessionEmail={null} />
  }
}
