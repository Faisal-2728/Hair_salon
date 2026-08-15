import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { HiStar } from 'react-icons/hi2'
import api from '../../services/api'

export default function FeedbackForm({ appointments = [], onSubmitted }) {
  const auth = useSelector((state) => state.auth)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedAppointment = useMemo(() => {
    return appointments.find((appointment) => String(appointment.id) === String(selectedAppointmentId)) || appointments[0] || null
  }, [appointments, selectedAppointmentId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!auth.user) {
      setError('Please log in to submit feedback.')
      return
    }

    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      setError('Please share a short comment about your experience.')
      return
    }

    if (!selectedAppointment) {
      setError('No eligible appointment is available for feedback yet.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post('/reviews/', {
        rating,
        comment: trimmedComment,
        service_id: selectedAppointment.service?.id || selectedAppointment.service_id,
        appointment_id: selectedAppointment.id,
      })

      setMessage(response.data?.message || 'Thank you for your feedback.')
      setComment('')
      setRating(5)
      setSelectedAppointmentId(String(selectedAppointment.id))
      if (onSubmitted) {
        onSubmitted(response.data?.review)
      }
    } catch (submitError) {
      setError(submitError?.response?.data?.error || 'Unable to submit feedback right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!appointments.length) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <h3 className="text-lg font-semibold text-slate-950">Share your experience</h3>
        <p className="mt-2">Complete an appointment first so you can leave feedback for the salon team.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Leave feedback</h3>
          <p className="mt-2 text-sm text-slate-500">Your review helps us improve and keeps the experience personal.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Appointment
          <select
            value={selectedAppointmentId}
            onChange={(event) => setSelectedAppointmentId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-500"
          >
            {appointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.service?.name || 'Service'} • {new Date(appointment.appointment_time).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium text-slate-700">Rating</p>
          <div className="mt-2 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-full p-1 transition"
                aria-label={`Rate ${value} out of 5`}
              >
                <HiStar className={`text-2xl ${value <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-slate-600">{rating}/5</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Comment
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows="4"
            placeholder="Tell us about your experience..."
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-500"
          />
        </label>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Submitting...' : 'Submit feedback'}
      </button>
    </form>
  )
}
