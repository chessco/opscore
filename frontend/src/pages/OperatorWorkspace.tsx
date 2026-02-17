import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import BroadcastCommand from '../components/BroadcastCommand';
import {
    LayoutGrid,
    Search,
    AlertTriangle,
    Zap,
    Signal,
    Maximize2,
    MousePointer2,
    Building2,
    Users,
    Smartphone,
    LogOut,
    Rocket,
    Activity,
    Shield
} from 'lucide-react';
import { deviceService } from '../services/deviceService';
import type { Device } from '../services/deviceService';
import { streamManager } from '../services/streamManager';



export default function OperatorWorkspace() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [telemetry, setTelemetry] = useState({ cpu: 24, ram: '3.2', battery: 38, latency: 24 });
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [isVideoMaximized, setIsVideoMaximized] = useState(false);
    const isRoot = location.pathname === '/' || location.pathname === '/workspace';

    // Mock stats from previous dashboard
    const stats = {
        online: devices.filter(d => d.status === 'ONLINE').length,
        alerts: 2,
        operators: 5
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(() => {
            fetchDevices(); // Poll for status updates
            setTelemetry({
                cpu: Math.floor(Math.random() * 30) + 20,
                ram: (Math.random() * 2 + 2).toFixed(1),
                battery: Math.floor(Math.random() * 10) + 35,
                latency: Math.floor(Math.random() * 50) + 15,
            });
        }, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchDevices = async () => {
        try {
            const data = await deviceService.getAll();
            setDevices(data);
            // Select first device if none selected
            if (!selectedDevice && data.length > 0) {
                setSelectedDevice(data[0].androidId);
            }
        } catch (error) {
            console.error('Failed to fetch devices', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#0a0c10] text-[#a0a5b1] font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* Broadcast Side Panel */}
            <BroadcastCommand isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />

            {/* Video Maximize Modal */}
            {isVideoMaximized && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsVideoMaximized(false)}
                        className="absolute top-6 right-6 p-4 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 backdrop-blur-md"
                    >
                        <Maximize2 className="rotate-180" size={32} />
                    </button>
                    <div className="h-[85vh] aspect-[9/19] relative bg-[#0a0c10] rounded-3xl overflow-hidden border border-[#333] shadow-2xl ring-1 ring-white/10">
                        <DeviceVideoPlayer deviceId={selectedDevice || ''} />
                    </div>
                </div>
            )}

            {/* Left Thin Sidebar - Unified with CRM Navigation */}
            <aside className="w-16 bg-[#11141b] border-r border-[#1e222d] flex flex-col items-center py-6 space-y-6 z-20">
                <button
                    onClick={() => setIsBroadcastOpen(true)}
                    className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
                >
                    <Zap size={24} />
                </button>

                <nav className="flex flex-col space-y-4 pt-4">
                    <Link
                        to="/"
                        title="Workspace"
                        className={`p-2 rounded-lg transition-all ${isRoot ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid size={22} />
                    </Link>

                    {user?.role === 'ADMIN' && (
                        <Link
                            to="/tenants"
                            title="Clientes"
                            className={`p-2 rounded-lg transition-all ${location.pathname.startsWith('/tenants') ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <Building2 size={22} />
                        </Link>
                    )}

                    {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                        <>
                            <Link
                                to="/users"
                                title="Usuarios"
                                className={`p-2 rounded-lg transition-all ${location.pathname.startsWith('/users') ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Users size={22} />
                            </Link>
                            <Link
                                to="/devices"
                                title="Lista Dispositivos"
                                className={`p-2 rounded-lg transition-all ${location.pathname.startsWith('/devices') ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Smartphone size={22} />
                            </Link>
                            <Link
                                to="/supervisor"
                                title="Supervisor Console"
                                className={`p-2 rounded-lg transition-all ${location.pathname.startsWith('/supervisor') ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Activity size={22} />
                            </Link>
                            <Link
                                to="/audit-logs"
                                title="Audit Logs"
                                className={`p-2 rounded-lg transition-all ${location.pathname.startsWith('/audit-logs') ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Shield size={22} />
                            </Link>
                            <button
                                onClick={() => setIsBroadcastOpen(true)}
                                title="Broadcast Command"
                                className={`p-2 rounded-lg transition-all ${isBroadcastOpen ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Rocket size={22} />
                            </button>
                        </>
                    )}
                </nav>

                <div className="flex-1" />

                <button
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                    <LogOut size={22} />
                </button>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-14 border-b border-[#1e222d] flex items-center justify-between px-6 bg-[#0d1017]">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <span className="text-white font-bold tracking-wider text-lg">CONSOLEX</span>
                        </div>
                        <div className="h-4 w-[1px] bg-[#1e222d]" />

                        {/* Unified Stats from Dashboard */}
                        <div className="flex items-center space-x-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#4e5564] uppercase tracking-tighter leading-none">Devices Online</span>
                                <span className="text-xs font-mono text-green-500 font-bold">{stats.online}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#4e5564] uppercase tracking-tighter leading-none">Active Alerts</span>
                                <span className="text-xs font-mono text-red-500 font-bold">{stats.alerts}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#4e5564] uppercase tracking-tighter leading-none">Ops Connected</span>
                                <span className="text-xs font-mono text-blue-500 font-bold">{stats.operators}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-8 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4e5564]" size={16} />
                        <input
                            placeholder="Search devices, IPs, or logs (Cmd + K)"
                            className="w-full bg-[#161b22] border border-[#1e222d] rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        {stats.alerts > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded flex items-center space-x-2 animate-pulse cursor-pointer hover:bg-red-500/20" onClick={() => setIsBroadcastOpen(true)}>
                                <AlertTriangle className="text-red-500" size={14} />
                                <span className="text-red-400 text-[10px] font-bold tracking-tighter uppercase whitespace-nowrap">Warning: High Latency Detection</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white leading-none capitalize">{user?.fullName}</p>
                                <p className="text-[10px] text-[#4e5564] mt-1 font-mono uppercase tracking-tighter">{user?.role}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1e222d]">
                                {user?.fullName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex min-h-0 bg-[#0a0c10]">
                    {isRoot ? (
                        <>
                            {/* Device Grid */}
                            <section className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {devices.map((device) => (
                                        <div
                                            key={device.id}
                                            onClick={() => setSelectedDevice(device.androidId)}
                                            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedDevice === device.androidId
                                                ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                                                : 'border-transparent bg-[#11141b] hover:border-[#2a2f3b]'
                                                }`}
                                        >
                                            <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start z-10">
                                                <div>
                                                    <p className={`text-[10px] font-mono leading-none ${selectedDevice === device.androidId ? 'text-blue-400' : 'text-[#4e5564]'}`}>
                                                        {device.androidId}
                                                    </p>
                                                    <p className="text-[9px] text-[#4e5564] mt-1 font-bold truncate max-w-[80px]">{device.name}</p>
                                                </div>
                                                <Signal size={12} className={device.status === 'ONLINE' ? 'text-green-500' : device.status === 'BUSY' ? 'text-yellow-500' : 'text-red-500'} />
                                            </div>

                                            <div className="aspect-[9/19] bg-[#0a0c10] m-2 mt-10 rounded-lg overflow-hidden relative">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0c10]/20 to-[#0a0c10]/80 z-[2]" />
                                                <div className={`w-full h-full ${device.status === 'OFFLINE' ? 'grayscale opacity-50 pointer-events-none' : ''}`}>
                                                    <DeviceVideoPlayer deviceId={device.androidId} minimal />
                                                </div>
                                                <div className="absolute bottom-3 left-3 z-[3]">
                                                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-tighter uppercase ${device.status === 'ONLINE' ? 'bg-green-500 text-white' :
                                                        device.status === 'BUSY' ? 'bg-yellow-500 text-[#1a1a1a]' :
                                                            'bg-red-500 text-white'
                                                        }`}>
                                                        {device.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Focus Panel */}
                            <aside className="w-[400px] bg-[#0d1017] border-l border-[#1e222d] flex flex-col overflow-y-auto">
                                <div className="p-4 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">{selectedDevice}</h3>
                                            <p className="text-xs font-mono text-[#4e5564] mt-1 uppercase">IP: 10.0.0.X • ANDROID 13</p>
                                        </div>
                                        <button
                                            onClick={() => setIsVideoMaximized(true)}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#4e5564] hover:text-white"
                                        >
                                            <Maximize2 size={20} />
                                        </button>
                                    </div>

                                    {/* Video Container */}
                                    <div className="aspect-[9/19] w-full bg-[#11141b] rounded-2xl border border-[#1e222d] shadow-2xl relative overflow-hidden group">
                                        {/* Real Video Element */}
                                        <DeviceVideoPlayer deviceId={selectedDevice || ''} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(telemetry).map(([key, value]) => (
                                            <div key={key} className="bg-[#11141b] p-3 rounded-xl border border-[#1e222d]">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#4e5564]">{key.replace('cpu', 'CPU Load').replace('ram', 'RAM Usage')}</span>
                                                    <span className="text-[9px] font-mono text-blue-400">{value}{key === 'cpu' ? '%' : key === 'ram' ? 'GB' : key === 'latency' ? 'ms' : '°C'}</span>
                                                </div>
                                                <div className="h-1 bg-[#1e222d] rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: key === 'latency' ? `${(value as number / 200) * 100}%` : `${value}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95 group">
                                        <MousePointer2 size={20} />
                                        <span className="tracking-tight text-sm">TAKE CONTROL</span>
                                    </button>
                                </div>
                            </aside>
                        </>
                    ) : (
                        <div className="flex-1 overflow-auto bg-[#0a0c10] p-8 custom-scrollbar">
                            <div className="max-w-6xl mx-auto">
                                <Outlet />
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <footer className="h-8 bg-[#0d1017] border-t border-[#1e222d] px-6 flex items-center space-x-6 text-[10px] font-mono uppercase tracking-tighter">
                    <div className="flex items-center space-x-1.5 font-bold text-green-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>{stats.online} ONLINE</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-bold text-yellow-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span>0 LAG</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-bold text-red-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>{devices.filter(d => d.status === 'OFFLINE').length} OFFLINE</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center space-x-4 text-[#4e5564]">
                        <span>SESSION: 02:44:12</span>
                        <span className="text-blue-500 font-bold uppercase tracking-widest">Stable Connection</span>
                    </div>
                </footer>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e222d; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2a2f3b; }
                
                /* Dark Mode CRM Overrides */
                .bg-white { background-color: #11141b !important; border-color: #1e222d !important; color: #a0a5b1 !important; }
                .text-gray-900 { color: #ffffff !important; }
                .text-gray-800 { color: #ffffff !important; }
                .text-gray-700 { color: #a0a5b1 !important; }
                .text-gray-600 { color: #808591 !important; }
                .text-gray-500 { color: #4e5564 !important; }
                .border-gray-200, .border-gray-100 { border-color: #1e222d !important; }
                .bg-gray-50 { background-color: #161b22 !important; }
                .hover\\:bg-gray-50:hover { background-color: #1c2128 !important; }
                table { border-color: #1e222d !important; }
                th { background-color: #11141b !important; color: #4e5564 !important; font-weight: bold !important; text-transform: uppercase !important; font-size: 10px !important; letter-spacing: 0.05em !important; }
                td { border-bottom-color: #1e222d !important; }
            `}</style>
        </div>
    );
}

function DeviceVideoPlayer({ deviceId, minimal = false }: { deviceId: string; minimal?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [fitMode, setFitMode] = useState<'contain' | 'cover'>('cover');
    const [hasStream, setHasStream] = useState(false);

    useEffect(() => {
        const handleStream = (id: string, stream: MediaStream) => {
            // Check if stream is for this device OR fallback
            if (id === deviceId || id === 'unknown-device') {
                if (videoRef.current) {
                    console.log(`Setting stream for ${deviceId}`);
                    videoRef.current.srcObject = stream;
                    setHasStream(true);
                }
            }
        };

        // Subscribe to stream manager updates
        streamManager.subscribe(handleStream);

        return () => {
            streamManager.unsubscribe(handleStream);
        };
    }, [deviceId]);

    return (
        <div className="w-full h-full bg-black relative flex items-center justify-center group/video overflow-hidden">
            {!hasStream && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-16 h-1 bg-blue-500/20 rounded-full animate-pulse blur-xl" />
                    <div className="text-[10px] font-mono opacity-20 rotate-[-45deg] select-none">WAITING FOR STREAM...</div>
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full transition-all duration-300 relative z-10 ${!hasStream ? 'opacity-0' : 'opacity-100'} ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
            />
            {!minimal && (
                <div className="absolute top-2 right-2 flex items-center space-x-2 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); setFitMode(prev => prev === 'contain' ? 'cover' : 'contain'); }}
                        className="bg-black/50 hover:bg-black/70 text-white text-[9px] px-2 py-1 rounded backdrop-blur-sm border border-white/10 uppercase font-bold tracking-wider transition-colors opacity-0 group-hover/video:opacity-100"
                    >
                        {fitMode}
                    </button>
                    <div className="bg-red-500/80 text-white text-[9px] px-2 py-1 rounded backdrop-blur-sm font-bold flex items-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1.5" />
                        LIVE
                    </div>
                </div>
            )}
        </div>
    );
}
