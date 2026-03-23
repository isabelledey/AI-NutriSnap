'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { Dashboard } from '@/components/dashboard/dashboard'
import { createClient } from '@/lib/supabase/client'
import {
  clearDemoSession,
  createDefaultDemoProfile,
  getDemoSessionEmailFromBrowser,
  normalizeAuthEmail,
} from '@/lib/demo-session'
import { clearAppSession, getUserProfile, isProfileComplete, saveUserProfile } from '@/lib/store'
import type { UserProfile } from '@/lib/types'

interface DashboardPageClientProps {
  initialSessionEmail: string | null
  isDemoSession: boolean
}

export function DashboardPageClient({ initialSessionEmail, isDemoSession }: DashboardPageClientProps) {
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState<string | null>(initialSessionEmail)
  const [isUsingDemoSession, setIsUsingDemoSession] = useState(isDemoSession)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false

    const loadSession = async () => {
      const demoSessionEmail = getDemoSessionEmailFromBrowser()
      if (demoSessionEmail) {
        if (!ignore) {
          setSessionEmail(demoSessionEmail)
          setIsUsingDemoSession(true)
          setIsAuthLoading(false)
        }
        return
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!ignore) {
          setSessionEmail(session?.user?.email ? normalizeAuthEmail(session.user.email) : null)
          setIsUsingDemoSession(false)
        }
      } finally {
        if (!ignore) {
          setIsAuthLoading(false)
        }
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        const demoSessionEmail = getDemoSessionEmailFromBrowser()
        if (session?.user?.email) {
          setSessionEmail(normalizeAuthEmail(session.user.email))
          setIsUsingDemoSession(false)
        } else if (demoSessionEmail) {
          setSessionEmail(demoSessionEmail)
          setIsUsingDemoSession(true)
        } else {
          setSessionEmail(null)
          setIsUsingDemoSession(false)
        }
        setIsAuthLoading(false)
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadProfile = async () => {
      if (!sessionEmail) {
        setProfile(null)
        setIsProfileLoading(false)
        return
      }

      setIsProfileLoading(true)

      try {
        const localProfile = getUserProfile()
        if (localProfile?.email === sessionEmail && !ignore) {
          setProfile(localProfile)
          setIsProfileLoading(false)
          return
        }

        const res = await fetch(`/api/profile?email=${encodeURIComponent(sessionEmail)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)

        if (!ignore && res.ok && data?.success && data?.profile) {
          saveUserProfile(data.profile)
          setProfile(data.profile as UserProfile)
          setIsProfileLoading(false)
          return
        }

        if (!ignore) {
          if (isUsingDemoSession) {
            const demoProfile = createDefaultDemoProfile(sessionEmail)
            saveUserProfile(demoProfile)
            setProfile(demoProfile)
          } else {
            setProfile(null)
          }
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false)
        }
      }
    }

    void loadProfile()
    return () => {
      ignore = true
    }
  }, [isUsingDemoSession, sessionEmail])

  useEffect(() => {
    if (!isAuthLoading && sessionEmail === null && !getDemoSessionEmailFromBrowser()) {
      void (async () => {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const user = session?.user ?? null
        console.log('[AUTH DEBUG] Kicking user to root. Session state:', session, 'User state:', user)
        router.replace('/')
      })()
    }
  }, [isAuthLoading, sessionEmail, router])

  useEffect(() => {
    if (isAuthLoading || isProfileLoading || !sessionEmail) return

    if (!profile || !isProfileComplete(profile)) {
      router.replace('/onboarding')
    }
  }, [isAuthLoading, isProfileLoading, profile, router, sessionEmail])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearDemoSession()
    clearAppSession()
    router.replace('/')
    router.refresh()
  }

  if (isAuthLoading || isProfileLoading || !profile || !isProfileComplete(profile)) {
    return (
      <main className="mx-auto min-h-[100dvh] max-w-md">
        <AppHeader onLogout={handleLogout} showLogout />
        <div className="px-6 pb-24 pt-20">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md">
      <AppHeader onLogout={handleLogout} showLogout />
      <Dashboard profile={profile} onAddMeal={() => router.push('/analyze')} />
    </main>
  )
}
