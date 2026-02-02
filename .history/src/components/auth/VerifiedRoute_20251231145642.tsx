import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'

export const VerifiedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
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
