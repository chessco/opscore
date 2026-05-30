import { useState, useEffect } from 'react';
import { 
    Play, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    User, 
    Phone, 
    Activity, 
    MessageSquare, 
    ChevronRight,
    Volume2,
    VolumeX,
    Zap,
    Smartphone,
    Copy,
    X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { QRCodeSVG } from 'qrcode.react';
import BroadcastCommand from '../components/BroadcastCommand';
import api from '../services/api';

interface Step {
    id: string;
    type: 'multiple_choice' | 'nps' | 'text_area';
    question: string;
    required: boolean;
    min?: number;
    max?: number;
    options?: Array<{ value: string; label: string; next: string | null }>;
    next?: string | null;
}

interface SurveySchema {
    id: string;
    title: string;
    steps: Step[];
}

export default function CampaignsWorkspacePage() {
    const { user, token } = useAuthStore() as any;
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [activeInteraction, setActiveInteraction] = useState<any>(null);
    const [lead, setLead] = useState<any>(null);
    const [survey, setSurvey] = useState<SurveySchema | null>(null);
    const [currentStepId, setCurrentStepId] = useState<string>('');
    const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({});
    
    const activeCampaign = campaigns.find(c => c.id === selectedCampaignId);
    const isExternalSurvey = activeCampaign?.surveyType === 'EXTERNAL';
    
    // Dialer configurations
    const [dialerMode, setDialerMode] = useState<'preview' | 'progressive'>('preview');
    const [progressiveCountdown, setProgressiveCountdown] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    
    // UI state
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [interactionState, setInteractionState] = useState<'IDLE' | 'DIALING' | 'RINGING' | 'ANSWERED' | 'SURVEY' | 'FINISHED'>('IDLE');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>(['Workspace de Agente inicializado.']);

    // Default mock survey schema
    const defaultSurvey: SurveySchema = {
        id: "survey_nps_satisfaction",
        title: "Encuesta de Satisfacción de Servicio",
        steps: [
            {
                id: "step_welcome",
                type: "multiple_choice",
                question: "¿Cómo califica su experiencia general con Pitaya Ops hoy?",
                required: true,
                options: [
                    { value: "excelente", label: "Excelente experiencia", next: "step_nps" },
                    { value: "regular", label: "Experiencia regular", next: "step_complaint" },
                    { value: "malo", label: "Mala experiencia", next: "step_complaint" }
                ]
            },
            {
                id: "step_nps",
                type: "nps",
                question: "En una escala del 0 al 10, ¿qué tan probable es que nos recomiende a un colega?",
                required: true,
                min: 0,
                max: 10,
                next: "step_comments"
            },
            {
                id: "step_complaint",
                type: "text_area",
                question: "Lamentamos escuchar eso. Por favor describa detalladamente el motivo de su insatisfacción:",
                required: true,
                next: "step_comments"
            },
            {
                id: "step_comments",
                type: "text_area",
                question: "¿Tiene algún comentario o sugerencia adicional para nuestro equipo?",
                required: false,
                next: null
            }
        ]
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Progressive dialing countdown watcher
    useEffect(() => {
        if (progressiveCountdown === null) return;
        if (progressiveCountdown === 0) {
            setProgressiveCountdown(null);
            handleStartInteraction();
            return;
        }

        const timer = setTimeout(() => {
            setProgressiveCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearTimeout(timer);
    }, [progressiveCountdown]);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
            if (res.data.length > 0) {
                setSelectedCampaignId(res.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching campaigns', err);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 8)]);
    };

    // Main queue-based dial logic
    const handleStartInteraction = async () => {
        if (!selectedCampaignId) return;
        setLoading(true);
        setInteractionState('DIALING');
        addLog('Marcador: Solicitando lead de la cola de la campaña...');

        try {
            // 1. Fetch next lead from campaign outbox queue in backend
            let targetLead: any;
            try {
                const leadRes = await api.get(`/dialer/next/${selectedCampaignId}`);
                targetLead = leadRes.data;
                addLog(`Lead obtenido de la cola: ${targetLead.name} (${targetLead.phone})`);
            } catch (queueErr) {
                // Outbox queue is empty - fallback to seed a fresh simulation lead
                addLog('Cola vacía. Inicializando lead de demostración autogenerado...');
                const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
                const leadRes = await api.post('/leads', {
                    campaignId: selectedCampaignId,
                    name: `Lead Cliente #${randomSuffix}`,
                    phone: `+52 55 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
                    metadata: { segment: 'Retail-A', city: 'CDMX' }
                });
                targetLead = leadRes.data;
            }
            setLead(targetLead);

            // 2. Load or seed dynamic survey script
            const surveysRes = await api.get(`/surveys/campaign/${selectedCampaignId}`);
            let targetSurvey = defaultSurvey;
            if (surveysRes.data.length > 0) {
                const dbSurvey = surveysRes.data[0];
                targetSurvey = { id: dbSurvey.id, title: dbSurvey.title, steps: dbSurvey.schema?.steps || [] };
            } else {
                try {
                    const seedSurveyRes = await api.post('/surveys', {
                        campaignId: selectedCampaignId,
                        title: defaultSurvey.title,
                        schema: defaultSurvey
                    });
                    const dbSurvey = seedSurveyRes.data;
                    targetSurvey = { id: dbSurvey.id, title: dbSurvey.title, steps: dbSurvey.schema?.steps || [] };
                } catch (_) { /* ignore */ }
            }
            setSurvey(targetSurvey);
            setSurveyResponses({});
            if (targetSurvey.steps && targetSurvey.steps.length > 0) {
                setCurrentStepId(targetSurvey.steps[0].id);
            }

            // 3. Pair and command physical Android device to dial via backend Dialer module
            addLog('Disparando marcación remota en dispositivo Android mediante WebSocket...');
            try {
                const dialRes = await api.post(`/dialer/dial/${targetLead.id}`);
                setActiveInteraction(dialRes.data.interaction);
                addLog(`Marcación exitosa en dispositivo: ${dialRes.data.deviceAssociated}`);
            } catch (dialErr) {
                // Sandbox fallback: create mock interaction if no hardware is currently paired
                addLog('Hardware no emparejado. Activando simulación de marcación en Sandbox...');
                const interactionRes = await api.post('/interactions', {
                    campaignId: selectedCampaignId,
                    leadId: targetLead.id,
                    surveyId: targetSurvey.id
                });
                setActiveInteraction(interactionRes.data);
            }

            // 4. Sequence transitions: Dialing -> Ringing -> wait for manual action
            setTimeout(() => {
                setInteractionState('RINGING');
                addLog('Dispositivo remoto timbrando...');
                
                // Play calling sound simulation if not muted
                if (!isMuted && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance("Llamando");
                    utterance.lang = "es-MX";
                    window.speechSynthesis.speak(utterance);
                }
            }, 1000);

        } catch (err) {
            console.error('Failed to dial lead', err);
            setInteractionState('IDLE');
            addLog('Error de red al establecer conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelection = (value: any, nextStep: string | null) => {
        const updatedResponses = {
            ...surveyResponses,
            [currentStepId]: value
        };
        setSurveyResponses(updatedResponses);
        addLog(`Respuesta guardada para [${currentStepId}]: ${value}`);

        if (nextStep && survey) {
            const stepExists = survey.steps.some(s => s.id === nextStep);
            if (stepExists) {
                setCurrentStepId(nextStep);
                return;
            }
        }

        const currentIdx = survey?.steps.findIndex(s => s.id === currentStepId) ?? -1;
        if (currentIdx !== -1 && survey && currentIdx < survey.steps.length - 1) {
            setCurrentStepId(survey.steps[currentIdx + 1].id);
        } else {
            handleSubmitSurvey(updatedResponses);
        }
    };

    const handleSubmitSurvey = async (finalResponses: Record<string, any>) => {
        if (!activeInteraction) return;
        setLoading(true);
        addLog('Persistiendo encuesta en base de datos...');

        try {
            await api.post(`/interactions/${activeInteraction.id}/response`, {
                response: finalResponses
            });

            // Stop physical call and recording
            try {
                await api.post(`/dialer/stop/${activeInteraction.id}`);
                addLog('Comando STOP_RECORDING enviado al dispositivo. Subiendo archivo real en segundo plano...');
            } catch (_) { 
                addLog('Error al intentar detener grabación/llamada en el dispositivo.');
            }

            setInteractionState('FINISHED');
            addLog('Disposición completada exitosamente.');

            // Progressive Auto-dialer logic
            if (dialerMode === 'progressive') {
                setProgressiveCountdown(5); // Start 5 seconds countdown to next call
                addLog('Marcación Progresiva: Siguiente asignación en 5 segundos...');
            }

        } catch (err) {
            console.error('Failed to save survey', err);
            addLog('Error al guardar interacción.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setProgressiveCountdown(null);
        setInteractionState('IDLE');
        setActiveInteraction(null);
        setLead(null);
        setSurvey(null);
        setSurveyResponses({});
        addLog('Estación lista para una nueva marcación.');
    };

    const currentStep = survey?.steps.find(s => s.id === currentStepId);

    // Audio Playback Simulation for Lead CRM panel
    const playMockRecording = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("Reproduciendo grabación de la interacción previa.");
            utterance.lang = "es-MX";
            window.speechSynthesis.speak(utterance);
            addLog('Reproduciendo grabación previa mediante SpeechEngine...');
        }
    };

    // Construct the config JSON for the QR code
    const serverUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3008`;
    const qrConfigJson = JSON.stringify({
        server_url: serverUrl,
        auth_token: user?.token || localStorage.getItem('auth-storage')?.match(/"token":"(.*?)"/)?.[1] || '',
        campaign_id: selectedCampaignId
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    return (
        <div className="h-full flex flex-col min-w-0 bg-[#070a0e] overflow-hidden text-slate-300">
            {/* Control Dashboard Header */}
            <div className="bg-[#0b0e14] border-b border-[#1e222d] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center space-x-2">
                        <Activity className="text-blue-500 animate-pulse" size={20} />
                        <span>Estación de Trabajo del Agente</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold">
                        Campaña Activa: {campaigns.find(c => c.id === selectedCampaignId)?.name || 'Selecciona una Campaña'}
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Dialer Mode Selector */}
                    {interactionState === 'IDLE' && (
                        <div className="flex items-center space-x-2 bg-[#11141b] border border-[#1e222d] p-1 rounded-xl">
                            <button
                                onClick={() => setDialerMode('preview')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    dialerMode === 'preview' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Manual/Preview
                            </button>
                            <button
                                onClick={() => setDialerMode('progressive')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
                                    dialerMode === 'progressive' 
                                        ? 'bg-purple-600 text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Zap size={10} />
                                <span>Progresivo</span>
                            </button>
                        </div>
                    )}

                    {/* QR Modal Button */}
                    {interactionState === 'IDLE' && selectedCampaignId && (
                        <button
                            onClick={() => setIsQRModalOpen(true)}
                            className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 p-2 rounded-xl transition-all"
                            title="Vincular Celular"
                        >
                            <Smartphone size={16} />
                        </button>
                    )}

                    {/* Mute Audio switch */}
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className={`p-2 rounded-xl border transition-all ${
                            isMuted 
                                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                : 'bg-[#11141b] border-[#1e222d] text-slate-500 hover:text-white'
                        }`}
                        title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>

                    {interactionState === 'IDLE' && (
                        <div className="flex items-center space-x-3 bg-[#11141b] border border-[#1e222d] px-3 py-1.5 rounded-xl">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campaña:</label>
                            <select 
                                value={selectedCampaignId}
                                onChange={(e) => setSelectedCampaignId(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                            >
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#11141b]">{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {interactionState === 'IDLE' ? (
                        <button
                            onClick={handleStartInteraction}
                            disabled={!selectedCampaignId || loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            <Play size={14} />
                            <span>Solicitar Marcación</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="bg-[#1e222d] hover:bg-white/5 border border-[#2b303b] text-slate-400 hover:text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all"
                        >
                            <span>Liberar Estación</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Interactive Screen */}
            <div className="flex-1 flex min-h-0 bg-[#070a0e]">
                {/* Left Panel: Dynamic Lead CRM Timeline */}
                <div className="w-80 bg-[#0a0d14]/75 border-r border-[#1e222d] flex flex-col min-h-0">
                    <div className="p-5 border-b border-[#1e222d] bg-[#11141b]/20">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                            <User size={14} className="text-blue-500" />
                            <span>Línea del CRM de Lead</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
                        {lead ? (
                            <div className="bg-[#11141b]/40 border border-[#1e222d] rounded-xl p-4 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white text-sm">{lead.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-wide">{lead.id}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-[#1e222d]/60 font-medium">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#525a6c] flex items-center gap-1"><Phone size={10} /> Teléfono</span>
                                        <span className="font-mono text-white font-semibold">{lead.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#525a6c] flex items-center gap-1"><Activity size={10} /> Estado</span>
                                        <span className="text-blue-400 font-bold uppercase text-[9px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                            {lead.status}
                                        </span>
                                    </div>
                                    {lead.metadata && Object.entries(lead.metadata).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <span className="text-[#525a6c] capitalize">{key}</span>
                                            <span className="text-slate-300 font-semibold">{String(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 bg-[#11141b]/10 border border-dashed border-[#1e222d] rounded-xl flex flex-col justify-center items-center text-center p-4">
                                <User className="text-[#2b303b] mb-2" size={32} />
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Esperando Asignación de Lead</span>
                            </div>
                        )}

                        {/* Interactive Timeline */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                                <Clock size={12} />
                                <span>Historial del Lead</span>
                            </h4>

                            <div className="relative border-l border-[#1e222d] pl-4 ml-2 space-y-4">
                                {lead && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#070a0e]"></div>
                                            <p className="font-bold text-white text-[11px] leading-tight">Interacción activa establecida</p>
                                            <p className="text-[9px] text-[#4e5564] mt-0.5">Enlace mediante nodo de operador global.</p>
                                        </div>
                                        <div className="relative bg-[#11141b]/40 border border-[#1e222d] rounded-xl p-3 space-y-2 mt-2">
                                            <p className="font-bold text-slate-300 text-[10px] uppercase flex items-center space-x-1">
                                                <Volume2 size={12} className="text-green-500" />
                                                <span>Grabación de Llamada Previa</span>
                                            </p>
                                            <button 
                                                onClick={playMockRecording}
                                                className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold py-1.5 rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                                            >
                                                <Play size={10} />
                                                <span>Escuchar Grabación</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-[#070a0e]"></div>
                                    <p className="font-bold text-slate-400 text-[11px] leading-tight">Lead Importado a la Campaña</p>
                                    <p className="text-[9px] text-[#4e5564] mt-0.5">Ingesta de base de datos exitosa.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Dynamic JSON Survey Compiler & State Renderer */}
                <div className="flex-1 flex flex-col bg-[#070a0e] relative">
                    <div className="flex-1 overflow-y-auto p-8 flex justify-center items-center custom-scrollbar">
                        <div className="w-full max-w-xl">
                            {interactionState === 'IDLE' && progressiveCountdown === null && (
                                <div className="text-center py-16 space-y-4">
                                    <div className="w-16 h-16 bg-[#11141b] border border-[#1e222d] rounded-2xl flex items-center justify-center mx-auto text-[#4e5564]">
                                        <MessageSquare size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-white tracking-tight">Estación de Marcación Inactiva</h3>
                                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                            Haz clic en **Solicitar Marcación** en la barra superior para iniciar el marcador automático en la campaña.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Progressive Dialer Auto-countdown */}
                            {progressiveCountdown !== null && (
                                <div className="text-center py-16 space-y-6">
                                    <div className="relative w-20 h-20 mx-auto bg-purple-600/10 border-2 border-purple-500/20 rounded-full flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] animate-bounce">
                                        <span className="font-mono text-3xl font-black">{progressiveCountdown}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-white tracking-tight uppercase tracking-widest">
                                            Llamando Siguiente Lead
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Marcación automática en progreso. Por favor quédate listo con tus audífonos.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleReset}
                                            className="px-4 py-2 border border-[#1e222d] hover:bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                                        >
                                            Pausar Marcador
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(interactionState === 'DIALING' || interactionState === 'RINGING' || interactionState === 'ANSWERED') && (
                                <div className="text-center py-16 space-y-6">
                                    <div className="relative w-16 h-16 mx-auto">
                                        <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-2 bg-[#0c1017] rounded-full flex items-center justify-center text-blue-400">
                                            <Phone size={20} className="animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-white tracking-tight uppercase tracking-widest">
                                            {interactionState === 'DIALING' ? 'Marcando...' : interactionState === 'RINGING' ? 'Timbrando...' : 'Conectando audio...'}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Conexión WebRTC de baja latencia con el lead activo.
                                        </p>
                                    </div>
                                    {interactionState === 'RINGING' && (
                                        <div className="pt-4 flex items-center justify-center space-x-4">
                                            <button
                                                onClick={() => {
                                                    setInteractionState('ANSWERED');
                                                    addLog('Llamada contestada por el cliente.');
                                                    setTimeout(() => {
                                                        setInteractionState('SURVEY');
                                                        addLog('Script de encuesta dinámico activo en pantalla.');
                                                    }, 500);
                                                }}
                                                className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95"
                                            >
                                                <Phone size={14} />
                                                <span>Contestó</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    addLog('El cliente no contestó la llamada.');
                                                    handleReset();
                                                }}
                                                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95"
                                            >
                                                <VolumeX size={14} />
                                                <span>No Contestó</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {interactionState === 'SURVEY' && (
                                isExternalSurvey ? (
                                    <div className="bg-[#0d1017]/80 border border-[#1e222d] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-[500px] w-full max-w-4xl backdrop-blur-md animate-in zoom-in-95 duration-200">
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                        <div className="flex justify-between items-center p-4 border-b border-[#1e222d]/60 bg-[#11141b]/50">
                                            <h3 className="text-sm font-bold text-white flex items-center space-x-2"><Activity size={16} className="text-blue-500" /><span>Encuesta Externa</span></h3>
                                            <div className="flex space-x-3">
                                                <a href={activeCampaign.externalSurveyUrl} target="_blank" rel="noopener noreferrer" className="bg-[#11141b] hover:bg-white/5 border border-[#1e222d] text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center">
                                                    Abrir en Pestaña
                                                </a>
                                                <button 
                                                    onClick={() => handleSubmitSurvey({ external_completed: true })}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all"
                                                >
                                                    Terminar Llamada
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full flex flex-col bg-[#11141b]">
                                            <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-2.5 flex items-center justify-center space-x-2 text-yellow-500/90 text-[11px] font-medium">
                                                <span>⚠️ ¿La encuesta muestra una pantalla gris o error?</span>
                                                <a href={activeCampaign.externalSurveyUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-yellow-400">
                                                    Haz clic aquí para abrirla manualmente
                                                </a>
                                            </div>
                                            <div className="flex-1 relative bg-white">
                                                {activeCampaign.externalSurveyUrl ? (
                                                    <iframe 
                                                        src={activeCampaign.externalSurveyUrl} 
                                                        className="absolute inset-0 w-full h-full border-0"
                                                        title="Encuesta Externa"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-slate-500 bg-[#11141b]">URL de encuesta no configurada.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    survey && currentStep && (
                                        <div className="bg-[#0d1017]/80 border border-[#1e222d] rounded-2xl shadow-2xl relative overflow-hidden p-6 sm:p-8 space-y-6 backdrop-blur-md animate-in zoom-in-95 duration-200">
                                            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                                            {/* Progress Step Header */}
                                            <div className="flex justify-between items-center text-[10px] font-bold text-[#4e5564] uppercase tracking-widest border-b border-[#1e222d]/60 pb-3">
                                                <span>Pregunta Activa</span>
                                                <span>ID: {currentStep.id}</span>
                                            </div>

                                            {/* Question */}
                                            <div className="space-y-2">
                                                <h3 className="text-base sm:text-lg font-bold text-white leading-tight tracking-tight">
                                                    {currentStep.question}
                                                </h3>
                                            </div>

                                            {/* Inputs Dynamic Compiler */}
                                            <div className="pt-2">
                                                {/* 1. Multiple Choice Options */}
                                                {currentStep.type === 'multiple_choice' && currentStep.options && (
                                                    <div className="space-y-3">
                                                        {currentStep.options.map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => handleAnswerSelection(opt.value, opt.next)}
                                                                className="w-full bg-[#11141b] border border-[#1e222d] hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-300 hover:text-white font-bold p-4 rounded-xl text-left transition-all flex justify-between items-center group active:scale-98"
                                                            >
                                                                <span>{opt.label}</span>
                                                                <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 2. NPS Scale (0-10) */}
                                                {currentStep.type === 'nps' && (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                                                            {Array.from({ length: 11 }, (_, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => handleAnswerSelection(i, currentStep.next ?? null)}
                                                                    className="w-10 h-10 bg-[#11141b] border border-[#1e222d] hover:border-blue-500 hover:bg-blue-500/10 text-white rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all active:scale-90 flex-shrink-0"
                                                                >
                                                                    {i}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                                                            <span>Extremadamente Improbable</span>
                                                            <span>Extremadamente Probable</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. Text Area Question */}
                                                {currentStep.type === 'text_area' && (
                                                    <div className="space-y-4">
                                                        <textarea
                                                            id="textarea-answer"
                                                            className="w-full h-28 bg-[#11141b] border border-[#1e222d] rounded-xl p-4 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium leading-relaxed custom-scrollbar"
                                                            placeholder="Escribe la respuesta del cliente aquí..."
                                                        ></textarea>
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => {
                                                                    const val = (document.getElementById('textarea-answer') as HTMLTextAreaElement)?.value || '';
                                                                    handleAnswerSelection(val, currentStep.next ?? null);
                                                                }}
                                                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
                                                            >
                                                                <span>Siguiente Pregunta</span>
                                                                <ArrowRight size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )
                            )}

                            {interactionState === 'FINISHED' && progressiveCountdown === null && (
                                <div className="bg-[#0d1017]/80 border border-green-500/20 rounded-2xl shadow-2xl relative overflow-hidden p-8 text-center space-y-6 backdrop-blur-md animate-in zoom-in-95 duration-200">
                                    <div className="absolute top-0 inset-x-0 h-[2px] bg-green-500"></div>
                                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mx-auto text-green-400">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-white tracking-tight">¡Interacción Completada!</h3>
                                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                            Las respuestas han sido guardadas y sincronizadas exitosamente en el servidor de Pitaya Ops.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleReset}
                                            className="px-5 py-2.5 bg-[#11141b] hover:bg-white/5 border border-[#1e222d] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                                        >
                                            Nueva Asignación
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Telemetry Real-time Console Logs */}
                    <div className="bg-[#0b0e14] border-t border-[#1e222d] p-4 h-36 flex flex-col min-h-0">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-[#4e5564] uppercase tracking-wider pb-2 border-b border-[#1e222d]/60">
                            <Activity size={10} className="text-blue-500" />
                            <span>Consola de Eventos en Tiempo Real (Telemetry)</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-2 font-mono text-[10px] space-y-1 custom-scrollbar text-[#525a6c]">
                            {logs.map((log, i) => (
                                <div key={i} className={i === 0 ? 'text-blue-400 font-semibold' : ''}>{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Configuration Modal */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#11141b] border border-[#1e222d] rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#1e222d] bg-[#0a0c10]">
                            <h3 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
                                <Smartphone className="text-blue-500" size={20} />
                                <span>Vincular Dispositivo</span>
                            </h3>
                            <button onClick={() => setIsQRModalOpen(false)} className="text-[#4e5564] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 text-sm">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-400">
                                <p className="font-semibold">Escanea este código con la aplicación Pitaya Ops Agent de tu celular para autoconfigurar tu sesión.</p>
                            </div>
                            
                            <div className="flex justify-center bg-white p-4 rounded-xl mx-auto w-max">
                                <QRCodeSVG 
                                    value={qrConfigJson} 
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-wider">URL del Servidor</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={serverUrl} className="flex-1 bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2 px-3 text-slate-300 font-mono text-xs focus:outline-none" />
                                        <button onClick={() => copyToClipboard(serverUrl)} className="p-2 bg-[#1e222d] hover:bg-[#2b303b] rounded-lg text-slate-400 hover:text-white transition-colors"><Copy size={14}/></button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-wider">ID de Campaña</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={selectedCampaignId} className="flex-1 bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2 px-3 text-slate-300 font-mono text-xs focus:outline-none" />
                                        <button onClick={() => copyToClipboard(selectedCampaignId)} className="p-2 bg-[#1e222d] hover:bg-[#2b303b] rounded-lg text-slate-400 hover:text-white transition-colors"><Copy size={14}/></button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#4e5564] uppercase tracking-wider">Token JWT de Operador</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="password" readOnly value={user?.token || localStorage.getItem('auth-storage')?.match(/"token":"(.*?)"/)?.[1] || ''} className="flex-1 bg-[#0a0c10] border border-[#1e222d] rounded-lg py-2 px-3 text-slate-300 font-mono text-xs focus:outline-none" />
                                        <button onClick={() => copyToClipboard(user?.token || localStorage.getItem('auth-storage')?.match(/"token":"(.*?)"/)?.[1] || '')} className="p-2 bg-[#1e222d] hover:bg-[#2b303b] rounded-lg text-slate-400 hover:text-white transition-colors"><Copy size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
