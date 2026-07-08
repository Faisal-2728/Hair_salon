import { useEffect, useState } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

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
    { label: 'Revenue', value: `$${(stats?.revenue || 0).toFixed(2)}`, color: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { label: 'Customers', value: stats?.customer_count || 0, color: 'bg-blue-50', textColor: 'text-blue-700' },
    { label: 'Total Appointments', value: stats?.appointments_total || 0, color: 'bg-violet-50', textColor: 'text-violet-700' },
    { label: 'Staff Members', value: stats?.staff_count || 0, color: 'bg-orange-50', textColor: 'text-orange-700' },
    { label: 'Branches', value: stats?.active_branches || 0, color: 'bg-pink-50', textColor: 'text-pink-700' },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-violet-600 to-violet-700 p-6 shadow-xl text-white">
        <div>
          <h2 className="text-3xl font-bold">Salon Management Dashboard</h2>
          <p className="mt-2 text-violet-100">Monitor operations, staff performance, and client analytics.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl ${card.color} p-5 shadow-lg hover:shadow-xl transition-shadow`}>
            <p className="text-xs font-semibold uppercase text-slate-600">{card.label}</p>
            <p className={`mt-3 text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
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
