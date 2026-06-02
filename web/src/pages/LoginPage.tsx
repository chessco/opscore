import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../context/LanguageContext';
import {
    Shield,
    Loader2,
    ChevronDown,
    Eye,
    EyeOff,
    RefreshCw,
    Key,
    Server,
    Globe,
    Zap,
    Lock
} from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token } = response.data;

            if (access_token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                const profileRes = await api.get('/auth/profile');
                setAuth(profileRes.data, access_token);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06080c] flex overflow-hidden font-sans text-slate-400 selection:bg-blue-500/30">
            {/* Left Panel - Branding & Illustration */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-[#1e222d]">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

                {/* Logo Area */}
                <div className="z-10">
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{t('nexusTitle')}</h1>
                            <p className="text-[10px] font-bold text-[#4e5564] tracking-widest mt-1 uppercase">{t('securityTier')}</p>
                        </div>
                    </div>
                </div>

                {/* Central Illustration */}
                <div className="relative flex-1 flex items-center justify-center">
                    <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                        {/* Connecting Lines */}
                        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent top-1/2 -translate-y-1/2 border-t border-dashed border-blue-500/30"></div>

                        {/* Server Rack Node */}
                        <div className="relative z-10 w-48 bg-[#0d1017] border border-[#1e222d] rounded-2xl p-4 shadow-2xl shadow-black/50">
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                            <div className="space-y-3">
                                <div className="h-6 bg-[#151921] rounded border border-[#2b303b] flex items-center px-2 space-x-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <div className="h-1 w-12 bg-[#2b303b] rounded-full"></div>
                                </div>
                                <div className="h-6 bg-[#151921] rounded border border-[#2b303b] flex items-center px-2 space-x-2 opacity-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                    <div className="h-1 w-8 bg-[#2b303b] rounded-full"></div>
                                </div>
                                <div className="h-6 bg-[#151921] rounded border border-[#2b303b] flex items-center px-2 space-x-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    <div className="h-1 w-16 bg-[#2b303b] rounded-full"></div>
                                    <div className="ml-auto">
                                        <Zap size={10} className="text-yellow-500" />
                                    </div>
                                </div>
                                <div className="h-6 bg-[#151921] rounded border border-[#2b303b] flex items-center px-2 space-x-2 opacity-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                    <div className="h-1 w-10 bg-[#2b303b] rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Side Node Left */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4 w-16 h-16 bg-[#0d1017] border border-[#1e222d] rounded-full flex items-center justify-center shadow-xl">
                            <Server size={20} className="text-blue-500/50" />
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-6 border-l border-b border-blue-500/20"></div>
                        </div>
                        {/* Side Node Right */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-16 h-16 bg-[#0d1017] border border-[#1e222d] rounded-full flex items-center justify-center shadow-xl">
                            <Globe size={20} className="text-blue-500/50" />
                        </div>
                    </div>
                </div>

                {/* Left Footer */}
                <div className="z-10 text-center">
                    <h2 className="text-xl text-white font-medium mb-2 tracking-tight">{t('infrastructure')}</h2>
                    <p className="text-xs text-[#6b7280] max-w-sm mx-auto leading-relaxed">
                        {t('infraSubtitle')}
                    </p>
                </div>

                {/* Copyright */}
                <div className="absolute bottom-6 left-12 text-[10px] text-[#4e5564] font-medium">
                    © 2026 Pitaya Operations Inc.
                </div>
                <div className="absolute bottom-6 right-12 flex space-x-6 text-[10px] text-[#4e5564] font-medium uppercase tracking-wider">
                    <span className="cursor-pointer hover:text-white transition-colors">{t('documentation')}</span>
                    <span className="cursor-pointer hover:text-white transition-colors">{t('supportPortal')}</span>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 relative bg-[#0b0e14]">
                <div className="w-full max-w-md">
                    {/* Client Logo / Branding */}
                    <div className="mb-8 flex justify-start">
                        <div className="bg-[#f8f9fa] px-6 py-4 rounded-2xl shadow-lg shadow-black/20">
                            <img src="/simetria-logo.png" alt="Simetría" className="h-12 object-contain" />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-3">{t('loginTitle')}</h2>
                        <p className="text-sm text-[#6b7280] font-medium">{t('loginSubtitle')}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-xs font-bold flex items-center animate-in fade-in slide-in-from-top-2">
                            <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Tenant Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-[#4e5564] tracking-widest pl-1">{t('tenantOrg')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Server size={16} className="text-[#4e5564] group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <select 
                                    defaultValue="Cd Obregon"
                                    className="w-full bg-[#151921] border border-[#2b303b] text-white text-sm rounded-xl py-3.5 pl-11 pr-10 appearance-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium cursor-pointer hover:bg-[#1a1f29]"
                                >
                                    <option value="Cd Obregon">Cd Obregon</option>
                                    <option value="Tijuana">Tijuana</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown size={16} className="text-[#4e5564]" />
                                </div>
                            </div>
                        </div>

                        {/* Operator ID (Email) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-[#4e5564] tracking-widest pl-1">{t('operatorId')}</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#151921] border border-[#2b303b] text-white text-sm rounded-xl py-3.5 px-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium placeholder:text-gray-700"
                                    placeholder="e.g. admin_operator_04"
                                />
                            </div>
                        </div>

                        {/* Security Key (Password) */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center pl-1 pr-1">
                                <label className="text-[10px] font-black uppercase text-[#4e5564] tracking-widest">{t('securityKey')}</label>
                                <a href="#" className="text-[10px] font-bold text-blue-500 hover:text-white transition-colors">{t('forgot')}</a>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#151921] border border-[#2b303b] text-white text-sm rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium placeholder:text-gray-700 font-mono tracking-widest"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#4e5564] hover:text-white transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <span className="flex items-center">
                                    {t('verifyIdentity')}
                                    <Key size={16} className="ml-2 group-hover:rotate-12 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* MFA Section (Visual Only) */}
                    <div className="mt-10 pt-8 border-t border-[#1e222d] text-center">
                        <div className="flex items-center justify-center space-x-2 text-[#4e5564] mb-6">
                            <span className="h-[1px] w-8 bg-[#2b303b]"></span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('mfaStatus')}</span>
                            <span className="h-[1px] w-8 bg-[#2b303b]"></span>
                        </div>

                        <div className="mb-2 text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">{t('enterMfa')}</div>
                        <div className="flex justify-center space-x-2 mb-6 opacity-30 pointer-events-none grayscale">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="w-10 h-12 bg-[#0b0e14] border border-[#2b303b] rounded-lg"></div>
                            ))}
                        </div>

                        <div className="flex justify-between px-8">
                            <button className="flex items-center text-[10px] font-bold text-[#4e5564] hover:text-white transition-colors uppercase tracking-wider group">
                                <RefreshCw size={10} className="mr-1.5 group-hover:rotate-180 transition-transform duration-500" /> {t('resendCode')}
                            </button>
                            <button className="flex items-center text-[10px] font-bold text-[#4e5564] hover:text-white transition-colors uppercase tracking-wider">
                                <Key size={10} className="mr-1.5" /> {t('backupKey')}
                            </button>
                        </div>
                    </div>

                    {/* Footer Links (Mobile only, desktop has generic footer) */}
                    <div className="mt-12 flex justify-center space-x-6 lg:hidden">
                        <span className="text-[10px] font-bold text-[#4e5564] uppercase tracking-wider">{t('securityPolicy')}</span>
                        <span className="text-[10px] font-bold text-[#4e5564] uppercase tracking-wider">{t('compliance')}</span>
                    </div>

                    <div className="hidden lg:flex mt-16 justify-between items-center text-[9px] font-bold text-[#353a45] uppercase tracking-widest">
                        <span className="flex items-center hover:text-[#4e5564] cursor-pointer"><Lock size={8} className="mr-1.5" /> {t('securityPolicy')}</span>
                        <span className="flex items-center hover:text-[#4e5564] cursor-pointer"><Shield size={8} className="mr-1.5" /> {t('compliance')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
