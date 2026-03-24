import type { UserProfile } from '@/lib/types'

export const DEMO_OTP = '123456'
export const DEMO_SESSION_COOKIE = 'nutrisnap_demo_session'
const DEMO_SESSION_STORAGE_KEY = 'nutrisnap_demo_session'
const DEMO_SESSION_MAX_AGE = 60 * 60 * 8
const DEMO_SESSION_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isDevAuthBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_DEMO_OTP === 'true' || process.env.NODE_ENV !== 'production'
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function createDefaultDemoProfile(
  email: string,
  overrides?: Partial<Pick<UserProfile, 'name'>>,
): UserProfile {
  return {
    email: normalizeAuthEmail(email),
    name: overrides?.name?.trim() || 'Demo User',
    age: 30,
    gender: 'other',
    height: 170,
    heightUnit: 'cm',
    weight: 70,
    weightUnit: 'kg',
    activityLevel: 'moderate',
    foodPreferences: ['high-protein', 'balanced'],
    goal: 'get_fit',
    dailyCalorieTarget: 2200,
  }
}

function parseDemoSessionEmail(value?: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    const normalizedEmail = normalizeAuthEmail(decodeURIComponent(value))
    return DEMO_SESSION_EMAIL_PATTERN.test(normalizedEmail) ? normalizedEmail : null
  } catch {
    return null
  }
}

function buildDemoSessionCookie(value: string, maxAge: number): string {
  const attributes = [
    `${DEMO_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ]

  if (window.location.protocol === 'https:') {
    attributes.push('Secure')
  }

  return attributes.join('; ')
}

export function persistDemoSession(email: string): void {
  if (typeof window === 'undefined') return

  const normalizedEmail = normalizeAuthEmail(email)
  localStorage.setItem(DEMO_SESSION_STORAGE_KEY, normalizedEmail)
  document.cookie = buildDemoSessionCookie(normalizedEmail, DEMO_SESSION_MAX_AGE)
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(DEMO_SESSION_STORAGE_KEY)
  localStorage.removeItem('demo_otp_email')
  localStorage.removeItem('demo_otp_mode')
  document.cookie = buildDemoSessionCookie('', 0)
}

export function getDemoSessionEmailFromBrowser(): string | null {
  if (typeof window === 'undefined') return null

  const storedEmail = parseDemoSessionEmail(localStorage.getItem(DEMO_SESSION_STORAGE_KEY))
  if (storedEmail) {
    return storedEmail
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${DEMO_SESSION_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  const normalizedEmail = parseDemoSessionEmail(cookieValue)
  if (!normalizedEmail) {
    return null
  }

  localStorage.setItem(DEMO_SESSION_STORAGE_KEY, normalizedEmail)
  return normalizedEmail
}

export function getDemoSessionEmailFromCookieValue(cookieValue?: string | null): string | null {
  return parseDemoSessionEmail(cookieValue)
}
