import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from './components/app-sidebar'
import { ErrorBoundary } from './components/error-boundary'
import { SiteHeader } from './components/site-header'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'
import { Toaster } from './components/ui/sonner'

const SIDEBAR_LS_KEY = 'sidebar-open'

function AppContent() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_LS_KEY)
    return stored !== null ? stored === 'true' : true
  })

  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open)
    localStorage.setItem(SIDEBAR_LS_KEY, String(open))
  }

  return (
    <>
      <SidebarProvider
        defaultOpen={true}
        open={sidebarOpen}
        onOpenChange={handleSidebarChange}
        className="!min-h-dvh !h-auto !overflow-visible"
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="min-h-dvh">
          <SiteHeader />
          <div className="@container/main flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-2 py-2 md:gap-3">
              <div className="px-4 lg:px-6">
                <ErrorBoundary key={location.pathname}>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  )
}

function App() {
  return <AppContent />
}

export default App
