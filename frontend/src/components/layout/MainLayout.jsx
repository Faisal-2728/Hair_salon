import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'

function MainLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const role = auth.user?.role || 'customer'

  const handleLogout = () => {
    localStorage.removeItem('salon_access')
    localStorage.removeItem('salon_refresh')
    localStorage.removeItem('salon_token')
    dispatch(logout())
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-700 px-3 py-2 text-white">Salon</div>
            <h1 className="text-lg font-semibold">Salon Management</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Link to={role === 'admin' ? '/dashboard/admin' : role === 'staff' ? '/dashboard/staff' : '/dashboard/customer'} className="hover:text-slate-900">
              Dashboard
            </Link>
            {role === 'customer' && (
              <Link to="/customer/bookings" className="hover:text-slate-900">Bookings</Link>
            )}
            {role === 'admin' && (
              <>
                <Link to="/admin/services" className="hover:text-slate-900">Services</Link>
                <Link to="/admin/appointments" className="hover:text-slate-900">Appointments</Link>
                <Link to="/admin/customers" className="hover:text-slate-900">Customers</Link>
                <Link to="/admin/inventory" className="hover:text-slate-900">Inventory</Link>
                <Link to="/admin/staff" className="hover:text-slate-900">Staff</Link>
                <Link to="/admin/analytics" className="hover:text-slate-900">Analytics</Link>
              </>
            )}
            {role === 'staff' && (
              <Link to="/staff/assigned" className="hover:text-slate-900">Assigned</Link>
            )}
            <button onClick={handleLogout} className="rounded-full bg-slate-100 px-4 py-2 text-slate-600 hover:bg-slate-200">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
