import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatCurrencyAbbreviated } from '../../utils/currencyUtils'
import { HiUsers, HiCalendarDays, HiCurrencyDollar, HiUserGroup, HiSparkles } from 'react-icons/hi2'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/appointments'),
    ])
      .then(([dashRes, apptRes]) => {
        setStats(dashRes.data)
        const recent = (apptRes.data.appointments || []).slice(0, 5)
        setAppointments(recent)
      })
      .catch(() => {
        setStats({ customer_count: 0, staff_count: 0, appointments_total: 0, revenue: 0, popular_services: [], active_branches: 0 })
        setAppointments([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: formatCurrencyAbbreviated(stats?.revenue || 0), 
      icon: HiCurrencyDollar,
      color: 'from-emerald-500 to-emerald-600',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    { 
      label: 'Total Customers', 
      value: stats?.customer_count || 0,
      icon: HiUsers,
      color: 'from-blue-500 to-blue-600',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    { 
      label: 'Total Appointments', 
      value: stats?.appointments_total || 0,
      icon: HiCalendarDays,
      color: 'from-violet-500 to-violet-600',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-700'
    },
    { 
      label: 'Staff Members', 
      value: stats?.staff_count || 0,
      icon: HiUserGroup,
      color: 'from-orange-500 to-orange-600',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-violet-600 to-violet-700 p-6 shadow-xl text-white">
        <div>
          <h2 className="text-3xl font-bold">Salon Management Dashboard</h2>
          <p className="mt-2 text-violet-100">Monitor operations, staff performance, and client analytics.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-600 tracking-wide">{card.label}</p>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="text-white text-2xl" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
          {(stats?.popular_services || []).length ? (
            <ul className="space-y-2">
              {stats.popular_services.map((svc) => (
                <li key={svc.service_id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3">
                  <div className="font-medium">{svc.service_name}</div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">{svc.bookings}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No service data yet.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
          {appointments.length ? (
            <ul className="space-y-2">
              {appointments.map((appt) => (
                <li key={appt.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{appt.customer?.full_name || `Customer #${appt.customer_id}`}</div>
                      <div className="text-xs text-slate-600">{appt.service?.name || 'Service'}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {String(appt.status).charAt(0).toUpperCase() + String(appt.status).slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(appt.appointment_time).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No appointments yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
