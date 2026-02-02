// src/components/auth/AuthRoute.tsx
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Outlet } from 'react-router'
import FullScreenSpinner from '../loading-button/FullScreenSpinner'

export const AuthRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <FullScreenSpinner />
  }

  // ĐÃ login → kiểm tra thêm: nếu chưa verify thì cho vào /verify-email (nếu đang cố vào login/register)
  // Nhưng vì /verify-email nằm trong AuthRoute, ta cần cho phép trường hợp chưa verify
  if (user) {
    if (user.emailVerified) {
      return <Navigate to='/' replace />
    }

    return <Outlet />
  }

  return <Outlet />
}
