import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import { useNavigate, Link } from 'react-router-dom'
import { HiEye, HiExclamationCircle, HiCheckCircle, HiSparkles } from 'react-icons/hi2'
import { FiEyeOff, FiUser, FiMail, FiLock, FiShield, FiZap } from 'react-icons/fi'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import salonBg from '../../assets/images/hero-salon.jpg'

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const calculatePasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++
    return Math.min(strength, 4)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
      })
      showToast('Registration successful. Check your email for the OTP.', { variant: 'info' })
      localStorage.setItem('pending_verification_email', formData.email)
      navigate(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
    } catch (error) {
      console.error('Registration failed', error)
      const message = error?.response?.data?.error || error?.response?.data?.details || error?.message || 'Registration failed. Please try again.'
      showToast(message, { variant: 'error' })
    } finally {
      setLoading(false)
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

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthLabelColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']

  return (
    <motion.div className="relative min-h-[calc(100vh-6rem)] overflow-hidden" variants={containerVariants} initial="hidden" animate="visible">
      <div className="absolute inset-0">
        <img src={salonBg} alt="Salon background" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-8 flex justify-center">
          <div className="rounded-full border border-[#D4AF37]/25 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#F8E3A1] shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
            Exclusive salon registration
          </div>
        </div>

        <div className="w-full">
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <motion.div className="order-2 rounded-[1.75rem] border border-[#D4AF37]/20 bg-black/60 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.45)] lg:order-1" variants={cardVariants} initial="hidden" animate="visible">
              <div className="mb-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#F8E3A1] shadow-[0_10px_30px_rgba(212,175,55,0.18)]">
                  <HiSparkles size={18} />
                  Create your profile
                </div>
                <div>
                  <h2 className="text-3xl font-semibold text-white">Welcome to the salon club</h2>
                  <p className="mt-3 max-w-xl text-slate-300">Register for a refined booking journey and unlock personalized salon services.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-300">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <FiShield size={18} />
                    <span className="font-semibold text-white">Secure onboarding</span>
                  </div>
                  <p className="text-sm">Every account is secured with trusted verification from the start.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-300">
                  <div className="mb-3 flex items-center gap-2 text-[#D4AF37]">
                    <FiZap size={18} />
                    <span className="font-semibold text-white">Instant access</span>
                  </div>
                  <p className="text-sm">Get booked quickly and start planning your next luxury visit immediately.</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="order-1 rounded-[1.75rem] border border-white/15 bg-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:order-2" variants={cardVariants} initial="hidden" animate="visible">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Create Account</h1>
                <p className="mt-3 text-slate-300">Join now to save favorites, book faster, and receive VIP salon updates.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-semibold text-slate-200">Full Name</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiUser className="text-[#D4AF37]" size={18} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Alex Morgan"
                    />
                  </div>
                  {errors.fullName && <p className="flex items-center gap-1 text-xs text-red-400"><HiExclamationCircle size={14} /> {errors.fullName}</p>}
                </motion.div>

                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
                  <label className="block text-sm font-semibold text-slate-200">Username</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiUser className="text-[#D4AF37]" size={18} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="alex.morgan"
                    />
                  </div>
                  {errors.username && <p className="flex items-center gap-1 text-xs text-red-400"><HiExclamationCircle size={14} /> {errors.username}</p>}
                </motion.div>

                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                  <label className="block text-sm font-semibold text-slate-200">Email Address</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiMail className="text-[#D4AF37]" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="alex@example.com"
                    />
                  </div>
                  {errors.email && <p className="flex items-center gap-1 text-xs text-red-400"><HiExclamationCircle size={14} /> {errors.email}</p>}
                </motion.div>

                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
                  <label className="block text-sm font-semibold text-slate-200">Password</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiLock className="text-[#D4AF37]" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Create a strong password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-slate-300 transition hover:text-white" aria-label="Toggle password visibility">
                      {showPassword ? <FiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="flex items-center gap-1 text-xs text-red-400"><HiExclamationCircle size={14} /> {errors.password}</p>}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Password strength</span>
                        <span className={`text-xs font-semibold ${strengthLabelColors[passwordStrength] || ''}`}>{strengthLabels[passwordStrength] || 'Enter password'}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full transition-all duration-300 ${['bg-red-500/60', 'bg-orange-500/60', 'bg-yellow-500/60', 'bg-green-500/60'][passwordStrength] || ''}`} style={{ width: `${((passwordStrength + 1) / 4) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
                  <label className="block text-sm font-semibold text-slate-200">Confirm Password</label>
                  <div className="flex items-center gap-3 rounded-[1rem] border border-white/15 bg-black/40 px-4 py-3 shadow-inner shadow-black/20">
                    <FiLock className="text-[#D4AF37]" size={18} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Confirm your password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="ml-2 text-slate-300 transition hover:text-white" aria-label="Toggle confirmation password visibility">
                      {showConfirm ? <FiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="flex items-center gap-1 text-xs text-red-400"><HiExclamationCircle size={14} /> {errors.confirmPassword}</p>}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && <p className="flex items-center gap-1 text-xs text-green-400"><HiCheckCircle size={14} /> Passwords match</p>}
                </motion.div>

                <motion.button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-[#D4AF37] via-[#F3C75D] to-[#D4AF37] px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_15px_40px_rgba(212,175,55,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(212,175,55,0.45)] disabled:cursor-not-allowed disabled:opacity-60" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {loading ? <><LoadingSpinner size={18} /><span>Creating account...</span></> : 'Create Account'}
                </motion.button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Already registered?</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <motion.p className="text-center text-sm text-slate-300" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                Already have an account?{' '}
                <Link to="/auth/login" className="font-semibold text-[#D4AF37] hover:text-white">Sign in</Link>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Register
