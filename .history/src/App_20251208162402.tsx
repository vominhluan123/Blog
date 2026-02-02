import { Toaster } from 'sonner'
import AppProviders from './contexts/AppProviders'
import SignUpPage from './pages/SignUpPage'

function App() {
  return (
    <>
      <Toaster richColors position='top-center' />
      <AppProviders>
        <SignUpPage></SignUpPage>
      </AppProviders>
    </>
  )
}

export default App
