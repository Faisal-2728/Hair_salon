import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowLeft, HiStar } from 'react-icons/hi2'
import api from '../../services/api'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const reviewsPerPage = 6

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true)
      try {
        const response = await api.get('/reviews/public')
        const payload = response.data?.reviews || []
        setReviews(payload)
        setHasMore(payload.length > reviewsPerPage)
      } catch (error) {
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
          <HiArrowLeft /> Back to home
        </Link>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Client feedback</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">All reviews</h1>
              <p className="mt-2 text-slate-400">A collection of recent experiences shared by our guests.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 text-slate-400">Loading reviews...</div>
          ) : reviews.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {reviews.slice(0, page * reviewsPerPage).map((review) => (
                <article key={review.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating || 0)].map((_, index) => (
                      <HiStar key={index} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-slate-300">“{review.comment || 'No comment provided.'}”</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>{review.user?.full_name || 'Valued guest'}</span>
                    <span>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-400">No reviews yet.</div>
          )}

          {hasMore && reviews.length > page * reviewsPerPage ? (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-full border border-violet-400/40 px-6 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/10"
              >
                Load more
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
