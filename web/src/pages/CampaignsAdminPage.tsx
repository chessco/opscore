import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Search, Loader2, Save, X, Upload, BarChart2 } from 'lucide-react';
import api from '../services/api';

interface Campaign {
    id: string;
    name: string;
    description: string;
    status: string;
    surveyType?: string;
    externalSurveyUrl?: string;
    cooldownDays?: number;
    tenantId: string;
    createdAt: string;
}

interface Interaction {
    id: string;
    status: string;
    lead: { name: string; phone: string };
    surveyResponse: any;
    recordings: { fileUrl: string }[];
    createdAt: string;
}

export default function CampaignsAdminPage() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Campaign
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [campaignForm, setCampaignForm] = useState({ name: '', description: '', surveyType: 'INTERNAL', externalSurveyUrl: '', cooldownDays: 30 });

    // Modal state for Leads
    const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
    const [selectedCampaignForLeads, setSelectedCampaignForLeads] = useState<Campaign | null>(null);
    const [leadsInput, setLeadsInput] = useState('');
    const [importingLeads, setImportingLeads] = useState(false);

    // Modal state for Results
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [selectedCampaignForResults, setSelectedCampaignForResults] = useState<Campaign | null>(null);
    const [campaignInteractions, setCampaignInteractions] = useState<Interaction[]>([]);
    const [loadingInteractions, setLoadingInteractions] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
        } catch (err) {
            console.error('Error fetching campaigns', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCampaignModal = (campaign?: Campaign) => {
        if (campaign) {
            setEditingCampaign(campaign);
            setCampaignForm({ 
                name: campaign.name, 
                description: campaign.description || '',
                surveyType: campaign.surveyType || 'INTERNAL',
                externalSurveyUrl: campaign.externalSurveyUrl || '',
                cooldownDays: campaign.cooldownDays ?? 30
            });
        } else {
            setEditingCampaign(null);
            setCampaignForm({ name: '', description: '', surveyType: 'INTERNAL', externalSurveyUrl: '', cooldownDays: 30 });
        }
        setIsCampaignModalOpen(true);
    };

    const handleSaveCampaign = async () => {
        try {
            if (editingCampaign) {
                await api.patch(`/campaigns/${editingCampaign.id}`, campaignForm);
            } else {
                await api.post('/campaigns', campaignForm);
            }
            setIsCampaignModalOpen(false);
            fetchCampaigns();
        } catch (err) {
            console.error('Error saving campaign', err);
            alert('Error al guardar la campaña');
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            fetchCampaigns();
        } catch (err) {
            console.error('Error deleting campaign', err);
            alert('Error al eliminar la campaña');
        }
    };

    const handleOpenLeadsModal = (campaign: Campaign) => {
        setSelectedCampaignForLeads(campaign);
        setLeadsInput('');
        setIsLeadsModalOpen(true);
    };

    const handleImportLeads = async () => {
        if (!selectedCampaignForLeads || !leadsInput.trim()) return;
        
        try {
            setImportingLeads(true);
            
            // Parse leads from textarea (format: Name, Phone per line)
            const lines = leadsInput.split('\n').filter(line => line.trim() !== '');
            const leads = lines.map(line => {
                // Split by comma, tab or multiple spaces
                const parts = line.split(/[,	]+/).map(p => p.trim());
                if (parts.length >= 2) {
                    return { name: parts[0], phone: parts[1] };
                }
                // Fallback: assume the whole line is a phone number if no delimiter
                return { name: 'Desconocido', phone: line.trim() };
            });

            if (leads.length === 0) {
                alert('No se encontraron leads válidos en el texto.');
                return;
            }

            await api.post('/leads/import', {
                campaignId: selectedCampaignForLeads.id,
                leads: leads
            });

            alert(`¡Se importaron ${leads.length} leads exitosamente!`);
            setIsLeadsModalOpen(false);
        } catch (err) {
            console.error('Error importing leads', err);
            alert('Error al importar los leads');
        } finally {
            setImportingLeads(false);
        }
    };

    const handleOpenResultsModal = async (campaign: Campaign) => {
        setSelectedCampaignForResults(campaign);
        setIsResultsModalOpen(true);
        setLoadingInteractions(true);
        try {
            const res = await api.get('/interactions');
            // Filter interactions for this campaign
            const filtered = res.data.filter((i: any) => i.campaignId === campaign.id);
            setCampaignInteractions(filtered);
        } catch (err) {
            console.error('Error fetching interactions', err);
        } finally {
            setLoadingInteractions(false);
        }
    };

    const filteredCampaigns = campaigns.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase">Administración de Campañas</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona tus campañas y carga listas de leads</p>
                </div>
                <button 
                    onClick={() => handleOpenCampaignModal()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} />
                    <span>Nueva Campaña</span>
                </button>
            </div>

            <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#1e222d] flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar campaña..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Search size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No se encontraron campañas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCampaigns.map(campaign => (
                                <div key={campaign.id} className="bg-[#0a0c10] border border-[#1e222d] rounded-xl p-5 hover:border-[#2b303b] transition-colors group flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{campaign.name}</h3>
                                            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                                                campaign.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenCampaignModal(campaign)}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                title="Editar Campaña"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                title="Eliminar Campaña"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">
                                        {campaign.description || 'Sin descripción'}
                                    </p>

                                    <div className="border-t border-[#1e222d] pt-4 mt-auto space-y-2">
                                        <button 
                                            onClick={() => navigate(`/leads?campaignId=${campaign.id}`)}
                                            className="w-full bg-[#11141b] hover:bg-blue-500/10 border border-[#1e222d] hover:border-blue-500/30 text-slate-300 hover:text-blue-400 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
                                        >
                                            <Users size={14} />
                                            <span>Gestionar Leads</span>
                                        </button>
                                        <button 
                                            onClick={() => handleOpenResultsModal(campaign)}
                                            className="w-full bg-[#11141b] hover:bg-green-500/10 border border-[#1e222d] hover:border-green-500/30 text-slate-300 hover:text-green-400 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
                                        >
                                            <BarChart2 size={14} />
                                            <span>Ver Resultados</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Modal */}
            {isCampaignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d]">
                            <h2 className="text-lg font-bold text-white">{editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}</h2>
                            <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre</label>
                                <input 
                                    type="text" 
                                    value={campaignForm.name}
                                    onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Nombre de la campaña"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</label>
                                <textarea 
                                    value={campaignForm.description}
                                    onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                                    placeholder="Descripción opcional"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Encuesta</label>
                                <select 
                                    value={campaignForm.surveyType}
                                    onChange={(e) => setCampaignForm({...campaignForm, surveyType: e.target.value})}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="INTERNAL">Propia del Sistema (Interna)</option>
                                    <option value="EXTERNAL">Enlace a Página Externa</option>
                                </select>
                            </div>
                            {campaignForm.surveyType === 'EXTERNAL' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL de la Encuesta Externa</label>
                                    <input 
                                        type="url" 
                                        value={campaignForm.externalSurveyUrl}
                                        onChange={(e) => setCampaignForm({...campaignForm, externalSurveyUrl: e.target.value})}
                                        className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="https://google.com/forms/..."
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Días de Enfriamiento (Cooldown)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={campaignForm.cooldownDays}
                                    onChange={(e) => setCampaignForm({...campaignForm, cooldownDays: parseInt(e.target.value) || 0})}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Ej. 30"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Tiempo que debe pasar antes de volver a marcar un lead que ya fue contestado.</p>
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#1e222d] flex justify-end space-x-3 bg-[#0a0c10]">
                            <button 
                                onClick={() => setIsCampaignModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveCampaign}
                                disabled={!campaignForm.name}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-white/50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-colors"
                            >
                                <Save size={16} />
                                <span>Guardar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leads Import Modal */}
            {isLeadsModalOpen && selectedCampaignForLeads && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d]">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <Upload size={18} className="text-blue-500" />
                                    <span>Importar Leads</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Campaña: <span className="text-white font-medium">{selectedCampaignForLeads.name}</span></p>
                            </div>
                            <button onClick={() => setIsLeadsModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-xs text-blue-400 leading-relaxed">
                                    Pega la lista de contactos en el área de texto abajo. 
                                    El formato esperado por línea es: <strong>Nombre, Teléfono</strong> o <strong>Nombre[TAB]Teléfono</strong>.<br/>
                                    <em>Ejemplo:</em><br/>
                                    <span className="font-mono text-white">Juan Perez, +52 55 1234 5678</span><br/>
                                    <span className="font-mono text-white">María López, +52 55 8765 4321</span>
                                </p>
                            </div>
                            <div>
                                <textarea 
                                    value={leadsInput}
                                    onChange={(e) => setLeadsInput(e.target.value)}
                                    className="w-full bg-[#0a0c10] border border-[#1e222d] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 h-64 font-mono custom-scrollbar"
                                    placeholder="Pega los datos aquí..."
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#1e222d] flex justify-end space-x-3 bg-[#0a0c10]">
                            <button 
                                onClick={() => setIsLeadsModalOpen(false)}
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

            {/* Results Modal */}
            {isResultsModalOpen && selectedCampaignForResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d] shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <BarChart2 size={18} className="text-green-500" />
                                    <span>Resultados de la Campaña</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Campaña: <span className="text-white font-medium">{selectedCampaignForResults.name}</span></p>
                            </div>
                            <button onClick={() => setIsResultsModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 overflow-auto custom-scrollbar flex-1">
                            {loadingInteractions ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : campaignInteractions.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <p>No hay interacciones registradas aún.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {campaignInteractions.map(interaction => (
                                        <div key={interaction.id} className="bg-[#0a0c10] border border-[#1e222d] rounded-xl p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-white font-bold">{interaction.lead?.name || 'Desconocido'}</h4>
                                                    <p className="text-xs text-slate-400 font-mono">{interaction.lead?.phone}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    interaction.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-300'
                                                }`}>
                                                    {interaction.status}
                                                </span>
                                            </div>
                                            
                                            {interaction.surveyResponse && (
                                                <div className="mt-3 p-3 bg-[#11141b] rounded border border-[#1e222d]">
                                                    <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Respuestas de Encuesta</h5>
                                                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                                        {JSON.stringify(interaction.surveyResponse, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {interaction.recordings && interaction.recordings.length > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Grabación</h5>
                                                    <audio 
                                                        controls 
                                                        src={`${import.meta.env.VITE_API_URL}${interaction.recordings[0].fileUrl}`} 
                                                        className="h-8 w-full max-w-sm rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
