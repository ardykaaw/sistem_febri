import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { 
    Volume2, 
    VolumeX, 
    Maximize, 
    Sparkles, 
    Building2, 
    Users, 
    ShieldAlert, 
    HeartPulse,
    Activity,
    Stethoscope,
    Radio,
    Clock,
    CheckCircle2,
    ArrowRight,
    Sliders,
    Settings
} from 'lucide-react';
import AudioSettingsModal from '@/components/audio-settings-modal';
import { 
    getStoredAudioSettings, 
    announceQueueCall, 
    playChimeTone, 
    AudioSettings 
} from '@/lib/queue-audio';

interface QueueItem {
    id: number;
    ticket_number: string;
    qr_code: string;
    patient_name: string;
    service: string;
    doctor: string;
    room: string;
    priority: string;
    status: string;
    call_count?: number;
    called_at?: string | null;
    checked_in_at: string | null;
}

export default function TvDisplay() {
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [activeQueue, setActiveQueue] = useState<QueueItem[]>([]);
    const [currentlyCalling, setCurrentlyCalling] = useState<QueueItem[]>([]);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [lastCallKey, setLastCallKey] = useState<string>('');
    const [showAudioModal, setShowAudioModal] = useState(false);
    const [audioSettings, setAudioSettings] = useState<AudioSettings>(getStoredAudioSettings());

    // Update Jam & Tanggal Realtime
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setCurrentDate(
                now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Polling antrean dari backend
    useEffect(() => {
        const fetchLiveQueue = async () => {
            try {
                const res = await fetch('/api/queue/live');
                const data = await res.json();
                if (data.success) {
                    setActiveQueue(data.active_queue || []);
                    setCurrentlyCalling(data.currently_calling || []);

                    // Jika ada panggilan baru ATAU panggil ulang dan audio aktif, umumkan suara!
                    if (data.currently_calling && data.currently_calling.length > 0) {
                        const newest = data.currently_calling[0];
                        // callKey menggabungkan id, call_count, dan called_at sehingga panggil ulang pasti memicu suara!
                        const callKey = `${newest.id}-${newest.call_count || 1}-${newest.called_at || ''}`;
                        if (audioEnabled && callKey !== lastCallKey) {
                            setLastCallKey(callKey);
                            announceQueueCall(newest.ticket_number, newest.patient_name, newest.room, audioSettings);
                        }
                    }
                }
            } catch {
                // Ignore network error in background polling
            }
        };

        fetchLiveQueue();
        const poll = setInterval(fetchLiveQueue, 2000);
        return () => clearInterval(poll);
    }, [audioEnabled, lastCallKey, audioSettings]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const topCalling = currentlyCalling[0] || null;

    const activeDoctor = {
        name: 'Ruang Periksa Gigi',
        doctor: 'drg. Febri, Sp.KG',
        specialty: 'Spesialis Konservasi & Estetika Gigi',
        active: topCalling,
    };

    const waitingPatients = activeQueue.filter((q) => q.status === 'menunggu');
    const nextPatient = waitingPatients[0] || null;

    const getPriorityBadgeStyle = (priority: string) => {
        switch (priority) {
            case 'Darurat':
                return { bg: 'rgba(239, 68, 68, 0.25)', text: '#FCA5A5', border: 'rgba(239, 68, 68, 0.5)' };
            case 'Lansia':
                return { bg: 'rgba(245, 158, 11, 0.25)', text: '#FCD34D', border: 'rgba(245, 158, 11, 0.5)' };
            case 'Anak':
                return { bg: 'rgba(14, 165, 233, 0.25)', text: '#7DD3FC', border: 'rgba(14, 165, 233, 0.5)' };
            default:
                return { bg: 'rgba(12, 124, 112, 0.35)', text: '#5EEAD4', border: 'rgba(94, 234, 212, 0.4)' };
        }
    };

    return (
        <>
            <Head title="Display Monitor Antrean Ruang Tunggu - Klinik Gigi Wansha" />

            <div 
                className="min-h-screen text-white flex flex-col justify-between overflow-hidden select-none"
                style={{ 
                    background: 'radial-gradient(ellipse at 30% 20%, #0F3832 0%, #081B18 60%, #041210 100%)',
                    fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif"
                }}
            >
                {/* ========================================================= */}
                {/* 1. BROADCAST TOP HEADER BAR                               */}
                {/* ========================================================= */}
                <header 
                    className="px-8 py-4 flex items-center justify-between"
                    style={{
                        background: 'rgba(11, 33, 29, 0.85)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(46, 175, 155, 0.25)'
                    }}
                >
                    {/* Brand Identity */}
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                            style={{
                                width: 52,
                                height: 52,
                                background: 'linear-gradient(135deg, #0C7C70 0%, #07524A 100%)',
                                boxShadow: '0 8px 24px -2px rgba(12, 124, 112, 0.6)',
                                border: '1.5px solid rgba(94, 234, 212, 0.4)',
                                borderRadius: 16
                            }}
                        >
                            <svg viewBox="0 0 32 32" style={{ width: 30, height: 30, fill: 'white' }} aria-hidden="true">
                                <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="font-black text-2xl tracking-tight text-white leading-none m-0">
                                    KLINIK GIGI WANSHA
                                </h1>
                                <span 
                                    className="px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#34D399',
                                        border: '1px solid rgba(52, 211, 153, 0.35)',
                                        borderRadius: 9999
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                                    <span>Layar Monitor Real-Time</span>
                                </span>
                            </div>
                            <span className="block text-xs font-semibold text-[#8FD5CB] tracking-wide mt-1.5">
                                Layanan Antrean Pasien Terintegrasi FIFO &amp; Medical Priority
                            </span>
                        </div>
                    </div>

                    {/* Clock & Action Controls */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div 
                                className="text-3xl font-black font-mono tracking-wider text-[#34D399] leading-none"
                                style={{ textShadow: '0 0 25px rgba(52, 211, 153, 0.45)' }}
                            >
                                {currentTime || '08:00:00'}
                            </div>
                            <div className="text-xs text-[#A3CFC8] font-medium mt-1.5">
                                {currentDate}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 pl-6" style={{ borderLeft: '1px solid rgba(46, 175, 155, 0.3)' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setAudioEnabled(!audioEnabled);
                                    if (!audioEnabled) {
                                        playChimeTone(audioSettings.chimeStyle);
                                    }
                                }}
                                className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                                style={{
                                    background: audioEnabled ? 'linear-gradient(135deg, #0C7C70 0%, #07524A 100%)' : 'rgba(255, 255, 255, 0.08)',
                                    color: audioEnabled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                                    border: audioEnabled ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.15)',
                                    boxShadow: audioEnabled ? '0 0 20px rgba(52, 211, 153, 0.35)' : 'none',
                                    borderRadius: 12
                                }}
                                title={audioEnabled ? 'Audio Panggilan Aktif' : 'Klik untuk mengaktifkan suara panggilan'}
                            >
                                {audioEnabled ? (
                                    <>
                                        <Volume2 className="w-4 h-4 text-[#34D399] animate-pulse" />
                                        <span>Suara Panggilan Aktif</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX className="w-4 h-4" />
                                        <span>Aktifkan Suara</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowAudioModal(true)}
                                className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-white hover:bg-white/10"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 12
                                }}
                                title="Pilih jenis suara ucapan, nada bel (ding-dong/tri-tone), dan kecepatan"
                            >
                                <Settings className="w-4 h-4 text-[#F5B755]" />
                                <span>Pilih Suara &amp; Bel</span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="p-2.5 rounded-xl transition-all cursor-pointer text-white/80 hover:text-white"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: 12
                                }}
                                title="Mode Layar Penuh"
                            >
                                <Maximize className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* 2. MAIN TV CONTENT GRID (SPLIT 2 COLUMNS: 60% / 40%)      */}
                {/* ========================================================= */}
                <main 
                    className="flex-1 p-8"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
                        gap: '28px',
                        alignItems: 'stretch'
                    }}
                >
                    {/* KOLOM KIRI: PANGGILAN UTAMA / SHOWCASE AKTIF */}
                    <div 
                        className="flex flex-col justify-between p-8 relative overflow-hidden"
                        style={{
                            background: 'rgba(14, 40, 36, 0.8)',
                            backdropFilter: 'blur(30px)',
                            border: '1.5px solid rgba(52, 211, 153, 0.35)',
                            borderRadius: '28px',
                            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Ambient Aura Background */}
                        <div 
                            className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle, rgba(12, 124, 112, 0.4) 0%, transparent 70%)',
                                filter: 'blur(50px)'
                            }}
                        />

                        {/* Top Header of Main Card */}
                        <div className="relative z-10">
                            <div 
                                className="flex items-center justify-between pb-5"
                                style={{ borderBottom: '1px solid rgba(46, 175, 155, 0.25)' }}
                            >
                                <div 
                                    className="inline-flex items-center gap-2.5 px-4 py-2"
                                    style={{
                                        background: topCalling ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                                        border: topCalling ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.18)',
                                        borderRadius: 9999
                                    }}
                                >
                                    <span 
                                        className={`w-3 h-3 rounded-full ${topCalling ? 'bg-[#34D399] animate-ping' : 'bg-white/40'}`} 
                                    />
                                    <span 
                                        className="text-xs font-black tracking-widest uppercase"
                                        style={{ color: topCalling ? '#34D399' : 'rgba(255, 255, 255, 0.8)' }}
                                    >
                                        {topCalling ? 'SEDANG DIPANGGIL SAAT INI' : 'RUANG PERIKSA DOKTER'}
                                    </span>
                                </div>

                                {/* Animated Soundwave Bars when active */}
                                {topCalling ? (
                                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                                        <div className="w-1 h-3.5 bg-[#34D399] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-5 bg-[#34D399] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1 h-3 bg-[#34D399] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        <div className="w-1 h-4 bg-[#34D399] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                                        <span className="text-[11px] font-bold text-[#34D399] ms-1">PANGGILAN AKTIF</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8FD5CB]">
                                        <Radio className="w-4 h-4 text-[#34D399]" />
                                        <span>3 Ruangan Siap Melayani</span>
                                    </div>
                                )}
                            </div>

                            {/* Ticket Center Showcase */}
                            {topCalling ? (
                                <div className="text-center py-8 space-y-4">
                                    <span className="text-sm font-bold text-[#A3CFC8] tracking-widest uppercase block">
                                        NOMOR TIKET ANTREAN
                                    </span>
                                    <div 
                                        className="font-black font-mono text-[#34D399] tracking-tight leading-none my-3"
                                        style={{ fontSize: '7.5rem', textShadow: '0 0 50px rgba(52, 211, 153, 0.5)' }}
                                    >
                                        {topCalling.ticket_number}
                                    </div>
                                    <div className="text-4xl font-black text-white tracking-tight">
                                        {topCalling.patient_name}
                                    </div>
                                    <div className="pt-2 flex items-center justify-center gap-3">
                                        {(() => {
                                            const pStyle = getPriorityBadgeStyle(topCalling.priority);
                                            return (
                                                <span 
                                                    className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                                                    style={{
                                                        background: pStyle.bg,
                                                        color: pStyle.text,
                                                        border: `1px solid ${pStyle.border}`
                                                    }}
                                                >
                                                    Prioritas: {topCalling.priority}
                                                </span>
                                            );
                                        })()}
                                        <span className="text-sm font-medium text-[#A3CFC8]">
                                            • {topCalling.service}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                /* Rich, Balanced Standby Mode Showcase */
                                <div className="text-center py-10 space-y-5">
                                    <div 
                                        className="mx-auto rounded-3xl flex items-center justify-center text-white"
                                        style={{
                                            width: 88,
                                            height: 88,
                                            background: 'linear-gradient(135deg, rgba(12, 124, 112, 0.3) 0%, rgba(7, 82, 74, 0.5) 100%)',
                                            border: '1.5px solid rgba(52, 211, 153, 0.35)',
                                            boxShadow: '0 0 35px rgba(52, 211, 153, 0.25)',
                                            borderRadius: 24
                                        }}
                                    >
                                        <Stethoscope className="w-12 h-12 text-[#5EEAD4]" />
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-black text-white m-0 tracking-tight">
                                            Ruang Periksa Siap Melayani
                                        </h2>
                                        <p className="text-sm text-[#8FD5CB] mt-2 max-w-md mx-auto leading-relaxed">
                                            Silakan duduk santai di ruang tunggu. Nomor antrean pasien berikutnya akan segera dipanggil melalui sistem audio &amp; layar ini.
                                        </p>
                                    </div>

                                    {/* Preview Pasien Berikutnya (Jika ada) */}
                                    {nextPatient ? (
                                        <div 
                                            className="p-4 mx-auto max-w-md rounded-2xl flex items-center justify-between"
                                            style={{
                                                background: 'rgba(52, 211, 153, 0.08)',
                                                border: '1px solid rgba(52, 211, 153, 0.25)',
                                                borderRadius: 16
                                            }}
                                        >
                                            <div className="text-left">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#34D399] block">
                                                    PASIEN BERIKUTNYA YANG AKAN DIPANGGIL:
                                                </span>
                                                <div className="font-bold text-white text-base mt-0.5">
                                                    {nextPatient.patient_name}
                                                </div>
                                                <div className="text-xs text-[#A3CFC8]">
                                                    Menuju {nextPatient.room}
                                                </div>
                                            </div>
                                            <div 
                                                className="px-3.5 py-1.5 rounded-xl font-mono font-black text-base text-[#34D399]"
                                                style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.35)' }}
                                            >
                                                {nextPatient.ticket_number}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-[#8FD5CB] italic pt-2">
                                            Semua pasien reservasi yang telah check-in telah dipanggil.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Room Destination Box */}
                        <div 
                            className="p-6 flex items-center justify-between relative z-10"
                            style={{
                                background: topCalling 
                                    ? 'linear-gradient(135deg, #0C7C70 0%, #064E46 100%)' 
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: topCalling 
                                    ? '1.5px solid rgba(52, 211, 153, 0.5)' 
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 20,
                                boxShadow: topCalling 
                                    ? '0 12px 30px -4px rgba(12, 124, 112, 0.6)' 
                                    : 'none'
                            }}
                        >
                            <div>
                                <span 
                                    className="text-xs uppercase tracking-widest font-black block"
                                    style={{ color: topCalling ? '#A7F3D0' : '#8FD5CB' }}
                                >
                                    {topCalling ? 'SILAKAN MENUJU KE RUANGAN:' : 'PETUNJUK RUANG TUNGGU:'}
                                </span>
                                <div className="text-3xl font-black text-white mt-1">
                                    {topCalling ? topCalling.room : 'Silakan Menunggu di Ruang Tunggu Pasien'}
                                </div>
                                <div 
                                    className="text-sm font-semibold mt-1"
                                    style={{ color: topCalling ? '#D1FAE5' : '#8FD5CB' }}
                                >
                                    {topCalling ? `${topCalling.doctor}` : 'Pasien akan dipanggil sesuai nomor tiket dan urutan prioritas.'}
                                </div>
                            </div>
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(255, 255, 255, 0.18)', borderRadius: 16 }}
                            >
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: STATUS 3 RUANG DOKTER & ANTREAN BERIKUTNYA */}
                    <div 
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            justifyContent: 'space-between'
                        }}
                    >
                        {/* 1. STATUS PRAKTIK DOKTER TUNGGAL (RUANG PERIKSA GIGI) */}
                        <div 
                            className="p-5"
                            style={{
                                background: 'rgba(14, 40, 36, 0.85)',
                                backdropFilter: 'blur(30px)',
                                border: '1.5px solid rgba(46, 175, 155, 0.35)',
                                borderRadius: '24px',
                                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(46, 175, 155, 0.25)' }}>
                                <span className="text-xs font-black tracking-wider text-[#5EEAD4] uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#34D399]" />
                                    <span>Dokter Praktik Bertugas</span>
                                </span>
                                <span className="badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', borderRadius: 8 }}>
                                    Ruang Periksa Gigi
                                </span>
                            </div>

                            <div className="mt-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div 
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm"
                                        style={{ background: 'linear-gradient(135deg, #0C7C70, #08554D)', border: '1px solid rgba(255,255,255,0.2)' }}
                                    >
                                        DF
                                    </div>
                                    <div>
                                        <div className="font-black text-lg text-white flex items-center gap-2">
                                            <span>drg. Febri, Sp.KG</span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
                                        </div>
                                        <div className="text-xs text-[#5EEAD4] font-medium">
                                            Spesialis Konservasi &amp; Estetika Gigi
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {activeDoctor.active ? (
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase font-bold text-[#8FD5CB] tracking-wider mb-0.5">Sedang Memeriksa</div>
                                            <div 
                                                className="px-3.5 py-1 rounded-xl font-mono font-black text-base inline-flex items-center gap-1.5"
                                                style={{
                                                    background: 'rgba(52, 211, 153, 0.18)',
                                                    color: '#34D399',
                                                    border: '1px solid rgba(52, 211, 153, 0.45)',
                                                    borderRadius: 10
                                                }}
                                            >
                                                {activeDoctor.active.ticket_number}
                                            </div>
                                        </div>
                                    ) : (
                                        <span 
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide"
                                            style={{ 
                                                background: 'rgba(255, 255, 255, 0.08)', 
                                                color: 'rgba(255, 255, 255, 0.65)',
                                                borderRadius: 8
                                            }}
                                        >
                                            Standby
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. DAFTAR ANTREAN BERIKUTNYA */}
                        <div 
                            className="flex-1 p-6 flex flex-col justify-between"
                            style={{
                                background: 'rgba(14, 40, 36, 0.8)',
                                backdropFilter: 'blur(30px)',
                                border: '1.5px solid rgba(46, 175, 155, 0.3)',
                                borderRadius: '28px',
                                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            <div>
                                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(46, 175, 155, 0.25)' }}>
                                    <span className="text-xs font-black tracking-wider text-[#5EEAD4] uppercase flex items-center gap-2">
                                        <Users className="w-4 h-4 text-[#34D399]" />
                                        <span>Antrean Menunggu Berikutnya</span>
                                    </span>
                                    <span 
                                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                        style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', borderRadius: 9999 }}
                                    >
                                        {waitingPatients.length} Menunggu
                                    </span>
                                </div>

                                <div className="divide-y divide-[#1A403C] mt-2">
                                    {waitingPatients.slice(0, 4).map((item, index) => {
                                        const pStyle = getPriorityBadgeStyle(item.priority);
                                        return (
                                            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-3">
                                                    <span 
                                                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                                                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderRadius: 9999 }}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-mono font-black text-lg text-[#34D399]">
                                                        {item.ticket_number}
                                                    </span>
                                                    <span className="font-bold text-white max-w-[140px] truncate text-sm">
                                                        {item.patient_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        className="px-2.5 py-0.5 text-[10px] font-bold"
                                                        style={{ 
                                                            background: pStyle.bg, 
                                                            color: pStyle.text, 
                                                            border: `1px solid ${pStyle.border}`,
                                                            borderRadius: 9999
                                                        }}
                                                    >
                                                        {item.priority}
                                                    </span>
                                                    <span className="text-xs text-[#A3CFC8] font-medium">
                                                        {item.room}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {waitingPatients.length === 0 && (
                                        <div className="py-10 text-center text-xs text-white/40 italic">
                                            Tidak ada antrean yang sedang menunggu saat ini
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div 
                                className="pt-3 text-center text-xs text-[#8FD5CB] font-medium"
                                style={{ borderTop: '1px solid rgba(46, 175, 155, 0.25)' }}
                            >
                                Pasien baru wajib melakukan scan QR Code reservasi di meja resepsionis untuk aktivasi antrean.
                            </div>
                        </div>
                    </div>
                </main>

                {/* ========================================================= */}
                {/* 3. RUNNING TEXT TICKER (FOOTER)                           */}
                {/* ========================================================= */}
                <footer 
                    className="py-3 px-8 flex items-center justify-between text-xs font-semibold overflow-hidden shadow-inner"
                    style={{
                        background: 'linear-gradient(90deg, #0C7C70 0%, #07524A 100%)',
                        color: '#FFFFFF',
                        borderTop: '1px solid rgba(94, 234, 212, 0.3)'
                    }}
                >
                    <div className="flex items-center gap-2.5 shrink-0 pr-5" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.25)' }}>
                        <Sparkles className="w-4 h-4 text-[#F5B755] animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="font-black tracking-wider uppercase text-[11px]">INFORMASI KLINIK:</span>
                    </div>

                    <div className="flex-1 px-4 overflow-hidden whitespace-nowrap">
                        <div className="inline-block animate-marquee font-medium text-sm">
                            ✨ Selamat datang di Klinik Gigi Wansha · Jam Pelayanan: Setiap Hari 08.00 - 20.00 WIB · Mohon tunjukkan QR Code reservasi kepada petugas resepsionis saat tiba untuk aktivasi nomor antrean · Pasien gawat darurat dan lansia diprioritaskan melalui sistem cerdas Priority Scheduling · Tetap jaga kebersihan dan kenyamanan ruang tunggu bersama Wanshy.
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modal Pengaturan & Pemilihan Suara */}
            <AudioSettingsModal
                isOpen={showAudioModal}
                onClose={() => setShowAudioModal(false)}
                onSaved={(newSettings) => setAudioSettings(newSettings)}
            />
        </>
    );
}
