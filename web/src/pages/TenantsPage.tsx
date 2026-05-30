import { useState, useEffect } from 'react';
import { tenantService } from '../services/tenantService';
import type { Tenant } from '../services/tenantService';
import { Plus, Edit2, Trash2, Building2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function TenantsPage() {
    const { user, token, setAuth } = useAuthStore() as any;
    const navigate = useNavigate();

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const data = await tenantService.getAll();
            setTenants(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar clientes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            try {
                await tenantService.delete(id);
                setTenants(tenants.filter(t => t.id !== id));
            } catch (err) {
                alert('Error al eliminar cliente');
            }
        }
    };

    const handleSwitchTenant = (tenantId: string, tenantName: string) => {
        if (!user || !token) return;
        const updatedUser = {
            ...user,
            tenantId: tenantId,
            tenant: {
                ...user.tenant,
                id: tenantId,
                name: tenantName
            }
        };
        setAuth(updatedUser, token);
        // Pequeño retardo para asegurar que el store y axios se actualicen antes de recargar
        setTimeout(() => {
            navigate('/');
            window.location.reload(); // Recargar para limpiar estados cacheados y forzar fresh fetch de todos los endpoints
        }, 100);
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
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                        <Building2 className="text-blue-500" size={24} />
                        <span>Clientes (Tenants)</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Administra las organizaciones registradas en el sistema.</p>
                </div>
                <button
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-bold"
                >
                    <Plus size={18} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center space-x-2 animate-in fade-in">
                    <XCircle size={20} />
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}

            <div className="bg-[#0d1017]/80 border border-[#1e222d] rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <table className="w-full text-left">
                    <thead className="bg-[#11141b]/60 border-b border-[#1e222d]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Slug</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e222d]">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-[#161b22]/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-600/15 border border-blue-500/20 p-2 rounded-xl text-blue-400">
                                            <Building2 size={20} />
                                        </div>
                                        <span className="font-bold text-white">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                                    {tenant.slug}
                                </td>
                                <td className="px-6 py-4">
                                    {tenant.active ? (
                                        <span className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            <CheckCircle size={14} />
                                            <span>Activo</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center space-x-1.5 bg-slate-500/10 border border-slate-500/20 text-slate-400 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            <XCircle size={14} />
                                            <span>Inactivo</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center space-x-3">
                                        {user?.tenantId !== tenant.id ? (
                                            <button 
                                                onClick={() => handleSwitchTenant(tenant.id, tenant.name)}
                                                className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg transition-all"
                                                title="Operar como este Tenant"
                                            >
                                                <LogIn size={14} />
                                                <span>Entrar</span>
                                            </button>
                                        ) : (
                                            <span className="flex items-center space-x-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                                                <CheckCircle size={14} />
                                                <span>Actual</span>
                                            </span>
                                        )}
                                        <button className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tenant.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                        >
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
