import { toast } from 'sonner'

const DEMO_OTP = '123456'

export async function sendOTP(email: string, name: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()

  if (!normalizedEmail) {
    toast.error('Email is required.')
    return false
  }

  if (!trimmedName) {
    toast.error('Name is required.')
    return false
  }

  // Demo mode: simulate sending OTP without external email provider.
  localStorage.setItem('demo_otp_email', normalizedEmail)
  localStorage.setItem('demo_otp_name', trimmedName)
  toast.success(`Demo code sent: ${DEMO_OTP}`)
  return true
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const token = code.trim()

  if (!normalizedEmail || token.length !== 6) {
    toast.error('Invalid verification code.')
    return false
  }

  const storedEmail = localStorage.getItem('demo_otp_email')
  if (storedEmail !== normalizedEmail || token !== DEMO_OTP) {
    toast.error('Invalid verification code.')
    return false
  }

  localStorage.removeItem('demo_otp_email')
  localStorage.removeItem('demo_otp_name')
  toast.success('Email verified!')
  return true
}
