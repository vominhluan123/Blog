import type { ReactNode } from 'react'
import { AuthProvider } from '../firebase/useAuth'
import { ThemeProvider } from './ThemeContext'

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
export default AppProviders
