"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, User, Zap } from "lucide-react";

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Decorative organic shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left warm circle */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        {/* Top-right peach circle */}
        <div className="absolute -top-10 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-2xl" />
        {/* Bottom-left small circle */}
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
        {/* Bottom-right large sage circle */}
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        {/* Center-right floating plate shape */}
        <div className="absolute right-8 top-1/4 h-24 w-24 rounded-full border-4 border-primary/10" />
        {/* Center-left floating bowl shape */}
        <div className="absolute left-6 top-2/3 h-16 w-16 rounded-full border-4 border-accent/15" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
        {/* Logo / Brand */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
          NutriSnap
        </p>

        {/* Main headline */}
        <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-foreground text-balance">
          {"Let's check your meal and build a daily plan together"}
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-base leading-relaxed text-muted-foreground text-pretty">
          Snap a photo of your dish. {"We'll"} count the calories and suggest
          what to eat next.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
        >
          {"Let's Start"}
          <ArrowRight className="ml-1 h-5 w-5" />
        </Button>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-Powered
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <User className="h-3 w-3 text-primary" />
            Personalized Plan
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <Zap className="h-3 w-3 text-primary" />
            Instant Results
          </span>
        </div>
      </div>
    </div>
  );
}
