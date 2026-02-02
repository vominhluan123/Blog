import AppProviders from './contexts/AppProviders'

function App({ children }: { children : ReactN}) {
  return (
    <>
      <AppProviders>{children}</AppProviders>
    </>
  )
}

export default App
