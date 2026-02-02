import type { ReactNode } from 'react'
import { AuthProvider } from './useAuth'

const AppProviders = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>
}
export default AppProviders
