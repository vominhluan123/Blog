import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router-dom'

export const GuestRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    )
  }

  // Nếu chưa login → cho vào trang login/register
  // Nếu đã login → đuổi về trang chủ
  return user ? <Navigate to='/' replace /> : <Outlet />
}
