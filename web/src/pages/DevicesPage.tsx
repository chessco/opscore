import { useState } from 'react';
import {
    Search,
    Plus,
    MoreVertical,
    Smartphone,
    Tablet,
    Folder,
    Building2,
    Settings,
    ChevronDown,
    FolderOpen,
    Trash2,
    Move,
    Tag,
    CheckSquare,
    Info
} from 'lucide-react';

// Mock Data
const MOCK_GROUPS = [
    { id: '1', name: 'All Devices', count: 204, type: 'root', active: false },
    { id: '2', name: 'Site A - HQ', count: 82, type: 'site', active: false },
    {
        id: '3', name: 'Testing Unit', count: 12, type: 'unit', active: true, isOpen: true, children: [
            { id: '3-1', name: 'Staging Alpha', type: 'sub', active: false },
            { id: '3-2', name: 'Beta Flight', type: 'sub', active: false },
        ]
    },
    { id: '4', name: 'Production', count: 110, type: 'folder', active: false },
];

const MOCK_DEVICES = [
    { id: 'AD-882-QX', model: 'Pixel 6a', ip: '192.168.1.104', status: 'ONLINE', tags: ['Beta', 'Dev'], type: 'phone' },
    { id: 'AD-901-LZ', model: 'Samsung Tab S8', ip: '192.168.1.112', status: 'OFFLINE', tags: ['Legacy'], type: 'tablet' },
    { id: 'AD-224-PF', model: 'Zebra TC52', ip: '10.42.0.15', status: 'ONLINE', tags: ['Critical'], type: 'phone' },
    { id: 'AD-101-XC', model: 'Pixel 4 XL', ip: '192.168.1.155', status: 'ONLINE', tags: [], type: 'phone' },
    // ... more mock data would go here
];

const TAG_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500', 'bg-slate-500'
];

