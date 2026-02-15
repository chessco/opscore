import { useState } from 'react';
import {
    Shield,
    Download,
    Calendar,
    Filter,
    Search,
    ChevronDown,
    ChevronRight,
    Circle,
    Copy,
    ExternalLink
} from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    operator: string;
    actionType: string;
    target: string;
    targetCount?: number;
    correlationId: string;
    status: 'SUCCESS' | 'FAILED' | 'PROCESSING' | 'WARNING';
    statusCode?: number;
    commandPayload?: any;
    deviceResponse?: any;
    initiatedBy: string;
    sourceIP: string;
    latency: string;
}

const MOCK_LOGS: LogEntry[] = [
    {
        id: '1',
        timestamp: '2023-11-24 14:02:11',
        operator: 'op_jdoe_admin',
        actionType: 'Broadcast Shell',
        target: 'EMEA_ALL_G90',
        targetCount: 1240,
        correlationId: 'TRK-88291-X991-AB02-F012',
        status: 'FAILED',
        statusCode: 312,
        initiatedBy: 'SysAdmin-Terminal-04',
        sourceIP: '192.168.1.104',
        latency: '4.2s (Cluster Average)',
        commandPayload: {
            command: "INSTALL_PACKAGE",
            payload: {
                package_name: "com.enterprise.kiosk.v4",
                version_code: 1045,
                force_update: true,
                reboot_policy: "NEVER"
            },
            execution_priority: "CRITICAL",
            trace_id: "TRK-22100-M004-Y982-L001"
        },
        deviceResponse: {
            status: "PARTIAL_SUCCESS",
            nodes: {
                total: 542,
                success: 538,
                failed: 4,
                error_codes: [
                    { code: 104, count: 3, msg: "INSUFFICIENT_STORAGE" },
                    { code: 508, count: 1, msg: "SIGNATURE_MISMATCH" }
                ]
            }
        }
    },
    {
        id: '2',
        timestamp: '2023-11-24 14:01:45',
        operator: 'auto_provision',
        actionType: 'Set Config Profile',
        target: 'WAREHOUSE_L3',
        correlationId: 'TRK-99802-C122-Z001-B992',
        status: 'SUCCESS',
        initiatedBy: 'System Automation',
        sourceIP: '10.0.0.1',
        latency: '0.8s'
    },
    {
        id: '3',
        timestamp: '2023-11-24 13:58:22',
        operator: 'op_smith_ops',
        actionType: 'Reboot Device',
        target: 'DVC-89211',
        correlationId: 'TRK-11004-R221-D104-A101',
        status: 'PROCESSING',
        initiatedBy: 'Web Console',
        sourceIP: '172.16.55.22',
        latency: 'Pending...'
    },
    {
        id: '4',
        timestamp: '2023-11-24 13:45:10',
        operator: 'auto_cleanup',
        actionType: 'Clear Cache Cluster',
        target: 'ALL_DEVELOPMENT',
        correlationId: 'TRK-55410-X001-J112-Q911',
        status: 'WARNING',
        initiatedBy: 'Cron Job',
        sourceIP: 'localhost',
        latency: '12.5s'
    },
    {
        id: '5',
        timestamp: '2023-11-24 13:30:04',
        operator: 'admin_root',
        actionType: 'Update System Certs',
        target: 'GLOBAL_SECURITY',
        correlationId: 'TRK-80122-C998-L043-W222',
        status: 'SUCCESS',
        initiatedBy: 'Security Terminal',
        sourceIP: '10.200.1.5',
        latency: '1.2s'
    }
];

