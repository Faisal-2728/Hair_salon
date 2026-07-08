import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'

function BookingCenter() {
  const auth = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailService, setDetailService] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/services')
      .then((response) => setServices(response.data.services || []))
      .catch(() => setServices([]))
  }, [])

  useEffect(() => {
    if (!date || !selectedServices.length) {
      setAvailableSlots([])
      return
    }

    const fetchSlots = async () => {
      try {
        const slotLists = []
        for (const service of selectedServices) {
          const response = await api.get('/appointments/availability', { params: { service_id: service.id, date } })
          slotLists.push(response.data.available_slots || [])
        }
        const intersected = slotLists.reduce((common, list) => common.filter((slot) => list.includes(slot)))
        setAvailableSlots(intersected)
        if (!intersected.length) setTime('')
      } catch (error) {
        setAvailableSlots([])
      }
    }

    fetchSlots()
  }, [date, selectedServices])

  const toggleService = (service) => {
    setMessage('')
    setSelectedServices((current) => {
      return current.some((item) => item.id === service.id)
        ? current.filter((item) => item.id !== service.id)
        : [...current, service]
    })
  }

  const handleBook = async (event) => {
    event.preventDefault()
    
    // Check if user is logged in - redirect to login if not
    if (!auth.user || !auth.token) {
      showToast('Please log in to book an appointment.', { variant: 'info' })
      navigate('/auth/login', { state: { from: '/dashboard/customer', returnTo: 'booking' } })
      return
    }

    if (!selectedServices.length || !date || !time) {
      showToast('Please select at least one service, date and time.', { variant: 'error' })
      return
    }

    const appointmentTime = `${date}T${time}`
    const service_ids = selectedServices.map((service) => service.id)
    setLoading(true)

    try {
      const response = await api.post('/customer/appointments/book', {
        service_id: service_ids,
        appointment_time: appointmentTime,
      })
      showToast(response.data.message || 'Appointment booked successfully!', { variant: 'success' })
      setSelectedServices([])
      setDate('')
      setTime('')
      setAvailableSlots([])
      setMessage('')
    } catch (error) {
      const msg = error.response?.data?.error || 'Booking failed.'
      showToast(msg, { variant: 'error' })
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/40">
      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-[2rem] bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Book your visit</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Premium service booking made effortless.</h2>
            <p className="mt-3 text-slate-400">Select multiple services, choose a date and time, and confirm your appointment in a polished interface.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {services.length ? services.map((service) => {
              const selected = selectedServices.some((item) => item.id === service.id)
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`group flex flex-col overflow-hidden rounded-[1.75rem] border p-5 text-left transition ${selected ? 'border-violet-300/60 bg-violet-500/15 shadow-[0_24px_85px_-50px_rgba(139,92,246,0.75)]' : 'border-white/10 bg-slate-900/80 hover:border-violet-300/30 hover:bg-slate-900/95'}`}
                >
                  <div className="mb-4 h-40 overflow-hidden rounded-3xl bg-slate-800">
                    {/* Add salon image here */}
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">Image placeholder</div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                      {selected && <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-violet-200">Selected</span>}
                    </div>
                    <p className="text-sm leading-6 text-slate-400">{service.description ? (service.description.length > 110 ? `${service.description.slice(0, 110)}...` : service.description) : 'Premium salon service.'}</p>
                  </div>
                </button>
              )
            }) : (
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-8 text-center text-slate-500">No services available right now.</div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 text-slate-100 shadow-xl shadow-black/30">
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Your reservation</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Confirm your appointment</h3>
            </div>

            <form onSubmit={handleBook} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300">Selected services</label>
                <div className="mt-3 space-y-3">
                  {selectedServices.length ? selectedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{service.name}</p>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{service.category || 'Service'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedServices((prev) => prev.filter((item) => item.id !== service.id))}
                        className="text-sm font-semibold text-violet-300 hover:text-violet-100"
                      >
                        Remove
                      </button>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/80 px-4 py-6 text-center text-slate-500">Choose services to continue.</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Time</label>
                {availableSlots.length ? (
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none"
                  >
                    <option value="">Select a time</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none"
                  />
                )}
              </div>

              {message && <div className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{message}</div>}

              {!auth.user ? (
                <button
                  type="button"
                  onClick={() => navigate('/auth/login', { state: { from: '/dashboard/customer', returnTo: 'booking' } })}
                  className="w-full rounded-3xl bg-violet-500 px-5 py-4 text-base font-semibold text-white transition hover:bg-violet-400"
                >
                  Sign in to book
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-3xl bg-violet-500 px-5 py-4 text-base font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Booking…' : 'Book appointment'}
                </button>
              )}
            </form>

            {!auth.user && (
              <div className="rounded-3xl border border-violet-500/10 bg-violet-500/5 p-4 text-sm text-slate-200">
                New to our salon? <Link to="/auth/register" className="font-semibold text-violet-200 underline">Create an account</Link> or <Link to="/auth/login" className="font-semibold text-violet-200 underline">sign in</Link> to continue.
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-400">
              <div className="flex items-center justify-between">
                <span>Services</span>
                <span>{selectedServices.length}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span>Date</span>
                <span>{date || '-'}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span>Time</span>
                <span>{time || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {detailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-w-2xl rounded-[2rem] bg-slate-950 p-8 shadow-2xl shadow-black/80">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">{detailService.name}</h3>
                <p className="mt-3 text-slate-400">{detailService.description || 'Detailed service information.'}</p>
              </div>
              <button
                onClick={() => setDetailService(null)}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-violet-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingCenter
