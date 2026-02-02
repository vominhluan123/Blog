import { useAuth } from '@/contexts/useAuth' // context auth của bạn
import { Navigate, Outlet } from 'react-router'

export const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  // Đang kiểm tra trạng thái login → hiện loading để tránh flash
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    )
  }

  // Nếu đã login → cho vào trang con (Outlet)
  // Nếu chưa login → đuổi về /login
  return user ? <Outlet /> : <Navigate to='/login' replace />
}
