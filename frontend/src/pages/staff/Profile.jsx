import { useEffect, useState } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function StaffProfile() {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/staff/profile')
      .then((r) => setStaff(r.data.staff))
      .catch(() => setStaff(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  if (!staff) return <div className="p-6">Staff profile not found.</div>

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-slate-100 overflow-hidden">
          {staff.profile_picture_url ? <img src={staff.profile_picture_url} alt="profile" className="h-full w-full object-cover" /> : null}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{staff.full_name || staff.username}</h2>
          <div className="text-sm text-slate-600">{staff.email}</div>
          <div className="text-sm text-slate-600">{staff.phone || 'No phone on record'}</div>
        </div>
      </div>
    </div>
  )
}

export default StaffProfile
