import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { ThemeProvider } from './components/theme/theme-provider'
import { Toaster } from './components/ui/sonner'
import AppProviders from './contexts/AppProviders'
import './index.css'
import { router } from './router'
// tắt scroll restoration mặc định của browser

createRoot(document.getElementById('root')!).render(
  <>
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <AppProviders>
        <Toaster richColors position='top-right' />
        <RouterProvider router={router} />
      </AppProviders>
    </ThemeProvider>
  </>
)
