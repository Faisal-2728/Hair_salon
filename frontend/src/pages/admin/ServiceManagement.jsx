import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const defaultForm = { name: '', category: '', price: '', duration_minutes: '', description: '', active: true }

function ServiceManagement() {
  const [services, setServices] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const loadServices = () => {
    api.get('/services')
      .then((response) => setServices(response.data.services))
      .catch(() => setServices([]))
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleChange = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value
    setForm({ ...form, [field]: value })
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    setImageFile(file || null)
    setImagePreview(file ? URL.createObjectURL(file) : '')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('category', form.category)
      formData.append('description', form.description)
      formData.append('price', form.price || '0')
      formData.append('duration_minutes', form.duration_minutes || '30')
      formData.append('active', form.active)
      if (imageFile) {
        formData.append('image_file', imageFile)
      }

      let response
      if (editingId) {
        response = await api.put(`/services/${editingId}`, formData)
        setServices((current) => current.map((item) => (item.id === editingId ? response.data.service : item)))
        showToast('Service updated successfully.')
        setMessage('Service updated successfully.')
      } else {
        response = await api.post('/services', formData)
        setServices((current) => [...current, response.data.service])
        showToast('Service created successfully.')
        setMessage('Service created successfully.')
      }

      setForm(defaultForm)
      setEditingId(null)
      setImageFile(null)
      setImagePreview('')
    } catch (error) {
      const errMsg = error.response?.data?.details || error.response?.data?.error || 'Unable to save service.'
      showToast(errMsg, { variant: 'error' })
      setMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service) => {
    setEditingId(service.id)
    setForm({
      name: service.name || '',
      category: service.category || '',
      price: service.price?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      description: service.description || '',
      active: service.active ?? true,
    })
    setImageFile(null)
    setImagePreview(service.image_url || '')
    setMessage(`Editing service: ${service.name}`)
  }

  const handleDelete = async (serviceId) => {
    setLoading(true)
    try {
      await api.delete(`/services/${serviceId}`)
      setServices((current) => current.filter((service) => service.id !== serviceId))
      showToast('Service archived successfully.')
      setMessage('Service archived successfully.')
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Unable to remove service.'
      showToast(errMsg, { variant: 'error' })
      setMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/90 p-6 shadow-xl shadow-slate-200">
        <div>
          <h2 className="text-2xl font-semibold">Service Management</h2>
          <p className="mt-2 text-slate-600">Create, edit, and categorize salon services.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="mb-4 text-xl font-semibold">Available services</h3>
          {services.length ? (
            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-slate-600">{service.category || 'General'}</p>
                      <p className="mt-2 text-slate-800">${service.price?.toFixed(2) || '0.00'} • {service.duration_minutes} min</p>
                      <p className="mt-2 text-sm text-slate-500">{service.description}</p>
                      <p className="mt-2 text-sm text-slate-500">Status: {service.active ? 'Active' : 'Inactive'}</p>
                    </div>
                    {service.image_url && (
                      <div className="h-24 w-24 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                        <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleEdit(service)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(service.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">
                        Archive
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No services found.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="mb-4 text-xl font-semibold">{editingId ? 'Update service' : 'Create service'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Name" value={form.name} onChange={handleChange('name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            <input type="text" placeholder="Category" value={form.category} onChange={handleChange('category')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
            <input type="number" placeholder="Price" value={form.price} onChange={handleChange('price')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            <input type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={handleChange('duration_minutes')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            <label className="block text-sm font-medium text-slate-700">Service image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
            {imagePreview && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-2">
                <img src={imagePreview} alt="Service preview" className="h-40 w-full object-cover" />
              </div>
            )}
            <textarea placeholder="Description" value={form.description} onChange={handleChange('description')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows="4" />
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.active} onChange={handleChange('active')} className="rounded" />
              Active service
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800 disabled:opacity-60">{loading ? <LoadingSpinner className="mx-auto" /> : (editingId ? 'Update service' : 'Save service')}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(defaultForm); setMessage('') }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 hover:bg-slate-100">
                Cancel edit
              </button>
            )}
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default ServiceManagement
