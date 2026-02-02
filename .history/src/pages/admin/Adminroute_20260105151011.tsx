import FullScreenSpinner from '@/components/loading-button/FullScreenSpinner'
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'
import { toast } from 'sonner'

export const AdminRoute = () => {
  const { user, loading, role } = useAuth()

  if (loading) {
    return <FullScreenSpinner />
  }

  if (!user) return <Navigate to='/login' replace />

  if (role !== 'admin') {
    toast.error('Bạn không có quyền truy cập!')
    return <Navigate to='/' replace />
  }

  return <Outlet />
}
