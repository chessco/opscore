import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User, UserRole } from '../services/userService';
import { Plus, Edit2, Trash2, User as UserIcon, Shield, UserCircle, XCircle, X, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authUser = useAuthStore(state => state.user);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'OPERATOR' as UserRole });
    const [submitting, setSubmitting] = useState(false);

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

    const handleCreateUser = async () => {
        if (!formData.fullName || !formData.email || !formData.password || !authUser?.tenantId) return;
        try {
            setSubmitting(true);
            await userService.create({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                tenant: { connect: { id: authUser.tenantId } }
            });
            setIsModalOpen(false);
            setFormData({ fullName: '', email: '', password: '', role: 'OPERATOR' });
            loadUsers();
        } catch (err) {
            alert('Error al crear usuario. Verifica los datos.');
            console.error(err);
        } finally {
            setSubmitting(false);
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
                    onClick={() => setIsModalOpen(true)}
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

            {/* Nuevo Usuario Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d] bg-[#0a0c10]">
                            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                <UserIcon size={18} className="text-blue-500" />
                                <span>Nuevo Usuario</span>
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="********"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rol</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="OPERATOR">Operador</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#1e222d] flex justify-end space-x-3 bg-[#0a0c10]">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={!formData.fullName || !formData.email || !formData.password || submitting}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-white/50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-colors"
                            >
                                <Save size={16} />
                                <span>{submitting ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
