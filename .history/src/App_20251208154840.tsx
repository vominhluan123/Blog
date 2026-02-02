import type { ReactNode } from 'react'
import AppProviders from './contexts/AppProviders'

function App({ children }: { children : ReactNode}) {
  return (
    <>
      <AppProviders>{children}</AppProviders>
    </>
  )
}

export default App
