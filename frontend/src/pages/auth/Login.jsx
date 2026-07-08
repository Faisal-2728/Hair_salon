import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials, setError } from '../../features/auth/authSlice'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { HiEye, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi2'
import { FiEyeOff } from 'react-icons/fi'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useSelector((state) => state.auth)

  const handleSubmit = async (event) => {
    event.preventDefault()
    dispatch(setError(null))
    setRequiresVerification(false)
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { identifier, password })
      const { access_token, refresh_token, user } = response.data
      localStorage.setItem('salon_access', access_token)
      localStorage.setItem('salon_refresh', refresh_token)
      localStorage.setItem('salon_token', access_token)
      if (rememberMe) {
        localStorage.setItem('salon_remember_me', 'true')
      }
      dispatch(setCredentials({ user, token: access_token }))
      
      // Check if there's a return path from booking
      const returnTo = location.state?.returnTo
      const redirectPath = user.role === 'admin'
        ? '/dashboard/admin'
        : user.role === 'staff'
          ? '/dashboard/staff'
          : returnTo === 'booking' ? '/dashboard/customer' : '/dashboard/customer'
      navigate(redirectPath)
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.requires_verification) {
        setRequiresVerification(true)
        setUnverifiedEmail(errorData?.email || identifier)
        dispatch(setError(errorData?.message || 'Email verification required'))
      } else {
        dispatch(setError(errorData?.error || 'Login failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setSendingOtp(true)
    try {
      await api.post('/auth/resend-otp', { email: unverifiedEmail })
      navigate(`/auth/verify?email=${encodeURIComponent(unverifiedEmail)}`)
    } catch (error) {
      dispatch(setError(error.response?.data?.error || 'Failed to resend OTP'))
    } finally {
      setSendingOtp(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
  }

  const inputVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      className="min-h-[calc(100vh-6rem)] relative overflow-hidden px-4 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(88, 28, 135, 0.2) 50%, rgba(30, 58, 138, 0.2) 100%)`,
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-md w-full">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.h1
              className="text-4xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              className="text-slate-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Sign in to your premium salon account
            </motion.p>
          </div>

          {/* Glassmorphism Card */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-8 shadow-2xl shadow-black/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email/Username Field */}
              <motion.div className="space-y-3" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                <label className="block text-sm font-semibold text-white">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                  placeholder="alex@example.com or alex.morgan"
                  required
                />
              </motion.div>

              {/* Password Field */}
              <motion.div className="space-y-3" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                <label className="block text-sm font-semibold text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                className="flex items-center justify-between text-sm"
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-lg"
                  />
                  <span className="text-white/80">Remember me</span>
                </label>
                <Link to="/auth/forgot-password" className="text-violet-300 hover:text-violet-200 transition font-semibold">
                  Forgot password?
                </Link>
              </motion.div>

              {/* Error Message */}
              {auth.error && (
                <motion.div
                  className="rounded-2xl border border-red-400/30 bg-red-500/10 backdrop-blur-sm p-4 flex items-start gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <HiExclamationCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-300">{auth.error}</p>
                </motion.div>
              )}

              {/* Verification Required */}
              {requiresVerification && (
                <motion.div
                  className="rounded-2xl border border-violet-400/30 bg-violet-500/10 backdrop-blur-sm p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <HiCheckCircle className="text-violet-300 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-white">Email verification required</p>
                      <p className="text-sm text-violet-200 mt-1">
                        Verify <span className="font-medium">{unverifiedEmail}</span> with your OTP.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResendOtp}
                    disabled={sendingOtp}
                    className="w-full rounded-2xl border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/30 transition disabled:opacity-60"
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP & Verify'}
                  </button>
                </motion.div>
              )}

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 text-base font-semibold text-white shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/75 hover:scale-105 transition disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={18} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/60">New here?</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Sign Up Link */}
            <motion.p
              className="text-center text-white/80"
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              Don&apos;t have an account?{' '}
              <Link to="/auth/register" className="font-semibold text-violet-300 hover:text-violet-200 transition">
                Create one
              </Link>
            </motion.p>
          </div>

          {/* Info Cards */}
          <motion.div
            className="mt-8 grid gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {[
              { title: 'Secure', desc: 'Bank-level encryption' },
              { title: 'Fast', desc: '2-minute booking' },
            ].map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Login
