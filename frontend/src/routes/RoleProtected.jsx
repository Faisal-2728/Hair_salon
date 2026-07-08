import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function RoleProtected({ children, roles = [] }) {
  const auth = useSelector((state) => state.auth)
  const userRole = auth.user?.role
  if (!auth.token) return <Navigate to="/auth/login" replace />
  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-slate-600">
        <p>Loading your session...</p>
      </div>
    )
  }
  if (roles.length && !roles.includes(userRole)) return <Navigate to="/auth/login" replace />
  return children
}

export default RoleProtected
