import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, Plus, Edit2, Trash2, Loader2, X, Save, Upload, Phone, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface Campaign {
    id: string;
    name: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export default function LeadsAdminPage() {
    const [searchParams] = useSearchParams();
    const initialCampaignId = searchParams.get('campaignId') || '';

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId);

    const [leads, setLeads] = useState<Lead[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Lead CRUD
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', metadataText: '' });

    // Modal state for Bulk Import
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [leadsInput, setLeadsInput] = useState('');
    const [importingLeads, setImportingLeads] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaignId) {
            fetchLeads();
        } else {
            setLeads([]);
        }
    }, [selectedCampaignId]);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
            if (!selectedCampaignId && res.data.length > 0) {
                setSelectedCampaignId(res.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching campaigns', err);
        }
    };

    const fetchLeads = async () => {
        try {
            setLoadingLeads(true);
            const res = await api.get(`/leads/campaign/${selectedCampaignId}`);
            setLeads(res.data);
        } catch (err) {
            console.error('Error fetching leads', err);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleOpenLeadModal = (lead?: Lead) => {
        if (lead) {
            setEditingLead(lead);
            setLeadForm({
                name: lead.name,
                phone: lead.phone,
                metadataText: lead.metadata ? JSON.stringify(lead.metadata, null, 2) : ''
            });
        } else {
            setEditingLead(null);
            setLeadForm({ name: '', phone: '', metadataText: '' });
        }
        setIsLeadModalOpen(true);
    };

    const handleSaveLead = async () => {
        if (!selectedCampaignId) return;

        let parsedMetadata = null;
        if (leadForm.metadataText.trim()) {
            try {
                parsedMetadata = JSON.parse(leadForm.metadataText);
            } catch (err) {
                alert('El campo metadatos debe ser un JSON válido o estar vacío.');
                return;
            }
        }

        try {
            if (editingLead) {
                await api.patch(`/leads/${editingLead.id}`, {
                    name: leadForm.name,
                    phone: leadForm.phone,
                    metadata: parsedMetadata
                });
            } else {
                await api.post('/leads', {
                    campaignId: selectedCampaignId,
                    name: leadForm.name,
                    phone: leadForm.phone,
                    metadata: parsedMetadata
                });
            }
            setIsLeadModalOpen(false);
            fetchLeads();
        } catch (err) {
            console.error('Error saving lead', err);
            alert('Error al guardar el lead');
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este lead y todo su historial de interacciones?')) return;
        try {
            await api.delete(`/leads/${id}`);
            fetchLeads();
        } catch (err) {
            console.error('Error deleting lead', err);
            alert('Error al eliminar el lead');
        }
    };

    const handleReviveLead = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas revivir este lead? Volverá a la cola para ser marcado.')) return;
        try {
            await api.patch(`/leads/${id}/status`, { status: 'QUEUED' });
            fetchLeads();
        } catch (err) {
            console.error('Error reviving lead', err);
            alert('Error al revivir el lead');
        }
    };

    const handleImportLeads = async () => {
        if (!selectedCampaignId || !leadsInput.trim()) return;

        try {
            setImportingLeads(true);

            const lines = leadsInput.split('\n').filter(line => line.trim() !== '');
            const parsedLeads = lines.map(line => {
                const parts = line.split(/[,	]+/).map(p => p.trim());
                if (parts.length >= 2) {
                    return { name: parts[0], phone: parts[1] };
                }
                return { name: 'Desconocido', phone: line.trim() };
            });

            if (parsedLeads.length === 0) {
                alert('No se encontraron leads válidos en el texto.');
                return;
            }

            await api.post('/leads/import', {
                campaignId: selectedCampaignId,
                leads: parsedLeads
            });

            alert(`¡Se importaron ${parsedLeads.length} leads exitosamente!`);
            setIsBulkModalOpen(false);
            fetchLeads();
        } catch (err) {
            console.error('Error importing leads', err);
            alert('Error al importar los leads');
        } finally {
            setImportingLeads(false);
        }
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm)
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center space-x-2">
                        <Users size={24} className="text-blue-500" />
                        <span>Gestión de Leads</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Administra la base de datos de contactos por campaña</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => { setLeadsInput(''); setIsBulkModalOpen(true); }}
                        disabled={!selectedCampaignId}
                        className="bg-[#11141b] hover:bg-blue-500/10 border border-[#1e222d] hover:border-blue-500/30 text-slate-300 hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload size={16} />
                        <span>Importación Masiva</span>
                    </button>
                    <button
                        onClick={() => handleOpenLeadModal()}
                        disabled={!selectedCampaignId}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        <span>Nuevo Lead</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#1e222d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0c10]">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Campaña:</label>
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="w-full sm:w-64 bg-[#11141b] border border-[#1e222d] rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">Selecciona una Campaña</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#11141b] border border-[#1e222d] rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loadingLeads ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : !selectedCampaignId ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Users size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Selecciona una campaña para ver sus leads</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Search size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No se encontraron leads para esta campaña</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#1e222d] bg-[#0a0c10]">
                                    <th className="py-3 px-6">ID / Nombre</th>
                                    <th className="py-3 px-6">Teléfono</th>
                                    <th className="py-3 px-6">Estado</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="border-b border-[#1e222d] hover:bg-white/5 transition-colors group">
                                        <td className="py-3 px-6">
                                            <div className="text-sm font-bold text-white">{lead.name}</div>
                                            <div className="text-[10px] font-mono text-slate-500">{lead.id}</div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center space-x-1.5 text-sm text-slate-300">
                                                <Phone size={14} className="text-slate-500" />
                                                <span className="font-mono">{lead.phone}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    lead.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {lead.status !== 'QUEUED' && (
                                                    <button
                                                        onClick={() => handleReviveLead(lead.id)}
                                                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors"
                                                        title="Revivir Lead (Volver a Marcar)"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenLeadModal(lead)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                    title="Editar Lead"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLead(lead.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Eliminar Lead"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Individual Lead Form Modal */}
            {isLeadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d]">
                            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                <Users size={18} className="text-blue-500" />
                                <span>{editingLead ? 'Editar Lead' : 'Nuevo Lead'}</span>
                            </h2>
                            <button onClick={() => setIsLeadModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={leadForm.name}
                                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                                <input
                                    type="tel"
                                    value={leadForm.phone}
                                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                                    placeholder="+52 55 1234 5678"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metadatos (JSON Opcional)</label>
                                <textarea
                                    value={leadForm.metadataText}
                                    onChange={(e) => setLeadForm({ ...leadForm, metadataText: e.target.value })}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500 font-mono h-28 resize-none custom-scrollbar"
                                    placeholder='{&#10;  "segment": "Retail",&#10;  "city": "CDMX"&#10;}'
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#1e222d] flex justify-end space-x-3 bg-[#0a0c10]">
                            <button
                                onClick={() => setIsLeadModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveLead}
                                disabled={!leadForm.name || !leadForm.phone}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-white/50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-colors"
                            >
                                <Save size={16} />
                                <span>Guardar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d]">
                            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                <Upload size={18} className="text-blue-500" />
                                <span>Importar Leads</span>
                            </h2>
                            <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-xs text-blue-400 leading-relaxed">
                                    Pega la lista de contactos en el área de texto abajo.
                                    El formato esperado por línea es: <strong>Nombre, Teléfono</strong> o <strong>Nombre[TAB]Teléfono</strong>.<br />
                                    <em>Ejemplo:</em><br />
                                    <span className="font-mono text-white">Juan Perez, +52 55 1234 5678</span><br />
                                    <span className="font-mono text-white">María López, +52 55 8765 4321</span>
                                </p>
                            </div>
                            <textarea
                                value={leadsInput}
                                onChange={(e) => setLeadsInput(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 h-64 font-mono custom-scrollbar"
                                placeholder="Pega los datos aquí..."
                            />
                        </div>
                        <div className="p-5 border-t border-[#1e222d] flex justify-end space-x-3 bg-[#0a0c10]">
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImportLeads}
                                disabled={!leadsInput.trim() || importingLeads}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-white/50 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-colors"
                            >
                                {importingLeads ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                <span>{importingLeads ? 'Importando...' : 'Importar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
