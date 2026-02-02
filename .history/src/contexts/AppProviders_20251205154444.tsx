import type { ReactNode } from 'react'
import { AuthProvider } from './useAuth'

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
export default AppProviders
