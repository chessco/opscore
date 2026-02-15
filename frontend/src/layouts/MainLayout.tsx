import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Building2, Smartphone, User } from 'lucide-react';

export default function MainLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <h1 className="text-xl font-bold">CallCenter Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/" className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                        <Link to="/tenants" className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors">
                            <Building2 size={20} />
                            <span>Tenants</span>
                        </Link>
                    )}

                    {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                        <>
                            <Link to="/users" className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors">
                                <User size={20} />
                                <span>Usuarios</span>
                            </Link>
                            <Link to="/devices" className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors">
                                <Smartphone size={20} />
                                <span>Dispositivos</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{user?.fullName}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-600/10 text-red-400 p-2 rounded-lg hover:bg-red-600/20 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-gray-800 font-semibold">Panel de Control</h2>
                    {/* Additional Header Items could go here */}
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
