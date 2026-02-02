import AppProviders from './contexts/AppProviders'
import RootLayout from './pages/RootLayout'

function App() {
  return (
    <>
      <AppProviders>
        <RootLayout></RootLayout>
      </AppProviders>
    </>
  )
}

export default App