export default function FleetConsole() {
    const [selectedDevices, setSelectedDevices] = useState<string[]>(['AD-882-QX', 'AD-901-LZ', 'AD-224-PF']);

    // Toggle device selection
    const toggleDevice = (id: string) => {
        if (selectedDevices.includes(id)) {
            setSelectedDevices(selectedDevices.filter(d => d !== id));
        } else {
            setSelectedDevices([...selectedDevices, id]);
        }
    };

    const getStatusColor = (status: string) => status === 'ONLINE' ? 'text-green-500' : 'text-[#4e5564]';
    const getTagStyle = (tag: string) => {
        switch (tag) {
            case 'Beta': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Dev': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Legacy': return 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30';
            case 'Critical': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-gray-700/50 text-gray-400 border-gray-600';
        }
    };

    return (
        <div className="flex h-screen bg-[#0b0e14] text-[#a0a5b1] font-sans overflow-hidden">

            {/* LEFT SIDEBAR - GROUPS */}
            <div className="w-64 flex flex-col border-r border-[#1e222d] bg-[#0d1017]">
                {/* Header */}
                <div className="h-16 flex items-center px-4 border-b border-[#1e222d]">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/20">
                        <Settings className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-tight">FleetConsole</h1>
                        <span className="text-[10px] font-bold text-[#4e5564] italic">v2.4</span>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-[#4e5564] group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="w-full bg-[#151921] border border-[#2b303b] rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-[#4e5564] focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* New Group Button */}
                <div className="px-4 mb-4">
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-blue-600/10">
                        <Plus size={14} className="mr-2" /> New Group
                    </button>
                </div>

                {/* Group Structure */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5">
                    {MOCK_GROUPS.map(group => (
                        <div key={group.id}>
                            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group transition-colors ${group.active ? 'bg-[#1e222d]' : 'hover:bg-[#151921]'}`}>
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    {group.isOpen !== undefined && (
                                        <ChevronDown size={12} className="text-[#4e5564]" />
                                    )}
                                    {group.type === 'folder' && <Folder size={14} className="text-[#4e5564]" />}
                                    {group.type === 'site' && <Building2 size={14} className="text-[#4e5564]" />}
                                    {group.type === 'unit' && <FolderOpen size={14} className="text-blue-500" />}
                                    {group.type === 'root' && <Folder size={14} className="text-blue-500" />}

                                    <span className={`text-xs font-bold truncate ${group.active ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                        {group.name}
                                    </span>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${group.active ? 'bg-blue-600 text-white' : 'bg-[#151921] text-[#4e5564] border border-[#2b303b]'}`}>
                                    {group.count}
                                </span>
                            </div>

                            {/* Children */}
                            {group.isOpen && group.children && (
                                <div className="ml-4 pl-2 border-l border-[#2b303b] mt-1 space-y-0.5 mb-1">
                                    {group.children.map(child => (
                                        <div key={child.id} className="flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-[#151921] group">
                                            <div className="flex items-center space-x-2">
                                                <Smartphone size={12} className="text-[#4e5564]" />
                                                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300">{child.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT - DEVICE LIST */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0b0e14]">
                {/* Top Bar */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e222d] bg-[#0d1017]">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-bold text-white tracking-tight">Testing Unit</h2>
                        <span className="text-xs font-bold text-[#4e5564] bg-[#151921] px-2 py-1 rounded border border-[#2b303b]">12 Devices</span>
                    </div>

                    <div className={`flex items-center space-x-3 transition-opacity duration-200 ${selectedDevices.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <span className="text-xs font-medium text-[#4e5564] mr-2">{selectedDevices.length} selected</span>

                        <button className="flex items-center px-3 py-1.5 bg-[#151921] border border-[#2b303b] hover:border-blue-500/50 rounded-lg text-xs font-bold text-blue-500 hover:text-white transition-all uppercase tracking-wide">
                            <Tag size={12} className="mr-1.5" /> + Add Tag
                        </button>
                        <button className="flex items-center px-3 py-1.5 bg-[#151921] border border-[#2b303b] hover:border-white/20 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all uppercase tracking-wide">
                            <Move size={12} className="mr-1.5" /> Move
                        </button>
                        <button className="flex items-center px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-500 transition-all uppercase tracking-wide">
                            <Trash2 size={12} className="mr-1.5" /> Delete
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#1e222d] bg-[#0b0e14] text-[10px] font-black uppercase tracking-widest text-[#4e5564]">
                    <div className="col-span-1 flex items-center">
                        <div className="w-4 h-4 border border-[#4e5564] rounded hover:border-white cursor-pointer transition-colors" />
                    </div>
                    <div className="col-span-2">Device ID</div>
                    <div className="col-span-2">Model</div>
                    <div className="col-span-2">IP Address</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Current Tags</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Device Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {MOCK_DEVICES.map(device => (
                        <div
                            key={device.id}
                            onClick={() => toggleDevice(device.id)}
                            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1e222d] items-center cursor-pointer transition-colors group ${selectedDevices.includes(device.id) ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-[#151921]'}`}
                        >
                            <div className="col-span-1 flex items-center">
                                {selectedDevices.includes(device.id) ? (
                                    <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white">
                                        <CheckSquare size={12} />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 border border-[#2b303b] rounded group-hover:border-gray-500 transition-colors" />
                                )}
                            </div>

                            <div className="col-span-2 font-bold text-white text-xs tracking-tight flex items-center">
                                {device.type === 'tablet' ? <Tablet size={14} className="mr-2 text-[#4e5564]" /> : <Smartphone size={14} className="mr-2 text-[#4e5564]" />}
                                <div className="flex flex-col">
                                    <span>{device.id.split('-')[0]}-</span>
                                    <span>{device.id.split('-').slice(1).join('-')}</span>
                                </div>
                            </div>

                            <div className="col-span-2 text-xs font-medium text-gray-400">{device.model}</div>

                            <div className="col-span-2 text-xs font-mono text-[#4e5564] font-bold">{device.ip}</div>

                            <div className="col-span-2 flex items-center">
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${device.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-[#4e5564]'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(device.status)}`}>{device.status}</span>
                            </div>

                            <div className="col-span-2 flex flex-wrap gap-1.5">
                                {device.tags.length > 0 ? device.tags.map(tag => (
                                    <span key={tag} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center ${getTagStyle(tag)}`}>
                                        {tag} <span className="ml-1 cursor-pointer hover:text-white">×</span>
                                    </span>
                                )) : (
                                    <span className="text-[10px] text-[#2b303b] italic">No tags</span>
                                )}
                            </div>

                            <div className="col-span-1 flex justify-end">
                                <MoreVertical size={16} className="text-[#4e5564] hover:text-white transition-colors" />
                            </div>
                        </div>
                    ))}

                    {/* Empty placeholder row for visual filling */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1e222d] items-center opacity-30 pointer-events-none">
                        <div className="col-span-1"><div className="w-4 h-4 border border-[#2b303b] rounded" /></div>
                        <div className="col-span-2 flex items-center"><Smartphone size={14} className="mr-2" /> AD-101-XC</div>
                        <div className="col-span-2 text-xs">Pixel 4 XL</div>
                        <div className="col-span-2 text-xs font-mono">192.168.1.155</div>
                        <div className="col-span-2 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" /> ONLINE</div>
                        <div className="col-span-2 text-[10px] italic">No tags</div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="h-8 border-t border-[#1e222d] bg-[#0d1017] flex items-center justify-between px-4 text-[9px] font-bold text-[#4e5564] uppercase tracking-widest">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center text-green-500"><span className="w-1 h-1 bg-green-500 rounded-full mr-1" /> Engine: Connected</span>
                        <span className="border-l border-[#1e222d] pl-4">API Latency: 42ms</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span>204 Devices Managed</span>
                        <span className="text-blue-500">Build 8.2.1-STABLE</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - TAG MANAGER */}
            <div className="w-72 border-l border-[#1e222d] bg-[#0d1017] flex flex-col">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e222d]">
                    <div className="flex items-center space-x-2 text-white">
                        <Tag size={16} className="text-blue-500" fill="currentColor" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Tag Manager</h3>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Create New Tag */}
                    <div className="mb-8">
                        <h4 className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-3">Create New Tag</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-[#4e5564] uppercase mb-1 block">Label Name</label>
                                <input type="text" placeholder="e.g. In Repair" className="w-full bg-[#0b0e14] border border-[#2b303b] rounded-lg p-2 text-xs text-white placeholder-[#2b303b] focus:border-blue-500/50 outline-none transition-colors" />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-[#4e5564] uppercase mb-1 block">Brand Color</label>
                                <div className="flex space-x-2">
                                    {TAG_COLORS.map(color => (
                                        <div key={color} className={`w-6 h-6 rounded-md cursor-pointer hover:scale-110 transition-transform ${color} ${color === 'bg-blue-500' ? 'ring-2 ring-white' : ''}`} />
                                    ))}
                                    <div className="w-6 h-6 rounded-md bg-[#151921] border border-[#2b303b] flex items-center justify-center cursor-pointer hover:border-white">
                                        <div className="w-2 h-2 rounded-full bg-white opacity-20" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-[#4e5564] uppercase mb-1 block">Visibility (RBAC)</label>
                                <div className="relative">
                                    <select className="w-full bg-[#151921] border border-[#2b303b] text-white text-xs rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none">
                                        <option>All Operators</option>
                                        <option>Admins Only</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-2.5 text-[#4e5564]" />
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wide shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                Create Tag
                            </button>
                        </div>
                    </div>

                    {/* Fleet Distribution */}
                    <div className="mb-8">
                        <h4 className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-4">Fleet Distribution</h4>
                        <div className="space-y-4">
                            <DistributionItem label="Critical" count={42} color="bg-blue-600" width="w-1/3" />
                            <DistributionItem label="Legacy" count={88} color="bg-orange-500" width="w-2/3" />
                            <DistributionItem label="Beta Staging" count={12} color="bg-blue-400" width="w-1/6" />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h4 className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-4">Recent Activity</h4>
                        <div className="space-y-4">
                            <ActivityItem
                                icon={<Tag size={10} />}
                                color="bg-green-500/20 text-green-500 border-green-500/30"
                                text={<span><span className="text-white">Operator_4</span> applied <span className="text-blue-400">"Critical"</span> to 5 devices.</span>}
                                time="2 hours ago"
                            />
                            <ActivityItem
                                icon={<Trash2 size={10} />}
                                color="bg-red-500/20 text-red-500 border-red-500/30"
                                text={<span><span className="text-white">System</span> removed <span className="text-red-400">"Legacy"</span> from 1 device.</span>}
                                time="5 hours ago"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Footer */}
                <div className="p-4 border-t border-[#1e222d] text-center">
                    <button className="text-[9px] font-bold text-[#4e5564] hover:text-white uppercase tracking-widest flex items-center justify-center w-full transition-colors">
                        <Info size={10} className="mr-1.5" /> Documentation
                    </button>
                </div>
            </div>
        </div>
    );
}

function DistributionItem({ label, count, color, width }: { label: string, count: number, color: string, width: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white tracking-tight">{label}</span>
                <span className="text-[10px] font-mono text-[#4e5564]">{count} devices</span>
            </div>
            <div className="h-1 bg-[#151921] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: width === 'w-1/3' ? '33%' : width === 'w-2/3' ? '66%' : '10%' }} />
            </div>
        </div>
    );
}

function ActivityItem({ icon, color, text, time }: { icon: any, color: string, text: any, time: string }) {
    return (
        <div className="flex items-start space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-[#a0a5b1] leading-relaxed font-medium">
                    {text}
                </p>
                <p className="text-[9px] font-bold text-[#4e5564] mt-0.5">{time}</p>
            </div>
        </div>
    );
}
