import { Outlet } from 'react-router'
import AppProviders from './contexts/AppProviders'

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