export default function AuditLogsPage() {
    const [expandedRows, setExpandedRows] = useState<string[]>(['1']);
    const [isLive, setIsLive] = useState(false);

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status: LogEntry['status']) => {
        switch (status) {
            case 'SUCCESS': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'FAILED': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'WARNING': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'PROCESSING': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    // getStatusIcon removed

    return (
        <div className="p-6 h-full flex flex-col bg-[#0b0e14] text-[#a0a5b1] font-sans selection:bg-blue-500/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 bg-[#151921] p-5 rounded-2xl border border-[#2b303b] shadow-xl">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30">
                        <Shield className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter">Audit Log & Traceability</h1>
                        <p className="text-xs font-bold text-[#6b7280] uppercase tracking-widest mt-0.5">Enterprise Operator Compliance Console</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-[#0b0d12] border border-[#2b303b] rounded-lg p-1 flex items-center">
                        <button
                            onClick={() => setIsLive(true)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${isLive ? 'bg-green-500/20 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Live
                        </button>
                        <button
                            onClick={() => setIsLive(false)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${!isLive ? 'bg-[#2b303b] text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Paused
                        </button>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                        <Download size={16} className="mr-2" />
                        Export Logs
                        <ChevronDown size={14} className="ml-2 opacity-70" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-12 gap-4 mb-6">
                <div className="col-span-4 relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Filter by Correlation ID, Device Tag or Operator..."
                        className="w-full bg-[#151921] border border-[#2b303b] text-gray-300 text-xs rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium placeholder:text-gray-600"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#4e5564] border border-[#2b303b] px-1.5 py-0.5 rounded bg-[#0b0d12]">SEARCH CORRELATION / ID</span>
                </div>
                <div className="col-span-2 relative group">
                    <select className="w-full bg-[#151921] border border-[#2b303b] text-gray-300 text-xs rounded-xl py-3 px-4 appearance-none focus:outline-none focus:border-blue-500/50 transition-all font-bold cursor-pointer hover:bg-[#1a1f29]">
                        <option>All Operators</option>
                        <option>op_jdoe_admin</option>
                        <option>auto_provision</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    <span className="absolute -top-2.5 left-3 text-[9px] font-black text-[#6b7280] bg-[#0b0e14] px-1 uppercase tracking-widest">Operator</span>
                </div>
                <div className="col-span-3">
                    <div className="bg-[#151921] border border-[#2b303b] rounded-xl p-1 flex items-center h-full relative">
                        <span className="absolute -top-2.5 left-3 text-[9px] font-black text-[#6b7280] bg-[#0b0e14] px-1 uppercase tracking-widest z-10">Severity</span>
                        <FilterButton label="INFO" active />
                        <FilterButton label="WARN" color="text-orange-500" />
                        <FilterButton label="CRIT" color="text-red-500" />
                    </div>
                </div>
                <div className="col-span-3 flex space-x-2">
                    <div className="flex-1 relative group">
                        <div className="w-full bg-[#151921] border border-[#2b303b] text-white text-xs rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-[#1a1f29] transition-all">
                            <span className="font-bold">Last 24 Hours</span>
                            <Calendar size={14} className="text-gray-500" />
                        </div>
                        <span className="absolute -top-2.5 left-3 text-[9px] font-black text-[#6b7280] bg-[#0b0e14] px-1 uppercase tracking-widest">Date Range</span>
                    </div>
                    <button className="bg-[#151921] border border-[#2b303b] hover:border-gray-500 text-white rounded-xl px-4 flex items-center justify-center transition-all group">
                        <Filter size={16} className="text-gray-400 group-hover:text-white transition-colors mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wide">Advanced</span>
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="bg-[#1a1f29] rounded-t-2xl border border-[#2b303b] px-6 py-4 grid grid-cols-12 gap-4 text-[10px] uppercase font-black tracking-widest text-[#6b7280] sticky top-0 z-10 shadow-sm">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Operator</div>
                <div className="col-span-2">Action Type</div>
                <div className="col-span-2">Targets</div>
                <div className="col-span-3">Correlation ID</div>
                <div className="col-span-1 text-right">Status</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-2 pb-2 custom-scrollbar">
                {MOCK_LOGS.map(log => (
                    <div key={log.id} className="group">
                        <div
                            onClick={() => toggleRow(log.id)}
                            className={`bg-[#151921] border border-[#2b303b] hover:border-blue-500/30 rounded-lg px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer transition-all ${expandedRows.includes(log.id) ? 'bg-[#1a1f29] border-blue-500/30 shadow-lg' : 'hover:bg-[#1a1f29]'}`}
                        >
                            <div className="col-span-2 text-xs font-mono text-[#4e5564] font-bold group-hover:text-gray-400 transition-colors">{log.timestamp}</div>
                            <div className="col-span-2 flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[9px] font-bold text-white border border-gray-600">
                                    {log.operator.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-white tracking-tight">{log.operator}</span>
                            </div>
                            <div className="col-span-2 flex items-center space-x-2">
                                <Circle size={6} className={`fill-current ${log.actionType === 'Broadcast Shell' ? 'text-red-500' : 'text-blue-500'}`} />
                                <span className="text-xs font-medium text-gray-300">{log.actionType}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="bg-[#0b0e14] text-gray-300 text-[10px] font-bold px-2 py-1 rounded border border-[#2b303b] font-mono tracking-tight">
                                    {log.target}
                                </span>
                                {log.targetCount && <span className="ml-2 text-[10px] font-bold text-[#4e5564]">+{log.targetCount.toLocaleString()} more</span>}
                            </div>
                            <div className="col-span-3 text-xs font-mono font-bold text-blue-500 hover:text-blue-400 transition-colors tracking-tight flex items-center w-fit hover:underline decoration-blue-500/30 underline-offset-4">
                                {log.correlationId}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <span className={`flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(log.status)}`}>
                                    {log.status === 'FAILED' && log.statusCode && <span className="mr-1 opacity-75">({log.statusCode})</span>}
                                    {log.status}
                                </span>
                                <ChevronRight size={16} className={`ml-3 text-gray-600 transition-transform duration-300 ${expandedRows.includes(log.id) ? 'rotate-90 text-white' : ''}`} />
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedRows.includes(log.id) && (
                            <div className="mx-4 mt-[-4px] mb-2 bg-[#0b0e14] border-x border-b border-[#2b303b] border-t-0 rounded-b-xl p-6 shadow-inner animate-in slide-in-from-top-2 duration-200">
                                {log.commandPayload && (
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        {/* Payload */}
                                        <div className="bg-[#151921] rounded-lg border border-[#2b303b] p-4 font-mono text-xs overflow-hidden">
                                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#2b303b]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#6b7280]">Command Payload (JSON)</span>
                                                <button className="text-[9px] font-bold text-blue-500 hover:text-white uppercase flex items-center transition-colors">
                                                    <Copy size={10} className="mr-1.5" /> Copy
                                                </button>
                                            </div>
                                            <pre className="text-gray-400 overflow-x-auto custom-scrollbar leading-relaxed">
                                                {JSON.stringify(log.commandPayload, null, 4)}
                                            </pre>
                                        </div>

                                        {/* Response */}
                                        <div className="bg-[#151921] rounded-lg border border-[#2b303b] p-4 font-mono text-xs overflow-hidden">
                                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#2b303b]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#6b7280]">Device Cluster Response</span>
                                                <button className="text-[9px] font-bold text-blue-500 hover:text-white uppercase flex items-center transition-colors">
                                                    View Full Log <ExternalLink size={10} className="ml-1.5" />
                                                </button>
                                            </div>
                                            <pre className="text-gray-400 overflow-x-auto custom-scrollbar leading-relaxed">
                                                {JSON.stringify(log.deviceResponse, null, 4)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Meta Info Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-[#2b303b] text-gray-500">
                                    <div className="flex space-x-12">
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest mb-1 text-[#4e5564]">Initiated By</div>
                                            <div className="text-xs font-bold text-gray-300">{log.initiatedBy}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest mb-1 text-[#4e5564]">Source IP</div>
                                            <div className="text-xs font-bold text-gray-300 font-mono">{log.sourceIP}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest mb-1 text-[#4e5564]">Execution Latency</div>
                                            <div className="text-xs font-bold text-gray-300">{log.latency}</div>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center uppercase tracking-wider transition-colors">
                                        Go to Trace Map <ExternalLink size={12} className="ml-1.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination Footer */}
            <div className="mt-4 pt-4 border-t border-[#2b303b] flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span className="font-medium text-[#4e5564]">Rows per page:</span>
                    <div className="bg-[#151921] border border-[#2b303b] rounded py-1 px-2 text-gray-300 font-bold flex items-center cursor-pointer hover:border-gray-600 transition-colors">
                        50 <ChevronDown size={12} className="ml-2" />
                    </div>
                    <span className="text-[#4e5564] pl-4 border-l border-[#2b303b]">Showing 1-50 of 12,842 results</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 rounded bg-[#151921] border border-[#2b303b] flex items-center justify-center hover:bg-[#1a1f29] transition-colors">
                        <ChevronRight size={14} className="rotate-180" />
                    </button>
                    <button className="w-8 h-8 rounded bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg shadow-blue-600/20">1</button>
                    <button className="w-8 h-8 rounded bg-[#151921] border border-[#2b303b] hover:bg-[#1a1f29] hover:text-white transition-colors font-bold flex items-center justify-center">2</button>
                    <button className="w-8 h-8 rounded bg-[#151921] border border-[#2b303b] hover:bg-[#1a1f29] hover:text-white transition-colors font-bold flex items-center justify-center">3</button>
                    <span className="px-2 text-gray-600">...</span>
                    <button className="w-8 h-8 rounded bg-[#151921] border border-[#2b303b] hover:bg-[#1a1f29] hover:text-white transition-colors font-bold flex items-center justify-center">257</button>
                    <button className="w-8 h-8 rounded bg-[#151921] border border-[#2b303b] flex items-center justify-center hover:bg-[#1a1f29] transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
                <div className="flex items-center space-x-2 text-[#4e5564] hover:text-white cursor-pointer transition-colors">
                    <Filter size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Table Settings</span>
                </div>
            </div>
        </div>
    );
}

function FilterButton({ label, active, color = 'text-white' }: { label: string, active?: boolean, color?: string }) {
    return (
        <button className={`h-full px-4 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${active ? 'bg-[#0b0e14] text-white shadow-sm' : `${color} hover:bg-[#1a1f29]`}`}>
            {label}
        </button>
    );
}

