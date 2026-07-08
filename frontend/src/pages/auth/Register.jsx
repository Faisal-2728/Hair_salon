import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import { useNavigate, Link } from 'react-router-dom'
import { HiEye, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi2'
import { FiEyeOff } from 'react-icons/fi'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

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

    // Clear error for this field
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
      const message = error?.response?.data?.error || 'Registration failed. Please try again.'
      showToast(message, { variant: 'error' })
    } finally {
      setLoading(false)
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

  const strengthColors = ['bg-red-500/20', 'bg-orange-500/20', 'bg-yellow-500/20', 'bg-green-500/20']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthLabelColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']

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
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(88, 28, 135, 0.2) 50%, rgba(139, 92, 246, 0.2) 100%)`,
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
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
              Create Account
            </motion.h1>
            <motion.p
              className="text-slate-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Join our premium salon community
            </motion.p>
          </div>

          {/* Glassmorphism Card */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-8 shadow-2xl shadow-black/20">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                <label className="block text-sm font-semibold text-white">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${
                    errors.fullName ? 'border-red-400/50' : 'border-white/20'
                  } bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition`}
                  placeholder="Alex Morgan"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <HiExclamationCircle size={14} /> {errors.fullName}
                  </p>
                )}
              </motion.div>

              {/* Username */}
              <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
                <label className="block text-sm font-semibold text-white">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${
                    errors.username ? 'border-red-400/50' : 'border-white/20'
                  } bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition`}
                  placeholder="alex.morgan"
                />
                {errors.username && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <HiExclamationCircle size={14} /> {errors.username}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                <label className="block text-sm font-semibold text-white">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${
                    errors.email ? 'border-red-400/50' : 'border-white/20'
                  } bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition`}
                  placeholder="alex@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <HiExclamationCircle size={14} /> {errors.email}
                  </p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.35 }}>
                <label className="block text-sm font-semibold text-white">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border ${
                      errors.password ? 'border-red-400/50' : 'border-white/20'
                    } bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <HiExclamationCircle size={14} /> {errors.password}
                  </p>
                )}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70">Password strength</span>
                      <span className={`text-xs font-semibold ${strengthLabelColors[passwordStrength] || ''}`}>
                        {strengthLabels[passwordStrength] || 'Enter password'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          [
                            'bg-red-500/50',
                            'bg-orange-500/50',
                            'bg-yellow-500/50',
                            'bg-green-500/50',
                          ][passwordStrength] || ''
                        }`}
                        style={{ width: `${((passwordStrength + 1) / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div className="space-y-2" variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
                <label className="block text-sm font-semibold text-white">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border ${
                      errors.confirmPassword ? 'border-red-400/50' : 'border-white/20'
                    } bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/50 backdrop-blur-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                  >
                    {showConfirm ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <HiExclamationCircle size={14} /> {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <HiCheckCircle size={14} /> Passwords match
                  </p>
                )}
              </motion.div>

              {/* Register Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 text-base font-semibold text-white shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/75 hover:scale-105 transition disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-6"
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/60">Already registered?</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Sign In Link */}
            <motion.p
              className="text-center text-white/80"
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              Already have an account?{' '}
              <Link to="/auth/login" className="font-semibold text-violet-300 hover:text-violet-200 transition">
                Sign in
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
              { title: 'OTP Secure', desc: 'Email verification' },
              { title: 'Instant Access', desc: 'Book immediately' },
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

export default Register
