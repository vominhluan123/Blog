import type { ReactNode } from 'react'

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
export default AppProviders
