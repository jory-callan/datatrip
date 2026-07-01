import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'

import { AppearanceProvider } from './components/appearance-provider'
import { QueryProvider } from './lib/query-provider'
import { router } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AppearanceProvider
        defaultTheme="system"
      >
        <RouterProvider router={router} />
      </AppearanceProvider>
    </QueryProvider>
  </StrictMode>
)
