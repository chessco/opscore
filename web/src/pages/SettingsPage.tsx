import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../context/LanguageContext';
import { tenantService } from '../services/tenantService';
import { marketplaceService } from '../services/marketplaceService';
import type { SuiteItem, ModuleItem } from '../services/marketplaceService';
import { 
    Settings, 
    Globe, 
    Shield, 
    Save, 
    CheckCircle, 
    AlertCircle, 
    ArrowLeft, 
    Grid, 
    Layers, 
    Sparkles,
    Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TenantsPage from './TenantsPage';

export default function SettingsPage() {
    const { user, setAuth, token } = useAuthStore() as any;
    const { t, setLanguage } = useTranslation();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'region' | 'marketplace' | 'tenants'>('region');
    const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en'>('es');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Marketplace state
    const [suites, setSuites] = useState<SuiteItem[]>([]);
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [loadingMarket, setLoadingMarket] = useState(false);

    useEffect(() => {
        if (user?.tenant?.language) {
            setSelectedLanguage(user.tenant.language);
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'marketplace') {
            fetchMarketplaceData();
        }
    }, [activeTab]);

    const fetchMarketplaceData = async () => {
        setLoadingMarket(true);
        try {
            const [suitesData, modulesData] = await Promise.all([
                marketplaceService.getSuites(),
                marketplaceService.getModules()
            ]);
            setSuites(suitesData);
            setModules(modulesData);
        } catch (err) {
            console.error('Error fetching marketplace data', err);
        } finally {
            setLoadingMarket(false);
        }
    };

    const handleSaveLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        setLoading(true);
        setStatus(null);

        try {
            await tenantService.update(user.tenantId, { language: selectedLanguage });
            setLanguage(selectedLanguage);

            if (user) {
                const updatedUser = {
                    ...user,
                    tenant: {
                        ...user.tenant,
                        language: selectedLanguage
                    }
                };
                setAuth(updatedUser, token || '');
            }

            setStatus({
                type: 'success',
                message: t('settingsSaved')
            });

            setTimeout(() => setStatus(null), 4000);
        } catch (err: any) {
            console.error('Error saving tenant settings', err);
            setStatus({
                type: 'error',
                message: t('settingsSaveError')
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleModule = async (moduleId: string, currentActive: boolean) => {
        try {
            const nextActiveStatus = !currentActive;
            await marketplaceService.assignModule(moduleId, nextActiveStatus);
            
            // Local state update
            setModules(prev => 
                prev.map(mod => mod.id === moduleId ? { ...mod, isActive: nextActiveStatus } : mod)
            );

            setStatus({
                type: 'success',
                message: `Módulo ${nextActiveStatus ? 'activado' : 'desactivado'} con éxito.`
            });
            setTimeout(() => setStatus(null), 3000);
        } catch (err: any) {
            console.error('Error toggling module status', err);
            setStatus({
                type: 'error',
                message: 'No tienes los permisos requeridos o el módulo no pertenece a una suite licenciada.'
            });
            setTimeout(() => setStatus(null), 4000);
        }
    };

    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'SYSTEM';

    if (!isAuthorized) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-[#0d1017]/40 border border-[#1e222d] rounded-2xl backdrop-blur-md">
                <Shield className="text-red-500/80 mb-4 animate-bounce" size={48} />
                <h2 className="text-xl font-bold text-white tracking-tight">Acceso Denegado</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md">
                    No tienes los permisos requeridos para acceder a la configuración del Tenant. Solo administradores, supervisores o sistema pueden realizar estos cambios.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 text-sm transition-all"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
            {/* Header section with back button */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-3 uppercase">
                        <Settings className="text-blue-500" size={26} />
                        <span>{t('settings')}</span>
                    </h1>
                    <p className="text-xs text-[#525a6c] font-bold mt-1 tracking-wider uppercase">
                        {t('tenantSettings')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-white px-4 py-2 border border-[#1e222d] hover:bg-white/5 rounded-xl transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>{t('backToWorkspace')}</span>
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-[#1e222d] pb-px">
                <button
                    onClick={() => setActiveTab('region')}
                    className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                        activeTab === 'region' 
                            ? 'text-blue-500' 
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <span>Región e Idioma</span>
                    {activeTab === 'region' && (
                        <div className="absolute bottom-0 inset-x-4 h-[2px] bg-blue-500 animate-in fade-in duration-300" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                        activeTab === 'marketplace' 
                            ? 'text-blue-500' 
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <span className="flex items-center space-x-2">
                        <Grid size={16} />
                        <span>Marketplace de Módulos</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded-full border border-blue-500/20">Suites</span>
                    </span>
                    {activeTab === 'marketplace' && (
                        <div className="absolute bottom-0 inset-x-4 h-[2px] bg-blue-500 animate-in fade-in duration-300" />
                    )}
                </button>
                {user?.role === 'SYSTEM' && (
                    <button
                        onClick={() => setActiveTab('tenants')}
                        className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                            activeTab === 'tenants' 
                                ? 'text-blue-500' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <span className="flex items-center space-x-2">
                            <Building2 size={16} />
                            <span>Clientes (Tenants)</span>
                        </span>
                        {activeTab === 'tenants' && (
                            <div className="absolute bottom-0 inset-x-4 h-[2px] bg-blue-500 animate-in fade-in duration-300" />
                        )}
                    </button>
                )}
            </div>

            {status && (
                <div
                    className={`p-4 rounded-xl border flex items-center space-x-3 backdrop-blur-md animate-in zoom-in-95 duration-200 ${
                        status.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                >
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-semibold tracking-tight">{status.message}</span>
                </div>
            )}

            {/* TAB CONTENT: Region & Language */}
            {activeTab === 'region' && (
                <form onSubmit={handleSaveLanguage} className="bg-[#0d1017]/80 border border-[#1e222d] rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
                    
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">{t('language')}</h3>
                                <p className="text-sm text-slate-500 mt-1">{t('changeTenantLang')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1e222d]">
                            {/* Selector Area */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('selectLanguage')}</label>
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value as 'es' | 'en')}
                                        className="w-full bg-[#161b22] border border-[#1e222d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none font-semibold transition-colors cursor-pointer"
                                    >
                                        <option value="es">{t('spanish')}</option>
                                        <option value="en">{t('english')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                        <Settings className="animate-spin-slow" size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Extra Details */}
                            <div className="bg-[#11141b]/60 border border-[#1e222d] rounded-xl p-4 flex flex-col justify-center space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-[#4e5564] uppercase tracking-wider">Tenant Name:</span>
                                    <span className="font-mono text-white font-semibold">{user?.tenant?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-[#4e5564] uppercase tracking-wider">Slug:</span>
                                    <span className="font-mono text-blue-400 font-semibold">{user?.tenant?.slug || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-[#4e5564] uppercase tracking-wider">Estado:</span>
                                    <span className="text-green-500 font-bold uppercase text-[10px] bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                        Activo
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#11141b]/40 border-t border-[#1e222d] px-6 py-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
                        >
                            <Save size={18} />
                            <span>{loading ? t('loading') : t('saveSettings')}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: Modular Marketplace */}
            {activeTab === 'marketplace' && (
                <div className="space-y-6">
                    <div className="bg-[#0d1017]/80 border border-[#1e222d] p-6 rounded-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                                <Sparkles className="text-purple-400" size={20} />
                                <span>Centro de Aprovisionamiento Modular</span>
                            </h3>
                            <p className="text-sm text-slate-500">
                                Licencia e integra componentes dinámicos en tu espacio de trabajo en tiempo real.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-purple-400 font-bold text-xs uppercase tracking-tight">
                            <Shield size={14} />
                            <span>Rol: {user?.role}</span>
                        </div>
                    </div>

                    {loadingMarket ? (
                        <div className="min-h-[40vh] flex flex-col justify-center items-center text-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Cargando Marketplace de Suites...</span>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {suites.map(suite => (
                                <div key={suite.id} className="bg-[#0d1017]/80 border border-[#1e222d] rounded-2xl overflow-hidden shadow-xl">
                                    {/* Suite Header Banner */}
                                    <div className="p-6 bg-[#11141b]/60 border-b border-[#1e222d] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-3">
                                                <Layers className="text-blue-500" size={20} />
                                                <h4 className="text-base font-bold text-white tracking-tight">{suite.name}</h4>
                                                <span className="text-[9px] bg-green-500/15 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    LICENCIADA
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 max-w-2xl">{suite.description}</p>
                                        </div>

                                        <div className="text-right sm:border-l sm:border-[#1e222d] sm:pl-6 text-xs space-y-1">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-[#4e5564] font-bold uppercase tracking-wider">Licencia:</span>
                                                <span className="font-mono text-white font-semibold">{suite.licenseKey}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-[#4e5564] font-bold uppercase tracking-wider">Vence:</span>
                                                <span className="font-mono text-blue-400 font-semibold">
                                                    {suite.expiresAt ? new Date(suite.expiresAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modules Grid inside this Suite */}
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-[#0a0c10]/40">
                                        {modules
                                            .filter(mod => mod.suiteId === suite.id)
                                            .map(mod => (
                                                <div 
                                                    key={mod.id}
                                                    className={`border rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${
                                                        mod.isActive 
                                                            ? 'border-blue-500/30 bg-blue-500/5 shadow-md shadow-blue-500/5' 
                                                            : 'border-[#1e222d] bg-[#11141b]/40 opacity-70 hover:opacity-90'
                                                    }`}
                                                >
                                                    {/* Glow Indicator when Active */}
                                                    {mod.isActive && (
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                                                    )}

                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1.5 pr-8">
                                                            <h5 className="text-sm font-bold text-white leading-tight">{mod.name}</h5>
                                                            <p className="text-xs text-[#525a6c] leading-relaxed font-medium">{mod.description}</p>
                                                        </div>
                                                        <div className="z-10">
                                                            <button
                                                                onClick={() => handleToggleModule(mod.id, mod.isActive)}
                                                                className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors duration-300 relative ${
                                                                    mod.isActive ? 'bg-blue-600' : 'bg-slate-700'
                                                                }`}
                                                            >
                                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                                                    mod.isActive ? 'translate-x-4' : 'translate-x-0'
                                                                }`}></div>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-[#1e222d]/60 flex items-center justify-between text-[10px]">
                                                        <span className="font-bold text-[#4e5564] uppercase tracking-wider">Identificador:</span>
                                                        <span className="font-mono text-slate-500 font-bold">{mod.id}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Tenants */}
            {activeTab === 'tenants' && user?.role === 'SYSTEM' && (
                <div className="animate-in fade-in duration-300">
                    <TenantsPage />
                </div>
            )}
        </div>
    );
}
