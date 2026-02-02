export const AdminRoute = () => {
  const { user, loading, role } = useAuth()

  if (loading) return <div>Đang tải...</div>

  if (!user) return <Navigate to='/login' replace />

  if (role !== 'admin') {
    toast.error('Bạn không có quyền truy cập!')
    return <Navigate to='/' replace />
  }

  return <Outlet />
}
