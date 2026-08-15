import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'

function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState('verify')

  useEffect(() => {
    const emailFromQuery = searchParams.get('email') || ''
    if (emailFromQuery) {
      setEmail(emailFromQuery)
    }
  }, [searchParams])

  const handleVerify = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/auth/verify-reset-code', { email, code })
      setMessage(response.data.message)
      setStep('reset')
    } catch (err) {
      setError(err.response?.data?.error || 'That reset code is invalid or has expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/auth/reset-password', { email, code, password })
      setMessage(response.data.message)
      setTimeout(() => navigate('/auth/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset the password right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white/90 p-8 shadow-xl shadow-slate-200">
      <h2 className="mb-4 text-2xl font-semibold">Reset Password</h2>
      <p className="mb-6 text-sm text-slate-600">
        {step === 'verify' ? 'Enter the six-digit code sent to your email to continue.' : 'Choose a new password for your account.'}
      </p>

      {step === 'verify' ? (
        <form className="space-y-4" onSubmit={handleVerify}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">6-digit reset code</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 tracking-[0.3em]"
              required
            />
          </label>
          <button disabled={isLoading} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading ? 'Checking…' : 'Verify code'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleReset}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <button disabled={isLoading} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
    </div>
  )
}

export default ResetPassword
