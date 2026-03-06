'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { sendOTP } from '@/lib/auth'
import { TermsModal } from '@/components/legal/terms-modal'
import { useTranslation } from '@/components/i18n/language-provider'

interface EmailStepProps {
  onSubmit: (payload: { email: string; name: string }) => void
}

export function EmailStep({ onSubmit }: EmailStepProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const isValidName = name.trim().length >= 2
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidName || !isValidEmail || !agreedToTerms) return

    setLoading(true)
    try {
      const sent = await sendOTP(email, name)
      if (sent) {
        onSubmit({ email, name: name.trim() })
      }
    } catch {
      // handled in sendOTP
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center pb-8 pt-32">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-foreground">{t('email_title')}</h2>
      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        {t('email_subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            {t('full_name')}
          </Label>
          <Input
            id="name"
            type="text"
            placeholder={t('name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl text-base"
            autoFocus
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('email_address')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t('email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl text-base"
            autoComplete="email"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
            {t('terms_agree_prefix')}{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setTermsOpen(true)
              }}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t('terms_agree_link')}
            </button>
            {t('terms_agree_suffix')}
          </Label>
        </div>

        <Button
          type="submit"
          disabled={!isValidName || !isValidEmail || !agreedToTerms || loading}
          className="mt-2 h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('sending_code')}
            </>
          ) : (
            <>
              {t('get_code')}
              <ArrowRight className="ml-1 h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  )
}
