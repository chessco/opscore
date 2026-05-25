import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';
import OperatorWorkspace from './pages/OperatorWorkspace';
import SupervisorConsole from './pages/SupervisorConsole';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import CampaignsWorkspacePage from './pages/CampaignsWorkspacePage';
import CampaignsAdminPage from './pages/CampaignsAdminPage';
import LeadsAdminPage from './pages/LeadsAdminPage';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: <OperatorWorkspace />,
                children: [
                    {
                        path: 'tenants',
                        element: <TenantsPage />
                    },
                    {
                        path: 'users',
                        element: <UsersPage />
                    },
                    {
                        path: 'supervisor',
                        element: <SupervisorConsole />
                    },
                    {
                        path: 'audit-logs',
                        element: <AuditLogsPage />
                    },
                    {
                        path: 'settings',
                        element: <SettingsPage />
                    },
                    {
                        path: 'campaigns',
                        element: <CampaignsWorkspacePage />
                    },
                    {
                        path: 'campaigns-admin',
                        element: <CampaignsAdminPage />
                    },
                    {
                        path: 'leads',
                        element: <LeadsAdminPage />
                    }
                ]
            },
            {
                path: 'devices',
                element: <DevicesPage />
            },

        ],
    },
]);

export default router;
