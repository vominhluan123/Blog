import type { ReactNode } from 'react'
import AppProviders from './contexts/AppProviders'
import SignUpPage from './pages/SignUpPage'

function App({ children }: { children: ReactNode }) {
  return (
    <>
      <AppProviders><SignUpPage></SignUpPage></AppProviders>
    </>
  )
}

export default App
