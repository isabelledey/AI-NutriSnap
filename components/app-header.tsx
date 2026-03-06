"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/components/i18n/language-provider";

interface AppHeaderProps {
  onLogout?: () => void
  showLogout?: boolean
  onGoBack?: () => void
}

export function AppHeader({ onLogout, showLogout = false, onGoBack }: AppHeaderProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="absolute top-0 left-0 z-40 w-full bg-transparent">
      <div className="relative flex h-14 items-center justify-between px-4">
        <h1 className="text-base font-bold text-foreground">NutriSnap</h1>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5 rotate-0'
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5 rotate-0'
            }`}
          />
        </button>

        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-12 right-0 z-50 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="space-y-4">
                {onGoBack && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={() => {
                      setIsOpen(false)
                      onGoBack()
                    }}
                  >
                    {t('go_back')}
                  </Button>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Language
                  </p>
                  <LanguageSwitcher inMenu className="w-fit" />
                </div>

                {showLogout && onLogout && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout()
                    }}
                  >
                    {t('logout')}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
