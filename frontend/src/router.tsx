import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';
import OperatorWorkspace from './pages/OperatorWorkspace';
import SupervisorConsole from './pages/SupervisorConsole';
import AuditLogsPage from './pages/AuditLogsPage';
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
