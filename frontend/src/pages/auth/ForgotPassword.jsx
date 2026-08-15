import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message)
      navigate(`/auth/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset code right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white/90 p-8 shadow-xl shadow-slate-200">
      <h2 className="mb-4 text-2xl font-semibold">Forgot Password</h2>
      <p className="mb-6 text-sm text-slate-600">Enter your email and we will send you a six-digit verification code.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <button disabled={isLoading} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70">
          {isLoading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
    </div>
  )
}

export default ForgotPassword
