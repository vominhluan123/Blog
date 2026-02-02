import { Outlet } from 'react-router'
import AppProviders from './contexts/AppProviders'
import RootLayout from './pages/RootLayout'

function App() {
  return (
    <>
      <AppProviders>
        <RootLayout
        <Outlet />
      </AppProviders>
    </>
  )
}

export default App
