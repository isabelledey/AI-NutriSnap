'use client'

import { useTranslation } from '@/components/i18n/language-provider'
import type { Language } from '@/lib/i18n/dictionary'
import { cn } from '@/lib/utils'

const LANGS: Language[] = ['en', 'he', 'ru']

interface LanguageSwitcherProps {
  className?: string
  inMenu?: boolean
}

export function LanguageSwitcher({ className, inMenu = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation()

  return (
    <div
      className={cn(
        inMenu
          ? 'rounded-xl border border-border bg-background p-1'
          : 'absolute top-4 right-4 z-[70] rounded-xl border border-border bg-background/95 p-1 shadow-sm backdrop-blur',
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {LANGS.map((lang) => {
          const active = language === lang
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={active}
              className={`min-w-10 rounded-lg px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {lang}
            </button>
          )
        })}
      </div>
    </div>
  )
}
