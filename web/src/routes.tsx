import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from './App'
import { AuthGuard } from './components/auth-guard'
import { GuestGuard } from './components/guest-guard'
import { appConfig } from './config/app-config'
import { LoginPage } from './pages/login'
import { Overview } from './pages/overview'
import { PermissionCodesPage } from './pages/permissions'
import { ProfilePage } from './pages/profile'
import { RolesPage } from './pages/roles'
import { UsersPage } from './pages/users'
import { DatasourcesPage } from './pages/datasources'
import { ProjectsPage } from './pages/projects'
import { DatasourceRulesPage } from './pages/datasource-rules'
import { WebhooksPage } from './pages/webhooks'
import { SqlWorkbenchPage } from './pages/sql-workbench'
import { TicketsPage } from './pages/tickets'
import { TicketDetailPage } from './pages/ticket-detail'
import { AuditsPage } from './pages/audits'
import { EscalationsPage } from './pages/escalations'
import { TestDataTablePage } from './pages/test-data-table'
import { TestLayoutOverflowPage } from './pages/test-layout-overflow'
import { FormDialogTestPage } from './pages/test-form-dialog'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Overview />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'datasources',
        element: <DatasourcesPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'datasource-rules',
        element: <DatasourceRulesPage />,
      },
      {
        path: 'webhooks',
        element: <WebhooksPage />,
      },
      {
        path: 'permissions',
        element: <PermissionCodesPage />,
      },
      {
        path: 'roles',
        element: <RolesPage />,
      },
      {
        path: 'sql-workbench',
        element: <SqlWorkbenchPage />,
      },
      {
        path: 'tickets',
        element: <TicketsPage />,
      },
      {
        path: 'tickets/:id',
        element: <TicketDetailPage />,
      },
      {
        path: 'audits',
        element: <AuditsPage />,
      },
      {
        path: 'escalations',
        element: <EscalationsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      ...(appConfig.testRoutes.enabled ? [
        {
          path: 'test/data-table',
          element: <TestDataTablePage />,
        },
        {
          path: 'test/layout-overflow',
          element: <TestLayoutOverflowPage />,
        },
        {
          path: 'test/form-dialog',
          element: <FormDialogTestPage />,
        },
      ] : []),
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
