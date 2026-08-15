import { useEffect, useState } from 'react'
import api from '../../services/api'

function StaffDashboard() {
  const [stats, setStats] = useState({ assigned_appointments: 0, today_availability: [], performance_score: 0 })

  useEffect(() => {
    api.get('/staff/dashboard')
      .then((response) => setStats(response.data))
      .catch(() => setStats({ assigned_appointments: 0, today_availability: [], performance_score: 0 }))
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/90 p-6 shadow-xl shadow-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Staff Dashboard</h2>
            <p className="mt-2 text-slate-600">Manage your schedule, appointments, and performance metrics.</p>
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase text-slate-500">Assigned appointments</p>
          <p className="mt-4 text-3xl font-semibold">{stats.assigned_appointments}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase text-slate-500">Today's availability</p>
          <p className="mt-4 text-3xl font-semibold">{stats.today_availability.length || '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase text-slate-500">Performance</p>
          <p className="mt-4 text-3xl font-semibold">{stats.performance_score || 'Pending'}</p>
        </div>
      </section>
    </div>
  )
}

export default StaffDashboard
