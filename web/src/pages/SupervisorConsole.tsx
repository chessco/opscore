import { useState } from 'react';
import {
    Activity,
    Wifi,
    BarChart3,
    AlertCircle,
    Bell,
    Settings,
    RefreshCcw,
    Power,
    Map as MapIcon,
    Users,
    Timer
} from 'lucide-react';

export default function SupervisorConsole() {
    const [selectedSite, setSelectedSite] = useState('SITE A');

    // Mock data for the heatmap
    const heatmap = Array.from({ length: 156 }, (_, i) => ({
        id: i,
        status: i % 40 === 0 ? 'critical' : i % 15 === 0 ? 'degraded' : 'healthy'
    }));

    // Mock data for stream performance
    const streamData = Array.from({ length: 12 }, () => ({
        val: Math.floor(Math.random() * 40) + 30
    }));

    return (
        <div className="min-h-screen bg-[#06080c] text-[#a0a5b1] font-sans p-6 overflow-x-hidden select-none">
            {/* Header Section */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">FleetOps</h1>
                        <p className="text-[10px] font-bold text-[#4e5564] tracking-widest mt-1 uppercase">Supervisor Console V4.2</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="h-8 bg-[#0a0c12] border border-[#1e222d] px-4 rounded-full flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live System Connected</span>
                    </div>
                    <div className="flex items-center space-x-4 text-[#4e5564]">
                        <Bell size={20} className="hover:text-white cursor-pointer transition-colors" />
                        <Settings size={20} className="hover:text-white cursor-pointer transition-colors" />
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 overflow-hidden">
                            <div className="w-full h-full bg-[#1e222d]" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Stats HUD */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard label="Active Devices" val="1,240" icon={<Users className="text-blue-500" />} />
                <StatCard label="Avg Latency" val="42" suffix="ms" icon={<Wifi className="text-green-500" />} />
                <StatCard label="Stream Health" val="98.2" suffix="%" icon={<BarChart3 className="text-blue-400" />} />
                <StatCard label="Critical Alerts" val="3" color="text-red-500" icon={<AlertCircle className="text-red-500" />} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left Column (8 units) */}
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* Top Row: Heatmap and Performance Chart */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Heatmap */}
                        <div className="col-span-5 bg-[#0d1017] border border-[#1e222d] rounded-2xl p-6 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Device Heatmap Distribution</h3>
                                <div className="flex bg-[#0a0c12] p-0.5 rounded-lg border border-[#1e222d]">
                                    <button onClick={() => setSelectedSite('SITE A')} className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${selectedSite === 'SITE A' ? 'bg-[#1e222d] text-white shadow-sm' : 'text-[#4e5564]'}`}>SITE A</button>
                                    <button onClick={() => setSelectedSite('SITE B')} className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${selectedSite === 'SITE B' ? 'bg-[#1e222d] text-white shadow-sm' : 'text-[#4e5564]'}`}>SITE B</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-1.5 h-[180px]">
                                {heatmap.map(n => (
                                    <div
                                        key={n.id}
                                        className={`rounded-[1px] transition-all hover:scale-125 hover:z-10 cursor-pointer ${n.status === 'healthy' ? 'bg-[#1a3a2a] hover:bg-green-500' :
                                            n.status === 'degraded' ? 'bg-orange-500/60 hover:bg-orange-500' :
                                                'bg-red-500/80 hover:bg-red-500'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 flex space-x-4 items-center">
                                <LegendItem color="bg-green-500" label="Healthy" />
                                <LegendItem color="bg-orange-500" label="Degraded" />
                                <LegendItem color="bg-red-500" label="Critical" />
                            </div>
                        </div>

                        {/* Stream Performance Chart */}
                        <div className="col-span-7 bg-[#0d1017] border border-[#1e222d] rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center space-x-2">
                                    <Activity size={16} className="text-blue-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">Stream Performance (FPS/Bitrate)</h3>
                                </div>
                                <span className="text-[10px] text-[#4e5564] font-bold uppercase tracking-widest">Past 12 Hours</span>
                            </div>

                            <div className="h-[140px] flex items-end justify-between px-4">
                                {streamData.map((d, i) => (
                                    <div
                                        key={i}
                                        className="w-4 bg-blue-600/20 hover:bg-blue-500 transition-all rounded-t-sm group relative"
                                        style={{ height: `${d.val * 2}px` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1e222d] text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {d.val} FPS
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 grid grid-cols-4 gap-4 px-2">
                                <Metric value="60" label="Max FPS" />
                                <Metric value="54.2" label="Avg FPS" />
                                <Metric value="4.5mb" label="Bitrate" />
                                <Metric value="High" label="Stability" color="text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Incident Alert Feed */}
                    <div className="bg-[#0d1017] border border-[#1e222d] rounded-2xl overflow-hidden">
                        <div className="h-12 border-b border-[#1e222d] flex items-center justify-between px-6">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-xs font-bold text-white uppercase tracking-tight">Incident Alert Feed</h3>
                                <span className="bg-red-500/10 text-red-500 text-[8px] border border-red-500/20 px-1.5 py-0.5 rounded font-black">3 NEW</span>
                            </div>
                            <button className="text-[10px] font-bold text-blue-500 uppercase hover:text-blue-400 transition-colors">Mark all as acknowledged</button>
                        </div>
                        <div className="divide-y divide-[#1e222d]">
                            <AlertItem
                                id="402"
                                issue="Packet Loss > 20%"
                                time="2m ago"
                                loc="Site A / Rack 4"
                                status="critical"
                            />
                            <AlertItem
                                id="119"
                                issue="Thermal Throttling Warning"
                                time="14m ago"
                                loc="Site B / Rack 12"
                                status="warning"
                            />
                            <AlertItem
                                id="023"
                                issue="Connectivity Restored"
                                time="45m ago"
                                loc="Site A / Rack 2"
                                status="resolved"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column (4 units) */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Operator Load */}
                    <div className="bg-[#0d1017] border border-[#1e222d] rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-2 text-blue-500">
                                <Users size={16} />
                                <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none">Operator Load</h3>
                            </div>
                            <Settings size={14} className="text-[#4e5564] cursor-pointer" />
                        </div>
                        <div className="space-y-6">
                            <OperatorProgress name="Jane Doe" load="12/15" percent={80} status="OPTIMAL" color="bg-blue-500" />
                            <OperatorProgress name="Mike Kowalski" load="18/20" percent={90} status="HIGH LOAD" color="bg-orange-500" />
                            <OperatorProgress name="Sarah Miller" load="5/15" percent={33} status="AVAILABLE" color="bg-green-500" />
                        </div>
                        <button className="w-full mt-8 border border-dashed border-[#1e222d] text-[#4e5564] text-[9px] font-bold py-3 uppercase tracking-widest rounded-lg hover:border-blue-500/50 hover:text-blue-500 transition-all">Reassign Operators</button>
                    </div>

                    {/* Global Site Status */}
                    <div className="bg-[#0d1017] border border-[#1e222d] rounded-2xl p-6">
                        <div className="flex items-center space-x-2 text-blue-500 mb-6">
                            <MapIcon size={16} />
                            <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none">Global Site Status</h3>
                        </div>
                        <div className="aspect-video bg-[#0a0c12] rounded-xl border border-[#1e222d] mb-6 flex items-center justify-center relative overflow-hidden">
                            {/* Simplified map lines */}
                            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 pointer-events-none">
                                {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full translate-x-[var(--tx)] translate-y-[var(--ty)]" style={{ '--tx': `${Math.random() * 200}px`, '--ty': `${Math.random() * 100}px` } as any} />)}
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] z-10" />
                        </div>
                        <div className="space-y-3">
                            <RegionStatus label="North America" val="Healthy" color="text-green-500" />
                            <RegionStatus label="Europe Site 01" val="3 Issues" color="text-red-500" />
                            <RegionStatus label="Asia Hub" val="Healthy" color="text-green-500" />
                        </div>
                    </div>

                    {/* Quick Response */}
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-[0_15px_30px_rgba(37,99,235,0.2)]">
                        <div className="flex items-center space-x-2 mb-4">
                            <Zap size={18} fill="currentColor" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Quick Response</h3>
                        </div>
                        <p className="text-[10px] text-blue-100/70 font-medium mb-6 leading-relaxed uppercase">Immediate fleet-wide actions for supervisor override.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-center transition-all group">
                                <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-center transition-all group">
                                <Power size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer Bar */}
            <footer className="fixed bottom-0 left-0 right-0 h-10 bg-[#0d1017]/80 backdrop-blur-md border-t border-[#1e222d] px-6 flex items-center justify-between text-[9px] font-mono text-[#4e5564] uppercase z-50">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>API: 12ms</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>WEBRTC: Connected</span>
                    </div>
                    <span>Storage: 84%</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-[#4e5564]">SESSION_ID: <span className="text-white">FF-9923-AX-8</span></span>
                </div>
            </footer>
        </div>
    );
}

function StatCard({ label, val, suffix, color = "text-white", icon }: { label: string, val: string, suffix?: string, color?: string, icon: React.ReactNode }) {
    return (
        <div className="bg-[#0d1017] border border-[#1e222d] rounded-2xl p-5 flex items-center space-x-6">
            <div className="w-12 h-12 bg-[#0a0c12] rounded-xl flex items-center justify-center border border-[#1e222d] shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-[#4e5564] uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-black ${color} tracking-tight tabular-nums`}>{val}</span>
                    {suffix && <span className="text-xs font-bold text-[#4e5564]">{suffix}</span>}
                </div>
            </div>
        </div>
    );
}

function Metric({ value, label, color = "text-white" }: { value: string, label: string, color?: string }) {
    return (
        <div className="text-center">
            <div className={`text-xs font-bold uppercase ${color}`}>{value}</div>
            <div className="text-[8px] font-black text-[#4e5564] uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[9px] font-bold text-[#4e5564] uppercase tracking-wider">{label}</span>
        </div>
    );
}

function AlertItem({ id, issue, time, loc, status }: { id: string, issue: string, time: string, loc: string, status: 'critical' | 'warning' | 'resolved' }) {
    const iconColor = status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-orange-500' : 'text-green-500';
    return (
        <div className="px-6 py-4 flex items-center group hover:bg-[#11141b]/50 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-[#0a0c12] border border-[#1e222d]`}>
                <AlertCircle className={iconColor} size={20} />
            </div>
            <div className="flex-1">
                <h4 className="text-xs font-bold text-white tracking-tight">Device ID-{id} - {issue}</h4>
                <div className="flex items-center space-x-3 mt-1 text-[10px] text-[#4e5564] font-bold uppercase tracking-tighter">
                    <span className="flex items-center"><Timer size={10} className="mr-1" /> {time}</span>
                    <span className="flex items-center"><Wifi size={10} className="mr-1" /> {loc}</span>
                </div>
            </div>
            <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${status === 'resolved' ? 'text-green-500 bg-green-500/10 cursor-default' :
                'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95'
                }`}>
                {status === 'resolved' ? 'Resolved' : 'Drill-down'}
            </button>
        </div>
    );
}

function OperatorProgress({ name, load, percent, status, color }: { name: string, load: string, percent: number, status: string, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div>
                    <h5 className="text-[11px] font-black text-white uppercase tracking-tight">{name}</h5>
                </div>
                <span className="text-[9px] font-mono text-[#4e5564]">{load} Devices</span>
            </div>
            <div className="h-1.5 bg-[#0a0c12] rounded-full overflow-hidden border border-[#1e222d] p-[1px]">
                <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-bold text-[#4e5564] uppercase tracking-widest">Task Completion: {percent}%</span>
                <span className={`text-[8px] font-black ${status === 'HIGH LOAD' ? 'text-orange-400' : 'text-green-500'} uppercase tracking-tighter`}>{status}</span>
            </div>
        </div>
    );
}

function RegionStatus({ label, val, color }: { label: string, val: string, color: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#4e5564] uppercase tracking-tighter">{label}</span>
            <span className={`text-[10px] font-black ${color} lowercase tracking-tight`}>{val}</span>
        </div>
    );
}

function Zap({ size, fill = "none" }: { size: number, fill?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
}
