import AppProviders from './contexts/AppProviders'
import SignUpPage from './pages/SignUpPage'

function App() {
  return (
    <>
      <Toaster />
      <AppProviders>
        <SignUpPage></SignUpPage>
      </AppProviders>
    </>
  )
}

export default App
