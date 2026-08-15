import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function AssignedAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState({})
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/staff/appointments')
      .then((response) => setAppointments(response.data.appointments))
      .catch(() => setAppointments([]))
  }, [])

  const updateStatus = async (appointmentId, newStatus) => {
    setLoading({ ...loading, [appointmentId]: true })
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus })
      setAppointments((curr) => curr.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a))
      showToast(`Appointment ${newStatus}`)
    } catch (e) {
      showToast(`Failed to update appointment: ${e.response?.data?.error || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading({ ...loading, [appointmentId]: false })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Assigned Appointments</h2>
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        {appointments.length ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Appointment #{appointment.id}</h3>
                    <p className="text-sm text-slate-600">Customer: {appointment.customer?.full_name || `#${appointment.customer_id}`}</p>
                    <p className="text-sm text-slate-600">Contact: {appointment.customer?.email || ''}{appointment.customer?.phone ? ` • ${appointment.customer.phone}` : ''}</p>
                    <p className="text-sm text-slate-600">Service: {appointment.service?.name || appointment.service_id}</p>
                    <p className="text-sm text-slate-600">Status: {String(appointment.status).charAt(0).toUpperCase() + String(appointment.status).slice(1)}</p>
                  </div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">{new Date(appointment.appointment_time).toLocaleString()}</span>
                </div>
                <p className="mt-3 text-slate-700">Notes: {appointment.notes || 'None'}</p>
                <div className="mt-3 flex gap-2">
                  <button disabled={loading[appointment.id]} onClick={() => updateStatus(appointment.id, 'in_progress')} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50">
                    {loading[appointment.id] ? <LoadingSpinner className="h-4 w-4" /> : 'Start'}
                  </button>
                  <button disabled={loading[appointment.id]} onClick={() => updateStatus(appointment.id, 'completed')} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                    {loading[appointment.id] ? <LoadingSpinner className="h-4 w-4" /> : 'Complete'}
                  </button>
                  <button disabled={loading[appointment.id]} onClick={() => updateStatus(appointment.id, 'cancelled')} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                    {loading[appointment.id] ? <LoadingSpinner className="h-4 w-4" /> : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No assigned appointments yet.</p>
        )}
      </div>
    </div>
  )
}

export default AssignedAppointments
