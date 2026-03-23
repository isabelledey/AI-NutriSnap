'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, ArrowRight, Loader2, User, Leaf } from 'lucide-react'
import { sendOTP } from '@/lib/auth'
import { TermsModal } from '@/components/legal/terms-modal'
import type { AuthMode } from '@/lib/auth'
import { toast } from 'sonner'

interface EmailStepProps {
  mode: AuthMode
  onSubmit: (payload: { email: string; name: string }) => void
}

export function EmailStep({ mode, onSubmit }: EmailStepProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const isSignUp = mode === 'signup'
  const isValidName = !isSignUp || name.trim().length >= 2
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidName || !isValidEmail || (isSignUp && !agreedToTerms)) return

    setLoading(true)
    try {
      const sent = await sendOTP(email, name, mode)
      if (sent) {
        onSubmit({ email, name: name.trim() })
      }
    } catch (error) {
      console.error('[AUTH NETWORK/CORS ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 text-slate-900">
      
      {/* Hero Image Section */}
      <div className="relative w-full h-[45vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDsX0jCyOiSd6LWIiTP9yJfp2uvsdCxSxq6Y7KL1AT7j-l7kwJqDZh7SS3Y17typqAr5u94fc7dR_w7kE0nr8JWX4DMjyt0q7HQJ65Z8ZGX715TkQkmpHstdYE_9wZKVhv84xpyy1WWKIvDqtfjSiwvAnY08IOoKa72CRhi8gaDByfPudtdj3pqN1DiRasMyOeJE3Lfji9m5E-mkkoUia9CF6vItXQJxPVLqrz7mRBXDuNzZvSV-qmJeNI-qud6oNca1Vcxp0fz81g')" }}
        />
        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
        
        {/* Logo Overlay */}
        
      </div>

      {/* Form Content Section */}
      <div className="relative -mt-10 flex flex-1 flex-col rounded-t-[32px] bg-slate-50 px-6 pb-12">
        <div className="pt-8 text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
            {isSignUp ? "Create Account" : "Welcome back"}
          </h2>
          <p className="text-slate-500">
            {isSignUp 
              ? "We'll send you a secure 6-digit code. No passwords required." 
              : "Track your nutrition with a single snap"}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-md space-y-4">
          
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="px-1 text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 text-lg" />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" 
                  placeholder="John Doe" 
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="px-1 text-sm font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 text-lg" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" 
                placeholder="hello@example.com" 
                autoFocus={!isSignUp}
                autoComplete="email"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="mt-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
                className="mt-0.5 border-slate-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-slate-600">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setTermsOpen(true)
                  }}
                  className="font-semibold text-emerald-500 underline-offset-4 hover:text-emerald-600 hover:underline"
                >
                  Terms of Service
                </button>
                {' '}and Privacy Policy.
              </Label>
            </div>
          )}

          <button 
            type="submit"
            disabled={!isValidName || !isValidEmail || (isSignUp && !agreedToTerms) || loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isSignUp ? 'Sending code...' : 'Loading...'}
              </>
            ) : (
              <>
                <span>Get Code</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 flex-shrink text-xs font-semibold uppercase tracking-widest text-slate-400">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => toast.info('Google login coming soon!')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 transition-colors hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button 
              type="button"
              onClick={() => toast.info('Apple login coming soon!')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 transition-colors hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.96.95-2.44.83-3.41-.24-1.47-1.61-4.02-1.61-5.49 0-.97 1.07-2.45 1.2-3.41.24-2.37-2.37-2.12-7.53 1.1-10.75 1.55-1.56 3.52-1.33 4.67-.7.62.33 1.28.33 1.91 0 1.15-.63 3.12-.86 4.67.7 3.22 3.22 3.47 8.38 1.1 10.75zM12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
              </svg>
              <span className="text-sm font-semibold">Apple</span>
            </button>
          </div>
        </form>
      </div>

      {isSignUp && <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />}
    </div>
  )
}
