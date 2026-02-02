import { Toaster } from 'sonner'
import AppProviders from './contexts/AppProviders'
import SignUpPage from './pages/SignUpPage'

function App() {
  return (
    <>
      <AppProviders>
        <Toaster richColors position='top-center' />
        <SignUpPage></SignUpPage>
      </AppProviders>
    </>
  )
}

export default App
