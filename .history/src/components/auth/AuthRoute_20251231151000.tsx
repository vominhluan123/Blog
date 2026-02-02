// src/components/auth/AuthRoute.tsx (hoặc UnauthenticatedRoute.tsx)
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'

export const AuthRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    )
  }

  // Nếu ĐÃ login (user tồn tại) → đuổi về trang chủ
  // Không quan tâm emailVerified ở đây, vì các trang auth không cần verify
  if (user) {
    return <Navigate to='/' replace />
  }

  // Chưa login → cho vào Outlet (login, register, forgot, verify-email)
  return <Outlet />
}
