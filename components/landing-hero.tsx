"use client";

import Link from "next/link";

interface LandingHeroProps {
  onStart: () => void
  onSignIn: () => void
}

export function LandingHero({ onStart, onSignIn }: LandingHeroProps) {
  return (
    // FIXED: Removed bg-white, added min-h-screen
    <main className="min-h-screen w-full">
      {/* BEGIN: HeroSection */}
      {/* FIXED: Adjusted top padding to pt-16 md:pt-24 */}
      <section className="relative overflow-hidden pb-20 pt-16 md:pt-24" data-purpose="hero">
        <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row">
          {/* Text Content */}
          <div className="z-10 lg:w-1/2">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              AI-Powered Nutrition
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight text-slate-900 lg:text-7xl">
              Your Personal Food <br />
              <span className="text-emerald-500">AI Assistant</span>
            </h1>
            <p className="mb-10 max-w-xl text-xl leading-relaxed text-slate-600">
              Snap a photo, track your nutrition, and discover healthy meals effortlessly. Achieve your wellness goals with the power of computer vision.
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3">
  <button
    onClick={onStart}
    className="flex transform items-center justify-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 hover:bg-emerald-600"
  >
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" fillRule="evenodd" />
    </svg>
    Try Your Assistant
  </button>
  
  <p className="text-center text-sm text-slate-500">
    Already have an account?{' '}
    <button onClick={onSignIn} className="font-semibold text-slate-500 underline transition-colors hover:text-emerald-500">
      Login
    </button>
  </p>
</div>
          </div>
          
          {/* Hero Visual */}
          <div className="relative lg:w-1/2">
            <div className="relative z-10 overflow-hidden rounded-3xl border-8 border-white bg-gradient-to-b from-transparent to-white shadow-2xl">
              <img alt="Healthy salad bowl" className="h-auto w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCSo6hpn3TVQK2WrlNDN0Ap3NcC7XaYvizB__Jy28kZIN6OCTK87LSYnXKLzNTciX46xYhlUdr1opWWLMWvvxK9DuMMczaAn195Vivrtav7e5P1fEp3aWZ_EmDpo8bMhmw6kw-QExGuHOU7EDeq_OLO_O_56Fv-3Gr6bFTuOhoJUR0tFWCaShlnEq5e9efjqAn5qKD5SJfgDSH52tJ9Na09h71Zyn67-ZKKYnbH5D4nYHjD7iRqfIv8ZPAbyvJEf-UTZ_hdGqCP0A" />
              
              {/* Floating Mobile App Mockup Overlay */}
              <div className="absolute bottom-8 left-8 right-8 hidden rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-xl backdrop-blur md:block" data-purpose="app-preview-card">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-500/20 p-3">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Analysis Complete</h4>
                    <p className="text-sm italic text-slate-500">"Grilled Chicken Salad: 450 kcal, 32g Protein"</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -top-10 -z-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 -z-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>
        </div>
      </section>
      {/* END: HeroSection */}

      {/* BEGIN: FeaturesSection */}
      <section className="bg-slate-50 py-24" data-purpose="features" id="features">
        <div className="container mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-slate-900 md:text-4xl">Smart Features for Healthy Living</h2>
            <p className="mx-auto max-w-2xl text-slate-600">Everything you need to master your nutrition in one simple app.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Feature 1 */}
            <div className="feature-card flex flex-col items-center justify-center min-h-[220px] w-full rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Snap & Analyze</h3>
            </div>
            
            {/* Feature 2 */}
            <div className="feature-card flex flex-col items-center justify-center min-h-[220px] w-full rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Smart Tracking</h3>
            </div>
            
            {/* Feature 3 */}
            <div className="feature-card flex flex-col items-center justify-center min-h-[220px] w-full rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Daily Plan Creation</h3>
            </div>
          </div>
        </div>
      </section>
      {/* END: FeaturesSection */}

      {/* BEGIN: CTA_Footer */}
      <section className="bg-white py-24" data-purpose="final-cta">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-12 text-center text-white md:p-20">
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-8 text-4xl font-extrabold md:text-5xl">Ready to transform your eating habits?</h2>
              <p className="mb-10 text-lg text-slate-400">Join thousands of users who are using NutriSnap to live healthier, happier lives.</p>
              <button
                onClick={onSignIn}
                className="inline-block transform rounded-lg bg-emerald-500 px-10 py-5 text-xl font-bold text-slate-900 transition-all hover:scale-105 hover:bg-emerald-600 hover:text-white"
              >
                Start Your Free Trial
              </button>
              <p className="mt-8 text-sm text-slate-500">
                Already have an account?{' '}
                <button onClick={onSignIn} className="text-white underline hover:text-emerald-500">
                  Login
                </button>
              </p>
            </div>
            {/* Background accent */}
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
          </div>
        </div>
      </section>
      {/* END: CTA_Footer */}
    </main>
  );
}