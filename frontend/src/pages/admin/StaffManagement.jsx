import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const defaultForm = { full_name: '', email: '', phone: '', password: '', verified: false, active: true }

function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const loadStaff = () => {
    setLoading(true)
    return api.get('/admin/staff')
      .then((response) => {
        const staffData = response.data.staff || []
        return Promise.all(
          staffData.map((member) =>
            api.get(`/appointments/manage?staff_id=${member.id}`)
              .then((res) => ({
                ...member,
                appointmentCount: res.data.appointments ? res.data.appointments.length : 0,
              }))
              .catch(() => ({ ...member, appointmentCount: 0 }))
          )
        ).then(setStaff)
      })
      .catch(() => {
        setStaff([])
        showToast('Failed to load staff', { variant: 'error' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleChange = (field) => (event) => {
    const value = field === 'verified' || field === 'active' ? event.target.checked : event.target.value
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        verified: form.verified,
        active: form.active,
      }
      if (form.password) {
        payload.password = form.password
      }

      let response
      if (editingId) {
        response = await api.put(`/admin/staff/${editingId}`, payload)
        setStaff((current) => current.map((member) => (member.id === editingId ? response.data.staff : member)))
        showToast('Staff member updated successfully', { variant: 'info' })
      } else {
        response = await api.post('/admin/staff', { ...payload, password: form.password || 'Staff123!' })
        setStaff((current) => [...current, { ...response.data.staff, appointmentCount: 0 }])
        showToast('Staff member added successfully', { variant: 'info' })
      }
      setForm(defaultForm)
      setEditingId(null)
    } catch (error) {
      showToast(error.response?.data?.details || error.response?.data?.error || 'Unable to save staff member', { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (member) => {
    setEditingId(member.id)
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '',
      verified: member.verified || false,
      active: member.is_active ?? true,
    })
    showToast(`Editing: ${member.full_name}`, { variant: 'info' })
  }

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure? This will deactivate the staff account.')) return
    try {
      await api.delete(`/admin/staff/${memberId}`)
      setStaff((current) => current.filter((member) => member.id !== memberId))
      showToast('Staff member deactivated', { variant: 'info' })
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to deactivate staff member', { variant: 'error' })
    }
  }

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-orange-600 to-orange-700 p-6 shadow-xl text-white">
        <h2 className="text-3xl font-bold">Staff Management</h2>
        <p className="mt-2 text-orange-100">Create, update, and manage salon staff accounts.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Staff Roster ({staff.length})</h3>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700">
              Active: {staff.filter(s => s.is_active).length}
            </span>
          </div>

          {staff.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{member.full_name}</p>
                        <p className="text-sm text-slate-600">{member.email}</p>
                        {member.phone && <p className="text-sm text-slate-600">{member.phone}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        member.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-blue-50 p-2 text-center">
                        <p className="text-lg font-bold text-blue-700">{member.appointmentCount}</p>
                        <p className="text-xs text-blue-600">Appointments</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-2 text-center">
                        <p className="text-xs font-medium text-purple-600">
                          {member.verified ? '✓ Verified' : 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(member.id)}
                        className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No staff members yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="mb-6 text-xl font-semibold">
            {editingId ? '✏️ Update Staff' : '➕ Add Staff'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={handleChange('full_name')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange('phone')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="password"
              placeholder={editingId ? 'Leave empty to keep current' : 'Password'}
              value={form.password}
              onChange={handleChange('password')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={form.verified} onChange={handleChange('verified')} className="rounded w-4 h-4" />
              <span className="text-sm text-slate-700">Email verified</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={form.active} onChange={handleChange('active')} className="rounded w-4 h-4" />
              <span className="text-sm text-slate-700">Account active</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-white font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Staff' : 'Create Staff'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(defaultForm)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default StaffManagement
