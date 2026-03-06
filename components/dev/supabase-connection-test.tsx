'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SupabaseConnectionTest() {
  const [result, setResult] = useState('Not tested yet')
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult('Running...')

    try {
      const supabase = createClient()
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) {
        console.error('[Supabase profiles test] Query failed', {
          message: error.message,
          code: error.code ?? null,
          status,
          statusText,
          details: error.details ?? null,
          hint: error.hint ?? null,
        })
        setResult('Failed. Check browser console for exact error details.')
        return
      }

      console.log('[Supabase profiles test] Success', {
        status,
        statusText,
        rowCount: Array.isArray(data) ? data.length : 0,
        sampleRow: Array.isArray(data) && data.length > 0 ? data[0] : null,
      })
      setResult('Success. Check console for returned row/status details.')
    } catch (error) {
      console.error('[Supabase profiles test] Unexpected exception', {
        message: error instanceof Error ? error.message : String(error),
        code: null,
        status: null,
        statusText: null,
      })
      setResult('Exception thrown. Check browser console for exact error details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-foreground">Supabase Connection Test</h2>
      <p className="text-sm text-muted-foreground">Attempts to fetch 1 row from public.profiles.</p>
      <Button onClick={runTest} disabled={loading} className="rounded-xl">
        {loading ? 'Testing...' : 'Run Profiles Query Test'}
      </Button>
      <p className="text-sm text-foreground">{result}</p>
    </div>
  )
}
