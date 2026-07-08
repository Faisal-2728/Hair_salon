import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store from './app/store'
import api from './services/api'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'
import Landing from './pages/Landing'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import StaffDashboard from './pages/dashboard/StaffDashboard'
import ServiceManagement from './pages/admin/ServiceManagement'
import AppointmentManagement from './pages/admin/AppointmentManagement'
import InventoryManagement from './pages/admin/InventoryManagement'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import StaffManagement from './pages/admin/StaffManagement'
import CustomerManagement from './pages/admin/CustomerManagement'
import CustomerProfile from './pages/customer/Profile'
import BookingCenter from './pages/customer/BookingCenter'
import AssignedAppointments from './pages/staff/AssignedAppointments'
import StaffProfile from './pages/staff/Profile'
import RoleProtected from './routes/RoleProtected'
import ProtectedRoute from './routes/ProtectedRoute'
import { setUser, logout } from './features/auth/authSlice'
import './index.css'

const queryClient = new QueryClient()

function AppContent() {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  useEffect(() => {
    const token = auth.token || localStorage.getItem('salon_access') || localStorage.getItem('salon_token')
    if (token && !auth.user) {
      api.get('/auth/me')
        .then((response) => {
          dispatch(setUser(response.data.user))
        })
        .catch(() => {
          localStorage.removeItem('salon_access')
          localStorage.removeItem('salon_refresh')
          localStorage.removeItem('salon_token')
          dispatch(logout())
        })
    }
  }, [auth.token, auth.user, dispatch])

  function PublicRoutes() {
    return <Outlet />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoutes />}>
          <Route index element={<Landing />} />
          <Route path="auth/login" element={<Login />} />
          <Route path="auth/register" element={<Register />} />
          <Route path="auth/forgot-password" element={<ForgotPassword />} />
          <Route path="auth/reset-password" element={<ResetPassword />} />
          <Route path="auth/verify" element={<VerifyEmail />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="dashboard/customer" element={<RoleProtected roles={[ 'customer' ]}><CustomerDashboard /></RoleProtected>} />
            <Route path="dashboard/admin" element={<RoleProtected roles={[ 'admin' ]}><AdminDashboard /></RoleProtected>} />
            <Route path="dashboard/staff" element={<RoleProtected roles={[ 'staff' ]}><StaffDashboard /></RoleProtected>} />

            <Route path="admin/services" element={<RoleProtected roles={[ 'admin' ]}><ServiceManagement /></RoleProtected>} />
            <Route path="admin/appointments" element={<RoleProtected roles={[ 'admin' ]}><AppointmentManagement /></RoleProtected>} />
            <Route path="admin/inventory" element={<RoleProtected roles={[ 'admin' ]}><InventoryManagement /></RoleProtected>} />
            <Route path="admin/customers" element={<RoleProtected roles={[ 'admin' ]}><CustomerManagement /></RoleProtected>} />
            <Route path="admin/staff" element={<RoleProtected roles={[ 'admin' ]}><StaffManagement /></RoleProtected>} />
            <Route path="admin/analytics" element={<RoleProtected roles={[ 'admin' ]}><AnalyticsDashboard /></RoleProtected>} />

            <Route path="customer/profile" element={<RoleProtected roles={[ 'customer' ]}><CustomerProfile /></RoleProtected>} />
            <Route path="customer/bookings" element={<RoleProtected roles={[ 'customer' ]}><BookingCenter /></RoleProtected>} />
            <Route path="staff/assigned" element={<RoleProtected roles={[ 'staff' ]}><AssignedAppointments /></RoleProtected>} />
            <Route path="staff/profile" element={<RoleProtected roles={[ 'staff' ]}><StaffProfile /></RoleProtected>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  )
}

export default App
