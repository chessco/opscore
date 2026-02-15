import { useState, useEffect } from 'react';
import { tenantService } from '../services/tenantService';
import type { Tenant } from '../services/tenantService';
import { Plus, Edit2, Trash2, Building2, CheckCircle, XCircle } from 'lucide-react';

export default function TenantsPage() {
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
                    <h1 className="text-2xl font-bold text-gray-900">Clientes (Tenants)</h1>
                    <p className="text-gray-500">Administra las organizaciones registradas en el sistema.</p>
                </div>
                <button
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nuevo Cliente</span>
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
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Slug</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                            <Building2 size={20} />
                                        </div>
                                        <span className="font-medium text-gray-900">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                                    {tenant.slug}
                                </td>
                                <td className="px-6 py-4">
                                    {tenant.active ? (
                                        <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                            <CheckCircle size={12} />
                                            <span>Activo</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                            <XCircle size={12} />
                                            <span>Inactivo</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tenant.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
