import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'
import { toast } from 'sonner'

export const AdminRoute = () => {
  const { user, loading, role } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />

  if (role !== 'admin') {
    toast.error('Bạn không có quyền truy cập!')
    return <Navigate to='/' replace />
  }

  return <Outlet />
}
