import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import FeedbackForm from '../../components/ui/FeedbackForm'

function CustomerDashboard() {
  const auth = useSelector((state) => state.auth)
  const [upcoming, setUpcoming] = useState([])
  const [reviewedAppointments, setReviewedAppointments] = useState([])
  const [history, setHistory] = useState([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 })

  useEffect(() => {
    api.get('/customer/appointments')
      .then((response) => {
        const appts = response.data.appointments || []
        const now = new Date()
        const upcomingItems = appts
          .filter((a) => new Date(a.appointment_time) >= now)
          .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
        const pastItems = appts
          .filter((a) => new Date(a.appointment_time) < now)
          .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time))
        setUpcoming(upcomingItems)
        setHistory(pastItems)
        // compute stats
        const total = appts.length
        const completed = appts.filter((a) => a.status === 'completed').length
        const pending = appts.filter((a) => a.status === 'pending').length
        const cancelled = appts.filter((a) => a.status === 'cancelled').length
        setStats({ total, completed, pending, cancelled })
      })
      .catch(() => { setUpcoming([]); setHistory([]) })

    api.get('/customer/loyalty')
      .then((response) => setLoyaltyPoints(response.data.loyalty_points))
      .catch(() => setLoyaltyPoints(0))

    api.get('/customer/appointments')
      .then((response) => {
        const appointments = response.data.appointments || []
        const completed = appointments.filter((appointment) => appointment.status === 'completed')
        setReviewedAppointments(completed)
      })
      .catch(() => setReviewedAppointments([]))
  }, [])

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-violet-700 via-fuchsia-700 to-slate-900 p-8 text-white shadow-2xl shadow-slate-900/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-200/80">Welcome back</p>
            <h1 className="text-4xl font-semibold">{auth.user?.full_name || 'Salon Guest'}</h1>
            <p className="max-w-2xl text-slate-200">Your personal salon dashboard is ready. Review your upcoming visits, appointment status, and booking history in one premium experience.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Profile</p>
            <div className="mt-4 space-y-2 text-slate-100">
              <p className="text-lg font-semibold">{auth.user?.full_name || '–'}</p>
              <p className="text-sm text-slate-300">{auth.user?.email || '–'}</p>
              <p className="text-sm text-slate-300">{auth.user?.phone || 'No phone added'}</p>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-sm text-slate-200">Total Appointments</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-sm text-slate-200">Completed</p>
            <p className="text-2xl font-bold text-emerald-300">{stats.completed}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-sm text-slate-200">Pending</p>
            <p className="text-2xl font-bold text-amber-300">{stats.pending}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-sm text-slate-200">Cancelled</p>
            <p className="text-2xl font-bold text-rose-300">{stats.cancelled}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Upcoming appointments</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{upcoming.length}</p>
          <p className="mt-2 text-sm text-slate-500">Your next salon visit.</p>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Appointment history</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{history.length}</p>
          <p className="mt-2 text-sm text-slate-500">Past appointments at a glance.</p>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Loyalty status</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{loyaltyPoints}</p>
          <p className="mt-2 text-sm text-slate-500">Points earned for every visit.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Upcoming appointments</h2>
              <p className="mt-2 text-sm text-slate-500">Only your active bookings are shown here.</p>
            </div>
          </div>

          {upcoming.length ? (
            <div className="mt-6 space-y-4">
              {upcoming.map((appt) => (
                <div key={appt.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{formatDate(appt.appointment_time)}</p>
                      <p className="mt-2 text-sm text-slate-600">{appt.service?.name || 'Service selected'}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">{appt.status || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">No upcoming appointments yet. Book now to reserve your next visit.</p>
          )}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Appointment history</h2>
              <p className="mt-2 text-sm text-slate-500">Review your completed salon visits.</p>
            </div>
          </div>

          {history.length ? (
            <div className="mt-6 space-y-4">
              {history.map((appt) => (
                <div key={appt.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{formatDate(appt.appointment_time)}</p>
                      <p className="mt-2 text-sm text-slate-600">{appt.service?.name || 'Service completed'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{appt.status || 'Completed'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">You have not completed any appointments yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <FeedbackForm appointments={reviewedAppointments} />
      </section>
    </div>
  )
}

export default CustomerDashboard
