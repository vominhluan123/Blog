import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'

export const VerifiedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
     
    )
  }

  // Nếu user tồn tại VÀ emailVerified → cho vào Outlet
  // Nếu user tồn tại nhưng !emailVerified → redirect về /verify-email
  // Nếu !user → redirect về /login
  if (!user) {
    return <Navigate to='/login' replace />
  }
  if (!user.emailVerified) {
    return <Navigate to='/verify-email' replace />
  }
  return <Outlet />
}
