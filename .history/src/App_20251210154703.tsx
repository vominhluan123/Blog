import { Outlet } from 'react-router'
import RootLayout from './pages/RootLayout'

function App() {
  return (
    <>
      <RootLayout>
        <Outlet></Outlet>
      </RootLayout>
    </>
  )
}

export default App
