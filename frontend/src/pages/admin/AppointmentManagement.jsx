import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusOptions = ['pending', 'confirmed', 'in_progress', 'rescheduled', 'completed', 'cancelled']

function AppointmentManagement() {
  const [appointments, setAppointments] = useState([])
  const [staffList, setStaffList] = useState([])
  const [assigning, setAssigning] = useState({})
  const [loading, setLoading] = useState(true)
  const [staffSelections, setStaffSelections] = useState({})
  const { showToast } = useToast()

  const loadAppointments = () => {
    setLoading(true)
    Promise.all([
      api.get('/appointments/manage'),
      api.get('/admin/staff'),
    ])
      .then(([apptRes, staffRes]) => {
        setAppointments(apptRes.data.appointments || [])
        setStaffList(staffRes.data.staff || [])
      })
      .catch(() => {
        setAppointments([])
        setStaffList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const updateStatus = async (appointmentId, status) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/status`, { status })
      setAppointments((current) => current.map((item) => (item.id === appointmentId ? response.data.appointment : item)))
      showToast(`Appointment marked as ${status}`, { variant: 'info' })
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to update status', { variant: 'error' })
    }
  }

  const assignStaff = async (appointmentId) => {
    const staffId = staffSelections[appointmentId]
    if (!staffId) {
      showToast('Select a staff member to assign', { variant: 'error' })
      return
    }
    try {
      setAssigning({ ...assigning, [appointmentId]: true })
      const resp = await api.put(`/admin/appointments/${appointmentId}/assign`, { staff_id: Number(staffId) })
      setAppointments((current) => current.map((item) => (item.id === appointmentId ? resp.data.appointment : item)))
      setStaffSelections({ ...staffSelections, [appointmentId]: '' })
      showToast('Appointment assigned successfully', { variant: 'info' })
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to assign appointment', { variant: 'error' })
    } finally {
      setAssigning({ ...assigning, [appointmentId]: false })
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`)
      setAppointments((current) => current.map((item) => (item.id === appointmentId ? response.data.appointment : item)))
      showToast('Appointment cancelled', { variant: 'info' })
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to cancel appointment', { variant: 'error' })
    }
  }

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-violet-600 to-violet-700 p-6 shadow-xl text-white">
        <h2 className="text-3xl font-bold">Appointment Management</h2>
        <p className="mt-2 text-violet-100">Manage bookings, assign staff, and track appointment status.</p>
      </section>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="mb-6 text-xl font-semibold">All Appointments ({appointments.length})</h3>
        {appointments.length ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:shadow-lg transition-shadow">
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg">{appointment.customer?.full_name || `Customer #${appointment.customer_id}`}</p>
                        <p className="text-sm text-slate-600 mt-1">{appointment.customer?.email} • {appointment.customer?.phone || 'No phone'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        appointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        appointment.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                        appointment.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {String(appointment.status).charAt(0).toUpperCase() + String(appointment.status).slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600">Service</p>
                        <p className="font-medium">{appointment.service?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Staff</p>
                        <p className="font-medium">{appointment.staff?.full_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Date & Time</p>
                        <p className="font-medium">{new Date(appointment.appointment_time).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Branch</p>
                        <p className="font-medium">{appointment.branch?.name || 'Any'}</p>
                      </div>
                    </div>
                    {appointment.notes && <p className="text-sm text-slate-600 italic">Notes: {appointment.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Assign Staff</label>
                      <select
                        value={staffSelections[appointment.id] || appointment.staff_id || ''}
                        onChange={(e) => setStaffSelections({ ...staffSelections, [appointment.id]: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Select staff...</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name || s.username}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => assignStaff(appointment.id)}
                        disabled={assigning[appointment.id]}
                        className="w-full rounded-xl bg-violet-600 text-white px-3 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                      >
                        {assigning[appointment.id] ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Status</label>
                      <div className="flex flex-wrap gap-1">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus(appointment.id, status)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              appointment.status === status
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {status.slice(0, 3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelAppointment(appointment.id)}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">No appointments yet.</p>
        )}
      </div>
    </div>
  )
}

export default AppointmentManagement
