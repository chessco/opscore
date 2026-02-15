import { useState } from 'react';
import {
    X,
    Rocket,
    Tag,
    Layers,
    ChevronDown,
    AlertCircle,
    AlertTriangle,
    Play,
    FileText
} from 'lucide-react';

interface BroadcastCommandProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BroadcastCommand({ isOpen, onClose }: BroadcastCommandProps) {
    const [payload, setPayload] = useState(`{
  "retry_attempts": 3,
  "timeout_ms": 120000,
  "verification": "checksum_v2"
}`);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-[#0d1017] border-l border-[#1e222d] shadow-2xl z-50 flex flex-col font-sans transition-all duration-300 transform translate-x-0">
            {/* Header */}
            <header className="h-16 border-b border-[#1e222d] px-6 flex items-center justify-between bg-[#11141b]">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
                        <Rocket size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">Broadcast Command</h2>
                        <p className="text-[10px] text-[#4e5564] font-mono leading-none mt-0.5">Targeting <span className="text-blue-400">1,248 Android Devices</span></p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-[#4e5564] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Target Selection */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-widest">Target Selection</label>
                        <span className="text-[8px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">RBAC: LEVEL 3</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center space-x-2 bg-blue-600/10 border border-blue-500/30 p-2.5 rounded-lg text-blue-400 text-xs font-medium">
                            <Tag size={14} />
                            <span>By Region Tags</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-[#161b22] border border-[#1e222d] p-2.5 rounded-lg text-[#4e5564] hover:text-[#a0a5b1] text-xs font-medium transition-colors">
                            <Layers size={14} />
                            <span>Device Groups</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-2 bg-[#0a0c10] rounded-lg border border-[#1e222d] min-h-[44px]">
                        <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded flex items-center space-x-1.5 border border-blue-500/30">
                            <span>Region-West</span>
                            <X size={10} className="mt-0.5 cursor-pointer hover:text-white transition-colors" />
                        </span>
                        <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded flex items-center space-x-1.5 border border-blue-500/30">
                            <span>Model-Galaxy-S21</span>
                            <X size={10} className="mt-0.5 cursor-pointer hover:text-white transition-colors" />
                        </span>
                        <button className="text-[10px] text-[#4e5564] hover:text-blue-400 font-medium px-2 py-0.5">+ Add Filter</button>
                    </div>
                </section>

                {/* Command Macro */}
                <section className="space-y-4">
                    <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-widest">Command Macro</label>
                    <div className="relative group">
                        <div className="w-full bg-[#161b22] border border-[#1e222d] group-hover:border-[#2a2f3b] p-3 rounded-lg text-xs text-[#a0a5b1] flex justify-between items-center cursor-pointer transition-colors">
                            <span className="font-medium">Update APK - Enterprise v2.4.1</span>
                            <ChevronDown size={16} className="text-[#4e5564]" />
                        </div>
                    </div>
                </section>

                {/* Command Parameters */}
                <section className="space-y-4">
                    <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-widest">Command Parameters</label>

                    <div className="space-y-4 bg-[#11141b] p-4 rounded-xl border border-[#1e222d]">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[10px] font-semibold text-[#a0a5b1]">Installation Source URL</label>
                                <span className="text-[9px] text-[#4e5564]">Required</span>
                            </div>
                            <input
                                value="https://cdn.enterprise.io/assets/v2.4.1.apk"
                                readOnly
                                className="w-full bg-[#0a0c10] border border-[#1e222d] p-3 rounded-lg text-[11px] font-mono text-blue-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <label className="text-[10px] font-semibold text-[#a0a5b1]">Force Restart after update</label>
                            <div className="w-9 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center space-x-1.5">
                                <FileText size={12} className="text-[#4e5564]" />
                                <label className="text-[10px] font-semibold text-[#a0a5b1]">Execution Payload (JSON)</label>
                            </div>
                            <textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-[#1e222d] p-4 rounded-lg text-[11px] font-mono text-gray-400 h-32 focus:outline-none focus:border-blue-500/30 custom-scrollbar resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Safety Confirmation */}
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
                    <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-tighter leading-none">Safety Confirmation</p>
                        <p className="text-[10px] text-red-400/70 leading-relaxed font-medium">Executing this macro will override local configuration on all targeted devices. This action is logged and audited.</p>
                    </div>
                </div>

                {/* Deployment Progress */}
                <section className="space-y-2.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Deployment Progress</span>
                        <span className="text-[12px] font-mono font-bold text-white">88%</span>
                    </div>
                    <div className="h-1.5 bg-[#1e222d] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: '88%' }}></div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="p-6 bg-[#11141b] border-t border-[#1e222d] space-y-4">
                <div className="flex gap-3">
                    <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 group">
                        <AlertCircle size={16} className="group-hover:animate-pulse" />
                        <span className="tracking-tight uppercase">Emergency Stop</span>
                    </button>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 group">
                        <Play size={16} fill="currentColor" />
                        <span className="tracking-tight uppercase">Execute Now</span>
                    </button>
                </div>
                <button className="w-full text-center text-[9px] font-bold text-[#4e5564] hover:text-[#a0a5b1] uppercase tracking-widest transition-colors">
                    Download Execution Audit Log
                </button>
            </footer>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e222d; border-radius: 10px; }
            `}</style>
        </div>
    );
}

// Add CSS keyframes for some micro-animations

