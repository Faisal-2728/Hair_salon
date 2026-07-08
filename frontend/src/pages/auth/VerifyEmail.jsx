import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

function VerifyEmail() {
  const query = useQuery()
  const email = query.get('email') || localStorage.getItem('pending_verification_email') || ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!email || !otp) {
      showToast('Email and OTP are required', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp })
      showToast('Email verified successfully! Redirecting to login…', { variant: 'success' })
      localStorage.removeItem('pending_verification_email')
      setTimeout(() => navigate('/auth/login'), 1800)
    } catch (err) {
      const msg = err?.response?.data?.error || 'Verification failed'
      showToast(msg, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      showToast('Email is required', { variant: 'error' })
      return
    }

    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      showToast('OTP resent to your email', { variant: 'info' })
      setResendCooldown(60)
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to resend OTP'
      showToast(msg, { variant: 'error' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 p-10 text-white lg:block">
            <div className="space-y-6">
              <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-white/90">
                Email verification
              </p>
              <h1 className="text-4xl font-semibold leading-tight">Confirm your account with a secure OTP.</h1>
              <p className="max-w-md text-base text-white/80">
                Enter the code sent to your inbox and unlock your Salon App dashboard. OTP verification keeps every account secure and trusted.
              </p>
              <div className="grid gap-4 text-sm text-white/80">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="font-semibold">Quick verification</p>
                  <p>Use the 6-digit OTP to verify your email in seconds.</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="font-semibold">Secure onboarding</p>
                  <p>Only verified users can log in and manage bookings.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 sm:p-12">
            <div className="mb-6 rounded-3xl bg-slate-100 p-6 text-slate-900 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">One-time password</p>
              <h2 className="mt-3 text-3xl font-semibold">Verify your email</h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter the 6-digit code sent to <span className="font-semibold">{email || 'your email'}</span>.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">OTP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.32em] text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !otp}
                className="flex w-full items-center justify-center rounded-3xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
              <p className="text-sm font-medium">Didn't receive your OTP?</p>
              <p className="mt-2 text-sm text-slate-600">We can resend a new code to your email in just a moment.</p>
              <button
                onClick={handleResendOtp}
                disabled={resending || resendCooldown > 0}
                className="mt-4 w-full rounded-3xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
              >
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : 'Resend OTP'}
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              <button
                onClick={() => navigate('/auth/login')}
                className="font-semibold text-violet-700 hover:text-violet-900"
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
