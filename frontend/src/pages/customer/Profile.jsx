import { useEffect, useState } from 'react'
import api from '../../services/api'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [message, setMessage] = useState('')
  const [pwMessage, setPwMessage] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  useEffect(() => {
    api.get('/customer/profile')
      .then((response) => {
        const user = response.data
        setProfile(user)
        setFullName(user.full_name)
        setPhone(user.phone || '')
        setEmail(user.email || '')
        setImageUrl(user.profile_picture_url || '')
      })
      .catch(() => setProfile(null))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const response = await api.put('/customer/profile', { full_name: fullName, phone })
      setProfile(response.data.user)
      setMessage('Profile updated successfully.')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to update profile.')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    try {
      const resp = await api.post('/auth/change-password', { current_password: currentPw, new_password: newPw })
      setPwMessage(resp.data.message || 'Password changed')
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      setPwMessage(err.response?.data?.error || 'Unable to change password')
    }
  }

  const handleImageUpdate = async (e) => {
    e.preventDefault()
    try {
      const resp = await api.put('/customer/profile', { full_name: fullName, phone, profile_picture_url: imageUrl })
      setProfile(resp.data.user)
      setMessage('Profile image updated')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to update image')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Customer Profile</h2>
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        {profile ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input value={email} readOnly className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Profile image URL</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              <button onClick={handleImageUpdate} className="mt-2 rounded-2xl bg-slate-200 px-3 py-2">Update image</button>
            </div>
            <button className="rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800">
              Save profile
            </button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </form>
        ) : (
          <p className="text-slate-600">Loading profile...</p>
        )}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="text-lg font-semibold">Change password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current password</label>
            <input value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} type="password" className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New password</label>
            <input value={newPw} onChange={(e) => setNewPw(e.target.value)} type="password" className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </div>
          <button className="rounded-2xl bg-violet-700 px-4 py-3 text-white">Change password</button>
          {pwMessage && <p className="text-sm text-slate-600">{pwMessage}</p>}
        </form>
      </div>
    </div>
  )
}

export default Profile
