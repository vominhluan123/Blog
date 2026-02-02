// AuthRoute.tsx  ← Chỉ cho vào nếu CHƯA login (để tránh vào login khi đã đăng nhập)
export const AuthRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenSpinner />

  // ĐÃ login (dù chưa verify hay đã verify) → đuổi về trang chủ
  if (user) {
    return <Navigate to='/' replace />
  }

  // Chưa login → cho vào login/register/forgot/verify-email
  return <Outlet />
}
