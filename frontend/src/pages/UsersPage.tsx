import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User, UserRole } from '../services/userService';
import { Plus, Edit2, Trash2, User as UserIcon, Shield, UserCircle, XCircle } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAll();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar usuarios');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'ADMIN':
                return (
                    <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <Shield size={12} />
                        <span>Admin</span>
                    </span>
                );
            case 'SUPERVISOR':
                return (
                    <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <UserIcon size={12} />
                        <span>Supervisor</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <UserCircle size={12} />
                        <span>Operador</span>
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <p className="text-gray-500">Gestiona los usuarios y sus roles dentro del sistema.</p>
                </div>
                <button
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
                    <XCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Rol</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{user.fullName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
