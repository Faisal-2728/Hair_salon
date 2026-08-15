import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials, setError } from '../../features/auth/authSlice'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { HiEye, HiExclamationCircle, HiCheckCircle, HiSparkles } from 'react-icons/hi2'
import { FiEyeOff, FiMail, FiLock, FiShield, FiClock } from 'react-icons/fi'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { useLanguage } from '../../providers/LanguageProvider'
import salonBg from '../../assets/images/hero-salon.jpg'

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

  const { t } = useLanguage()

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
    visible: { opacity: 1, transition: { duration: 0.45 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.15 } },
  }

  const inputVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      className="relative min-h-[calc(100vh-6rem)] overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0">
        <img src={salonBg} alt="Salon background" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-8 flex justify-center">
          <div className="rounded-full border border-[#D4AF37]/25 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#F8E3A1] shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
            Luxury salon bookings
          </div>
        </div>

        <div className="w-full">
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.15fr] lg:p-8">
            <motion.div
              className="order-2 rounded-[1.75rem] border border-[#D4AF37]/20 bg-black/60 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.45)] lg:order-1"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#F8E3A1] shadow-[0_10px_30px_rgba(212,175,55,0.18)]">
                  <HiSparkles size={18} />
                  Premium access
                </div>
                <div>
                  <h2 className="text-3xl font-semibold text-white">Luxury salon experience</h2>
                  <p className="mt-3 max-w-xl text-slate-300">Sign in to manage your appointments, discover exclusive services, and keep your beauty routine effortlessly in sync.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-300">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <FiShield size={18} />
                    <span className="font-semibold text-white">Protected login</span>
                  </div>
                  <p className="text-sm">Login securely with trusted verification and session protection.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-300">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <FiClock size={18} />
                    <span className="font-semibold text-white">Instant access</span>
                  </div>
                  <p className="text-sm">Return to your dashboard fast and book your next visit without delay.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="order-1 rounded-[1.75rem] border border-white/15 bg-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:order-2"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-8 flex flex-col gap-4 text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="text-sm uppercase tracking-[0.35em] text-[#D4AF37]">Member login</span>
                </div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Sign in to your account</h1>
                <p className="max-w-xl text-slate-300">Access your booking history, save favorite services, and manage appointments with ease.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-semibold text-slate-200">Email or username</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiMail className="text-[#D4AF37]" size={18} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="alex@example.com or alex.morgan"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                  <label className="block text-sm font-semibold text-slate-200">Password</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiLock className="text-[#D4AF37]" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-slate-300 transition hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
                  <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-slate-900/70 text-[#D4AF37]" />
                    <span>{t('remember_me')}</span>
                  </label>
                  <Link to="/auth/forgot-password" className="font-semibold text-[#D4AF37] hover:text-white transition">
                    {t('forgot_password')}
                  </Link>
                </motion.div>

                {auth.error && (
                  <motion.div
                    className="flex items-start gap-3 rounded-[1rem] border border-red-400/30 bg-red-500/10 p-4"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <HiExclamationCircle className="mt-0.5 flex-shrink-0 text-red-400" size={20} />
                    <p className="text-sm text-red-200">{auth.error}</p>
                  </motion.div>
                )}

                {requiresVerification && (
                  <motion.div
                    className="rounded-[1rem] border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-[#F8E3A1]"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <HiCheckCircle className="mt-0.5 flex-shrink-0 text-[#D4AF37]" size={20} />
                      <div>
                        <p className="font-semibold text-white">Email verification required</p>
                        <p className="mt-1 text-sm text-slate-200">Verify <span className="font-medium">{unverifiedEmail}</span> with your OTP.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleResendOtp}
                      disabled={sendingOtp}
                      className="w-full rounded-[0.9rem] border border-[#D4AF37]/30 bg-black/30 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-black/50 disabled:opacity-60"
                    >
                      {sendingOtp ? 'Sending...' : 'Send OTP & Verify'}
                    </button>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-[#D4AF37] via-[#F3C75D] to-[#D4AF37] px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_15px_40px_rgba(212,175,55,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(212,175,55,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size={18} />
                      <span>{t('signing_in')}</span>
                    </>
                  ) : (
                    t('sign_in')
                  )}
                </motion.button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">New here?</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <motion.p className="text-center text-sm text-slate-300" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                Don&apos;t have an account?{' '}
                <Link to="/auth/register" className="font-semibold text-[#D4AF37] hover:text-white">
                  Create one
                </Link>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Login
