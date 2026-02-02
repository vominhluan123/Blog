import { Outlet } from 'react-router'
import AppProviders from './contexts/AppProviders'

function App() {
  return (
    <>
      <AppProviders>
        <RootLayout></RootLayout>
        <Outlet></Outlet>
      </AppProviders>
    </>
  )
}

export default App
