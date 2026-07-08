import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import api from '../services/api'
import { HiMapPin, HiPhone, HiEnvelope, HiClock } from 'react-icons/hi2'
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa'

export default function Landing() {
  const [services, setServices] = useState([])
  const auth = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/services')
      .then((response) => setServices(response.data.services || []))
      .catch(() => setServices([]))
  }, [])

  const handleBookingClick = () => {
    if (!auth.user) {
      navigate('/auth/login', { state: { from: '/dashboard/customer', returnTo: 'booking' } })
    } else {
      navigate('/dashboard/customer')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background with gradient overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(139, 92, 246, 0.15) 100%)`,
          }}
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 w-full">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
              <motion.div
                className="inline-flex rounded-full border border-violet-400/30 bg-white/5 px-4 py-2 text-sm text-violet-200 backdrop-blur-sm w-fit"
                variants={itemVariants}
              >
                ✨ Premium Salon Experience
              </motion.div>

              <motion.div className="space-y-4" variants={itemVariants}>
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                  Elevate Your <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Beauty</span>
                </h1>
                <p className="text-lg text-slate-300 leading-8 max-w-xl">
                  Experience luxury beauty services with our expert team of stylists. Book premium treatments in minutes and transform your look.
                </p>
              </motion.div>

              <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
                <button
                  onClick={handleBookingClick}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-violet-500/50 transition hover:shadow-violet-500/75 hover:scale-105 duration-300"
                >
                  {auth.user ? '🎯 Book Now' : '📅 Book Appointment'}
                </button>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 duration-300"
                >
                  Create Account
                </Link>
              </motion.div>

              <motion.div className="grid gap-4 sm:grid-cols-3 pt-4" variants={itemVariants}>
                {[
                  { number: '120+', label: 'Weekly Appointments' },
                  { number: '25+', label: 'Expert Stylists' },
                  { number: '4.9/5', label: 'Client Rating' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-3xl font-bold text-white">{stat.number}</p>
                    <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Image Placeholder */}
            <motion.div
              className="relative h-96 sm:h-full min-h-96"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-3xl blur-2xl" />
              <div className="relative h-full rounded-3xl border border-white/10 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💅</div>
                  <p className="text-slate-400">Premium Salon Studio</p>
                  <p className="text-xs text-slate-500 mt-2">Replace with hero-salon.jpg</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-24 px-6 sm:px-10 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl">
          <motion.div className="text-center mb-16" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-sm uppercase tracking-widest text-violet-400 mb-4">Our Services</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Premium Beauty Services
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Discover our curated collection of professional beauty treatments designed for your unique style
            </p>
          </motion.div>

          {services.length > 0 ? (
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:border-white/20 transition duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  {/* Service Image */}
                  <div className="h-48 overflow-hidden bg-gradient-to-br from-violet-600/10 to-pink-600/10 relative">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl">✨</div>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-widest text-violet-300 mb-2">{service.category || 'Service'}</p>
                    <h3 className="text-xl font-semibold text-white mb-2">{service.name}</h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{service.description || 'Professional beauty service'}</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-violet-400">${service.price?.toFixed(2)}</span>
                      <span className="text-xs text-slate-500">{service.duration_minutes} min</span>
                    </div>

                    <button
                      onClick={handleBookingClick}
                      className="w-full py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition duration-300 text-sm font-semibold"
                    >
                      Book Service
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Services loading...</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact & Footer Section */}
      <section className="relative py-24 px-6 sm:px-10 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          {/* Contact Info */}
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: HiMapPin, label: 'Address', value: '123 Main Street, City Center' },
              { icon: HiPhone, label: 'Phone', value: '(555) 123-4567' },
              { icon: HiEnvelope, label: 'Email', value: 'hello@salonstudio.com' },
              { icon: HiClock, label: 'Hours', value: 'Mon - Sat: 9am - 8pm' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center hover:border-white/20 transition duration-300"
                variants={itemVariants}
              >
                <item.icon className="mx-auto text-3xl text-violet-400 mb-4" />
                <p className="text-sm text-slate-400 mb-2">{item.label}</p>
                <p className="font-semibold text-white">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.div
            className="border-t border-white/10 pt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="grid gap-8 md:grid-cols-3 mb-8">
              {/* Brand */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">✨ Salon Studio</h3>
                <p className="text-slate-400">Premium beauty services for modern individuals</p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><Link to="/" className="hover:text-violet-400 transition">Home</Link></li>
                  <li><a href="#services" className="hover:text-violet-400 transition">Services</a></li>
                  <li><Link to="/auth/login" className="hover:text-violet-400 transition">Login</Link></li>
                </ul>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  {[
                    { icon: FaFacebook, label: 'Facebook' },
                    { icon: FaInstagram, label: 'Instagram' },
                    { icon: FaTwitter, label: 'Twitter' },
                    { icon: FaLinkedin, label: 'LinkedIn' },
                  ].map((social, index) => (
                    <a
                      key={index}
                      href="#"
                      className="text-slate-400 hover:text-violet-400 transition text-lg"
                      title={social.label}
                    >
                      <social.icon />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/10 pt-8 text-center text-slate-500 text-sm">
              <p>&copy; 2024 Salon Studio. All rights reserved. | Privacy Policy | Terms of Service</p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
