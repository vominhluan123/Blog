import AppProviders from './contexts/AppProviders'

function App({ children }: { children : }) {
  return (
    <>
      <AppProviders>{children}</AppProviders>
    </>
  )
}

export default App
