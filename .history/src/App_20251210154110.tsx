import AppProviders from './contexts/AppProviders'
import RootLayout from './pages/RootLayout'

function App() {
  return (
    <>
      <AppProviders>
        <Outlet></Outlet>
      </AppProviders>
    </>
  )
}

export default App
