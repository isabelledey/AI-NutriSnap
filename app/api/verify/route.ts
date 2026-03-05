import { NextRequest, NextResponse } from 'next/server'

// Mock verification store (in-memory)
const verificationCodes = new Map<string, string>()

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, code } = body

  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
  }

  // Step 1: Send verification code
  if (!code) {
    // Generate mock code (always 123456 for demo)
    const verifyCode = '123456'
    verificationCodes.set(email, verifyCode)

    // In production, replace with Resend API call
    console.log(`[Mock] Verification code for ${email}: ${verifyCode}`)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent. Use 123456 for demo.',
    })
  }

  // Step 2: Verify code
  const storedCode = verificationCodes.get(email) || '123456'
  if (code === storedCode) {
    verificationCodes.delete(email)
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  }

  return NextResponse.json(
    { success: false, message: 'Invalid verification code' },
    { status: 400 }
  )
}
