import { useEffect, useState } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function AnalyticsDashboard() {
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/dashboard').catch(() => ({ data: {} })),
      api.get('/admin/reports').catch(() => ({ data: {} })),
    ])
      .then(([dashRes, reportRes]) => {
        const dashData = dashRes.data || {}
        const reportData = reportRes.data || {}
        setStats(dashData)
        setReports(reportData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  const statCards = [
    { label: 'Total Revenue', value: `$${(stats?.revenue || 0).toFixed(2)}`, color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: '💰' },
    { label: 'New Customers', value: reports?.new_customers_month || 0, color: 'bg-blue-50', textColor: 'text-blue-700', icon: '👥' },
    { label: 'Total Appointments', value: stats?.appointments_total || 0, color: 'bg-violet-50', textColor: 'text-violet-700', icon: '📅' },
    { label: 'Completed', value: reports?.appointments_by_status?.completed || 0, color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: '✅' },
    { label: 'Pending', value: reports?.appointments_by_status?.pending || 0, color: 'bg-amber-50', textColor: 'text-amber-700', icon: '⏳' },
  ]

  const appointmentStatuses = reports?.appointments_by_status || {}
  const staffPerformance = reports?.staff_performance || []

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 shadow-xl text-white">
        <h2 className="text-3xl font-bold">Analytics & Reports</h2>
        <p className="mt-2 text-indigo-100">Revenue insights, appointment performance, and staff metrics.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl ${card.color} p-5 shadow-lg hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <span className="text-3xl">{card.icon}</span>
            </div>
            <p className="text-xs font-semibold uppercase text-slate-600 mt-3">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="text-lg font-semibold mb-4">Appointment Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(appointmentStatuses).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="font-medium capitalize text-slate-700">{status}</div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        status === 'completed' ? 'bg-emerald-500' :
                        status === 'confirmed' ? 'bg-blue-500' :
                        status === 'pending' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`}
                      style={{ width: `${(count / Math.max(...Object.values(appointmentStatuses), 1)) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-700 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
          {(stats?.popular_services || []).length ? (
            <div className="space-y-2">
              {stats.popular_services.map((svc, idx) => (
                <div key={svc.service_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-medium">{svc.service_name}</p>
                    <p className="text-xs text-slate-600">#{idx + 1} Most Popular</p>
                  </div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-700">{svc.bookings}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No service data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
        {staffPerformance.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staffPerformance.map((staff) => (
              <div key={staff.staff_id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-lg transition-shadow">
                <p className="font-bold">{staff.staff_name || `Staff #${staff.staff_id}`}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Appointments</span>
                    <span className="font-semibold">{staff.total_appointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Completed</span>
                    <span className="font-semibold text-emerald-700">{staff.completed_appointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Completion Rate</span>
                    <span className="font-semibold text-blue-700">
                      {staff.total_appointments ? ((staff.completed_appointments / staff.total_appointments) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No staff performance data yet.</p>
        )}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
        {reports?.revenue_by_month && Object.keys(reports.revenue_by_month).length ? (
          <div className="space-y-2">
            {Object.entries(reports.revenue_by_month).map(([month, revenue]) => (
              <div key={month} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="font-medium text-slate-700">{month}</div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(revenue / Math.max(...Object.values(reports.revenue_by_month), 1)) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-emerald-700 w-20 text-right">${revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No revenue data yet.</p>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboard
