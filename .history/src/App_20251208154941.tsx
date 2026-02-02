import type { ReactNode } from 'react'
import AppProviders from './contexts/AppProviders'

function App({ children }: { children: ReactNode }) {
  return (
    <>
      <AppProviders>SignUp</AppProviders>
    </>
  )
}

export default App
