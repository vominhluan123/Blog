import type { ReactNode } from 'react'
import { AuthProvider } from './useAuth'

const AppProviders = ({ children }: { children: ReactNode }) => {
  return  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
    <AuthProvider>{children}</AuthProvider>
}
export default AppProviders
