import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children }) {
  const auth = useSelector((state) => state.auth)
  if (!auth.token) {
    return <Navigate to="/auth/login" replace />
  }
  return children
}

export default ProtectedRoute
