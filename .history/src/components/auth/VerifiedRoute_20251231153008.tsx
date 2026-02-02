// VerifiedRoute.tsx  ← Bắt buộc login + verify email
export const VerifiedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenSpinner />

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (!user.emailVerified) {
    return <Navigate to='/verify-email' replace />
  }

  return <Outlet />
}
