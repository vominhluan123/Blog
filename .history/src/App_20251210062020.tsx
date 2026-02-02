import AppProviders from './contexts/AppProviders'
import SignUpPage from './pages/SignUpPage'

function App() {
  return (
    <>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </>
  )
}

export default App
