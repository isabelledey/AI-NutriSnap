import { SupabaseConnectionTest } from '@/components/dev/supabase-connection-test'

export default function SupabaseTestPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md px-6 pb-8 pt-24">
      <SupabaseConnectionTest />
    </main>
  )
}
