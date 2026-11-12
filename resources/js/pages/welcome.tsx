import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useState, useEffect } from 'react';
import ChatbotWidget from '@/components/chatbot-widget';
import { 
    Clock, 
    Users, 
    Calendar, 
    ShieldCheck, 
    Sparkles, 
    Phone, 
    MapPin, 
    ArrowRight, 
    CheckCircle2, 
    Search, 
    HeartPulse, 
    AlertCircle,
    X,
    UserCheck,
    QrCode,
    Menu,
    Check,
    Building2,
    RefreshCw,
    Activity,
    PhoneCall,
    User,
    Ticket
} from 'lucide-react';

interface QueueItem {
    id: number;
    ticket_number: string;
    qr_code: string;
    patient_name: string;
    patient_phone: string;
    service: string;
    doctor: string;
    room: string;
    priority: string;
    status: string;
    checked_in_at: string | null;
}

// Maskot Resmi Gigi Wanshy
function WanshaMascot({ className = "w-36 h-32" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 180 150"
            role="img"
            aria-label="Maskot Resmi Gigi Wanshy Klinik Wansha"
        >
            <ellipse cx="92" cy="138" rx="54" ry="7" fill="rgba(18,78,74,.14)" />
            <path
                d="M47 20c12-9 24 3 43 3s31-12 43-3c21 15 3 48-3 69-8 28-13 43-25 42-10-1-7-29-15-29s-5 28-15 29c-12 1-17-14-25-42-6-21-24-54-3-69Z"
                fill="#FFFFFF"
                stroke="#173F3C"
                strokeWidth="3.2"
            />
            <path
                d="M55 33c9-8 19 0 30 1"
                fill="none"
                stroke="#C5EFE7"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <circle cx="72" cy="62" r="4.2" fill="#173F3C" />
            <circle cx="108" cy="62" r="4.2" fill="#173F3C" />
            <path
                d="M75 78c8 10 21 10 29 0"
                fill="none"
                stroke="#173F3C"
                strokeWidth="3.2"
                strokeLinecap="round"
            />
            <path
                d="M50 82c-14 3-18 12-22 21M130 82c14 3 18 12 22 21"
                fill="none"
                stroke="#173F3C"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="m144 36 4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z"
                fill="#F5B755"
                stroke="#173F3C"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            <circle cx="62" cy="73" r="5.5" fill="#FFAAA6" opacity=".9" />
            <circle cx="118" cy="73" r="5.5" fill="#FFAAA6" opacity=".9" />
        </svg>
    );
}

export default function Welcome() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;

    const [liveQueue, setLiveQueue] = useState<QueueItem[]>([]);
    const [currentlyCalling, setCurrentlyCalling] = useState<QueueItem[]>([]);
    const [searchCode, setSearchCode] = useState('');
    const [searchResult, setSearchResult] = useState<QueueItem | null | 'not_found'>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Reservation State
    const [service, setService] = useState('Scaling karang gigi');
    const [doctor, setDoctor] = useState('drg. Febri, Sp.KG');
    const [priority, setPriority] = useState('Reguler');
    const [patientName, setPatientName] = useState(currentUser?.name || '');
    const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
    const [notes, setNotes] = useState('');
    const [submittingBooking, setSubmittingBooking] = useState(false);
    const [bookingSuccessTicket, setBookingSuccessTicket] = useState<QueueItem | null>(null);

    // Fetch real-time queue from API
    const fetchLiveQueue = async () => {
        try {
            const res = await fetch('/api/queue/live');
            const data = await res.json();
            if (data.success) {
                setLiveQueue(data.active_queue || []);
                setCurrentlyCalling(data.currently_calling || []);
            }
        } catch (err) {
            console.error('Error fetching live queue:', err);
        }
    };

    useEffect(() => {
        fetchLiveQueue();
        const interval = setInterval(fetchLiveQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSearchQueue = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = searchCode.trim().toUpperCase();
        if (!clean) return;

        const found = liveQueue.find(
            (q) => q.ticket_number.toUpperCase() === clean || 
                   q.patient_name.toUpperCase().includes(clean) ||
                   (q.qr_code && q.qr_code.toUpperCase().includes(clean))
        );
        setSearchResult(found || 'not_found');
    };

    const handleOpenBooking = (preferredService?: string) => {
        if (!currentUser) {
            window.location.href = '/register';
            return;
        }
        if (preferredService) setService(preferredService);
        setDoctor('drg. Febri, Sp.KG');
        setPatientName(currentUser.name);
        setPatientPhone(currentUser.phone || '0812-3456-7890');
        setBookingSuccessTicket(null);
        setShowBookingModal(true);
    };

    const handleReservationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientName.trim()) return;
        setSubmittingBooking(true);

        try {
            const res = await fetch('/api/queue/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patientName,
                    patient_phone: patientPhone || '0812-3456-7890',
                    service,
                    doctor,
                    priority,
                    notes,
                }),
            });
            const data = await res.json();
            if (data.success && data.ticket) {
                setBookingSuccessTicket(data.ticket);
                fetchLiveQueue();
            } else {
                alert(data.message || 'Gagal mendaftar antrean.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmittingBooking(false);
        }
    };

    const currentServingItem = currentlyCalling.length > 0 
        ? currentlyCalling[0] 
        : (liveQueue.length > 0 ? liveQueue[0] : null);

    return (
        <div style={{ backgroundColor: '#F8FAF9', color: '#173F3C', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <Head title="Klinik Gigi Wansha - Perawatan Gigi & Sistem Antrean Cerdas" />

            {/* Top Navigation Bar */}
            <header className="sticky-top bg-white border-bottom shadow-xs" style={{ zIndex: 1020 }}>
                <div className="container-xl py-2 d-flex align-items-center justify-content-between">
                    {/* Brand */}
                    <a href="#" className="d-flex align-items-center text-decoration-none gap-2">
                        <div 
                            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                            style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                        >
                            <svg viewBox="0 0 32 32" style={{ width: 24, height: 24, fill: '#FFFFFF' }} aria-hidden="true">
                                <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                            </svg>
                        </div>
                        <div>
                            <span className="d-block fw-black fs-3 lh-1" style={{ color: '#173F3C' }}>Klinik Wansha</span>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5 text-secondary small" style={{ fontSize: '11px' }}>
                                <span className="status-dot status-dot-animated bg-green"></span>
                                <span>Buka 08.00 - 20.00 WIB</span>
                            </div>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="d-none d-lg-flex align-items-center gap-1">
                        <a href="#antrean" className="btn btn-ghost-secondary btn-sm px-3 fw-bold">Cek Antrean</a>
                        <a href="#layanan" className="btn btn-ghost-secondary btn-sm px-3 fw-bold">Layanan Gigi</a>
                        <a href="#maskot" className="btn btn-ghost-secondary btn-sm px-3 fw-bold">Maskot Wanshy</a>
                        <a href="#dokter" className="btn btn-ghost-secondary btn-sm px-3 fw-bold">Jadwal Dokter</a>
                        <a href="#kontak" className="btn btn-ghost-secondary btn-sm px-3 fw-bold">Kontak &amp; Lokasi</a>
                    </nav>

                    {/* Auth & Quick Action Buttons */}
                    <div className="d-flex align-items-center gap-2.5">
                        {currentUser ? (
                            <Link 
                                href={dashboard()} 
                                className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 text-white fw-bold shadow-sm text-decoration-none"
                                style={{
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                }}
                            >
                                <User style={{ width: 15, height: 15 }} />
                                <span>Dashboard ({currentUser.name.split(' ')[0]})</span>
                                <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    href={login()} 
                                    className="btn btn-ghost-dark fw-bold d-none d-sm-inline-flex align-items-center gap-1.5 px-3 py-2 text-decoration-none"
                                    style={{
                                        color: '#112926',
                                        fontSize: '14px',
                                        borderRadius: '10px',
                                        border: '1px solid transparent',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(12, 124, 112, 0.08)';
                                        e.currentTarget.style.color = '#0C7C70';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#112926';
                                    }}
                                >
                                    <User style={{ width: 16, height: 16, color: '#0C7C70' }} />
                                    <span>Masuk</span>
                                </Link>
                                <Link 
                                    href={register()} 
                                    className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2 text-white fw-bold shadow-sm text-decoration-none"
                                    style={{
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 10px rgba(12, 124, 112, 0.3)',
                                    }}
                                >
                                    <Ticket style={{ width: 16, height: 16 }} />
                                    <span>Daftar &amp; Ambil Antrean</span>
                                    <ArrowRight style={{ width: 14, height: 14 }} />
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="btn btn-icon btn-ghost-secondary d-lg-none" 
                            style={{ borderRadius: '10px' }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation"
                        >
                            {mobileMenuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Menu */}
                {mobileMenuOpen && (
                    <div className="d-lg-none bg-white border-top p-3 shadow-lg">
                        <div className="d-flex flex-column gap-2">
                            <a href="#antrean" onClick={() => setMobileMenuOpen(false)} className="nav-link py-2 px-3 fw-bold text-dark rounded-2">Status Antrean Live</a>
                            <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="nav-link py-2 px-3 fw-bold text-dark rounded-2">Layanan Gigi Lengkap</a>
                            <a href="#maskot" onClick={() => setMobileMenuOpen(false)} className="nav-link py-2 px-3 fw-bold text-dark rounded-2">Maskot Gigi Wanshy</a>
                            <a href="#dokter" onClick={() => setMobileMenuOpen(false)} className="nav-link py-2 px-3 fw-bold text-dark rounded-2">Jadwal Dokter Spesialis</a>
                            <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="nav-link py-2 px-3 fw-bold text-dark rounded-2">Kontak &amp; Lokasi</a>
                            <hr className="my-2" />
                            {currentUser ? (
                                <Link href={dashboard()} className="btn btn-primary w-100 py-2.5 fw-bold" style={{ borderRadius: '10px' }}>Buka Dashboard</Link>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={login()} 
                                        className="btn btn-outline-secondary w-50 py-2 fw-bold text-center text-decoration-none"
                                        style={{ borderRadius: '10px' }}
                                    >
                                        Masuk
                                    </Link>
                                    <Link 
                                        href={register()} 
                                        onClick={() => setMobileMenuOpen(false)} 
                                        className="btn btn-primary w-50 py-2 fw-bold text-white shadow-sm text-center text-decoration-none"
                                        style={{ borderRadius: '10px' }}
                                    >
                                        Daftar Antrean
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="py-5" style={{ background: 'linear-gradient(180deg, #F0F7F4 0%, #F8FAF9 100%)' }}>
                <div className="container-xl py-3">
                    <div className="row g-4 align-items-center">
                        {/* Left Column: Headline */}
                        <div className="col-lg-7">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-white border shadow-xs mb-3">
                                <Sparkles className="icon text-warning" />
                                <span className="small fw-bold text-teal">PRAKTIK DOKTER GIGI SPESIALIS &amp; SISTEM ANTREAN CERDAS</span>
                            </div>

                            <h1 className="display-4 fw-black tracking-tight mb-3 lh-1" style={{ color: '#173F3C' }}>
                                Senyum Sehat Bersama <span style={{ color: '#0C7C70' }}>Klinik Wansha</span>.
                            </h1>

                            <p className="lead text-secondary mb-4" style={{ maxWidth: '36rem' }}>
                                Rawat kesehatan gigi keluarga Anda bersama <strong>drg. Febri, Sp.KG</strong>. Ambil nomor antrean digital secara online dan pantau giliran Anda secara <strong>real-time</strong> tanpa perlu menunggu lama di ruang tunggu.
                            </p>

                            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                                {currentUser ? (
                                    <Link
                                        href={dashboard()}
                                        className="btn btn-primary d-inline-flex align-items-center gap-2.5 px-4 py-3 fw-bold text-white shadow text-decoration-none"
                                        style={{
                                            borderRadius: '12px',
                                            fontSize: '15px',
                                            boxShadow: '0 8px 22px -4px rgba(12, 124, 112, 0.4)',
                                        }}
                                    >
                                        <Ticket style={{ width: 18, height: 18 }} />
                                        <span>Buka Tiket &amp; Ambil Antrean</span>
                                        <ArrowRight style={{ width: 16, height: 16 }} />
                                    </Link>
                                ) : (
                                    <Link
                                        href={register()}
                                        className="btn btn-primary d-inline-flex align-items-center gap-2.5 px-4 py-3 fw-bold text-white shadow text-decoration-none"
                                        style={{
                                            borderRadius: '12px',
                                            fontSize: '15px',
                                            boxShadow: '0 8px 22px -4px rgba(12, 124, 112, 0.4)',
                                        }}
                                    >
                                        <Ticket style={{ width: 18, height: 18 }} />
                                        <span>Daftar &amp; Ambil Antrean Online</span>
                                        <ArrowRight style={{ width: 16, height: 16 }} />
                                    </Link>
                                )}
                                <a
                                    href="#antrean"
                                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-3 fw-bold text-decoration-none shadow-xs"
                                    style={{
                                        backgroundColor: '#ffffff',
                                        color: '#173F3C',
                                        borderColor: '#CBD5E1',
                                        borderRadius: '12px',
                                        fontSize: '15px'
                                    }}
                                >
                                    <Search style={{ width: 17, height: 17, color: '#0C7C70' }} />
                                    <span>Cek Status Antrean</span>
                                </a>
                            </div>

                            {/* Trust Stats Counter */}
                            <div className="row g-3 pt-3 border-top" style={{ maxWidth: '34rem' }}>
                                <div className="col-4">
                                    <div className="h2 fw-black mb-0 text-dark">15 Menit</div>
                                    <div className="text-secondary small">Rata-rata Layanan</div>
                                </div>
                                <div className="col-4">
                                    <div className="h2 fw-black mb-0 text-dark">99.2%</div>
                                    <div className="text-secondary small">Kepuasan Pasien</div>
                                </div>
                                <div className="col-4">
                                    <div className="h2 fw-black mb-0 text-dark">1 Dokter</div>
                                    <div className="text-secondary small">drg. Febri, Sp.KG</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Monitor Preview Card */}
                        <div className="col-lg-5">
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="status-dot status-dot-animated bg-green"></span>
                                        <span className="fw-bold small text-uppercase" style={{ color: '#0C7C70' }}>
                                            Monitor Antrean Realtime
                                        </span>
                                    </div>
                                    <span className="badge bg-secondary-lt font-monospace small">
                                        Ruang Periksa Gigi
                                    </span>
                                </div>

                                <div className="card-body p-4">
                                    {/* Spotlight: Current Serving Ticket */}
                                    <div 
                                        className="p-4 rounded-3 text-white mb-3 shadow-sm position-relative overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <span className="small fw-bold text-uppercase" style={{ color: '#A4E5D7' }}>
                                                    SEDANG DIPERIKSA DOKTER
                                                </span>
                                                <div className="display-4 fw-black font-monospace mt-1" style={{ color: '#F5B755' }}>
                                                    {currentServingItem ? currentServingItem.ticket_number : 'A01'}
                                                </div>
                                                <div className="fw-bold fs-4 text-white mt-1">
                                                    {currentServingItem ? currentServingItem.service : 'Pemeriksaan Gigi Rutin'}
                                                </div>
                                                <div className="small text-white-50 mt-0.5">
                                                    {currentServingItem ? `${currentServingItem.doctor} • ${currentServingItem.room}` : 'drg. Febri, Sp.KG • Ruang Periksa Gigi'}
                                                </div>
                                            </div>
                                            <span className="badge bg-white text-dark fw-bold px-2.5 py-1">
                                                {currentServingItem ? currentServingItem.priority : 'Reguler'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Next Queue List Preview */}
                                    <div className="mb-3">
                                        <div className="small fw-bold text-secondary text-uppercase mb-2">
                                            Pasien Menunggu Berikutnya:
                                        </div>
                                        <div className="d-flex flex-column gap-2">
                                            {liveQueue.slice(1, 4).length > 0 ? (
                                                liveQueue.slice(1, 4).map((item, idx) => (
                                                    <div 
                                                        key={item.id} 
                                                        className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light border"
                                                    >
                                                        <div className="d-flex align-items-center gap-2.5">
                                                            <div className="avatar avatar-sm bg-teal-lt text-teal fw-bold font-monospace">
                                                                {item.ticket_number}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold small text-dark">{item.patient_name}</div>
                                                                <div className="text-secondary small" style={{ fontSize: '11px' }}>{item.service}</div>
                                                            </div>
                                                        </div>
                                                        <span className="badge bg-secondary-lt fw-bold">
                                                            Urutan #{idx + 2}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-secondary small bg-light rounded-2 border">
                                                    Belum ada pasien lain dalam antrean aktif.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {currentUser ? (
                                        <Link
                                            href={dashboard()}
                                            className="btn btn-outline-primary w-100 py-2.5 fw-bold text-decoration-none text-center d-block"
                                        >
                                            + Ambil Nomor Antrean di Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            href={register()}
                                            className="btn btn-outline-primary w-100 py-2.5 fw-bold text-decoration-none text-center d-block"
                                        >
                                            + Daftar Akun Untuk Ambil Antrean
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step-by-Step Flow: Registrasi & Alur Antrean Pasien */}
            <section className="py-5 bg-white border-bottom">
                <div className="container-xl">
                    <div className="text-center mb-5" style={{ maxWidth: '38rem', margin: '0 auto' }}>
                        <span className="small fw-bold text-uppercase tracking-wider text-teal">ALUR PASIEN MUDAH &amp; NYAMAN</span>
                        <h2 className="display-6 fw-black mt-1 mb-2" style={{ color: '#173F3C' }}>
                            Cara Mengambil &amp; Menikmati Antrean Cerdas
                        </h2>
                        <p className="text-secondary small">
                            Hanya 3 langkah praktis dari rumah sampai diperiksa langsung oleh dokter gigi.
                        </p>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 border-0 p-4 rounded-4 shadow-sm" style={{ background: '#F8FAF9' }}>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-3 text-white fw-black fs-3"
                                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                                    >
                                        1
                                    </div>
                                    <span className="badge bg-teal-lt fw-bold">Langkah Awal</span>
                                </div>
                                <h3 className="fw-black text-dark fs-3 mb-2">Daftar Akun Pasien</h3>
                                <p className="text-secondary small mb-3">
                                    Lakukan registrasi akun baru hanya dalam 1 menit. Akun digunakan untuk menyimpan riwayat rekam medis dan tiket digital Anda.
                                </p>
                                <div className="mt-auto">
                                    {currentUser ? (
                                        <span className="badge bg-success-lt text-success fw-bold d-inline-flex align-items-center gap-1">
                                            <CheckCircle2 style={{ width: 14, height: 14 }} /> Anda sudah terdaftar
                                        </span>
                                    ) : (
                                        <Link href={register()} className="btn btn-sm btn-outline-primary fw-bold">
                                            Registrasi Sekarang &rarr;
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card h-100 border-0 p-4 rounded-4 shadow-sm" style={{ background: '#F8FAF9' }}>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-3 text-white fw-black fs-3"
                                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                                    >
                                        2
                                    </div>
                                    <span className="badge bg-teal-lt fw-bold">Reservasi Online</span>
                                </div>
                                <h3 className="fw-black text-dark fs-3 mb-2">Pilih Layanan &amp; Dapatkan QR</h3>
                                <p className="text-secondary small mb-3">
                                    Pilih jenis perawatan gigi dan kategori prioritas. Sistem otomatis menerbitkan <strong>Nomor Tiket Antrean</strong> dan <strong>QR Code Digital</strong>.
                                </p>
                                <div className="mt-auto">
                                    <span className="text-secondary small fw-semibold">
                                        Tiket langsung aktif di dashboard Anda
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card h-100 border-0 p-4 rounded-4 shadow-sm" style={{ background: '#F8FAF9' }}>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-3 text-white fw-black fs-3"
                                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                                    >
                                        3
                                    </div>
                                    <span className="badge bg-teal-lt fw-bold">Di Klinik</span>
                                </div>
                                <h3 className="fw-black text-dark fs-3 mb-2">Scan QR &amp; Siap Dipanggil</h3>
                                <p className="text-secondary small mb-3">
                                    Saat tiba di klinik, tunjukkan QR Code pada scanner meja resepsionis. Giliran Anda langsung masuk layar monitor TV dan siap diperiksa.
                                </p>
                                <div className="mt-auto">
                                    <span className="badge bg-azure-lt text-azure fw-bold">
                                        Bebas antre berdesakan
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Banner Maskot Wanshy */}
            <section id="maskot" className="py-4">
                <div className="container-xl">
                    <div 
                        className="rounded-4 p-4 p-md-5 text-white position-relative overflow-hidden shadow-md"
                        style={{ background: 'linear-gradient(135deg, #0C7C70 0%, #173F3C 100%)' }}
                    >
                        <div className="row g-4 align-items-center">
                            <div className="col-md-8">
                                <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white text-dark small fw-bold mb-3 shadow-xs">
                                    <Sparkles className="icon text-warning" />
                                    <span>KENALKAN MASKOT KAMI: WANSHY</span>
                                </div>
                                <h2 className="display-6 fw-black text-white mb-2">
                                    Takut ke Dokter Gigi? Bersama Wanshy, Semua Jadi Nyaman!
                                </h2>
                                <p className="lead text-white-50 mb-4" style={{ fontSize: '1rem', maxWidth: '34rem' }}>
                                    Klinik Wansha merancang suasana klinik ramah tanpa rasa takut untuk anak-anak hingga orang dewasa. Dapatkan konsultasi gigi yang menyenangkan dan informatif.
                                </p>
                                <button
                                    onClick={() => handleOpenBooking('Pemeriksaan gigi anak')}
                                    className="btn btn-warning btn-lg px-4 fw-bold text-dark shadow-sm"
                                >
                                    Reservasi Perawatan Gigi Anak
                                </button>
                            </div>

                            <div className="col-md-4 text-center">
                                <div 
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle p-4 shadow-lg"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)' }}
                                >
                                    <WanshaMascot className="w-44 h-40" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Queue Search Widget */}
            <section id="antrean" className="py-5 bg-white border-top border-bottom">
                <div className="container-xl py-3 text-center" style={{ maxWidth: '44rem' }}>
                    <span className="small fw-bold text-uppercase tracking-wider text-teal">
                        CEK STATUS TIKET ANDA
                    </span>
                    <h2 className="h1 fw-black mt-1 mb-2" style={{ color: '#173F3C' }}>
                        Lacak Nomor Antrean Anda Realtime
                    </h2>
                    <p className="text-secondary small mb-4">
                        Ketik nomor tiket antrean (contoh: <strong>WNS-001</strong> atau nama pasien) untuk mengetahui status giliran Anda.
                    </p>

                    <form onSubmit={handleSearchQueue} className="mb-4">
                        <div className="input-group input-group-lg shadow-sm">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ketik nomor tiket (misal: WNS-001) atau nama..."
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary px-4 fw-bold">
                                <Search className="icon me-1" /> Cari
                            </button>
                        </div>
                    </form>

                    {/* Search Result */}
                    {searchResult && searchResult !== 'not_found' && (
                        <div className="card shadow-sm border-2 text-start p-3 border-primary">
                            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom">
                                <div>
                                    <div className="h2 font-monospace text-primary fw-black mb-0">{searchResult.ticket_number}</div>
                                    <div className="fw-bold text-dark">{searchResult.patient_name}</div>
                                </div>
                                <span className={`badge ${searchResult.status === 'dipanggil' ? 'bg-warning text-white' : 'bg-teal-lt text-teal'} fs-6 px-3 py-1.5 fw-bold`}>
                                    Status: {searchResult.status === 'dipanggil' ? 'Sedang Dipanggil' : 'Dalam Antrean Menunggu'}
                                </span>
                            </div>
                            <div className="row g-2 mt-2 small text-secondary">
                                <div className="col-6"><strong>Layanan:</strong> {searchResult.service}</div>
                                <div className="col-6"><strong>Dokter:</strong> {searchResult.doctor}</div>
                                <div className="col-6"><strong>Ruangan:</strong> {searchResult.room}</div>
                                <div className="col-6"><strong>Prioritas:</strong> {searchResult.priority}</div>
                            </div>
                        </div>
                    )}

                    {searchResult === 'not_found' && (
                        <div className="alert alert-warning text-start" role="alert">
                            <div className="d-flex align-items-center gap-2">
                                <AlertCircle className="icon text-warning" />
                                <div>Nomor tiket atau nama pasien tidak ditemukan dalam antrean aktif hari ini.</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Layanan Unggulan */}
            <section id="layanan" className="py-5">
                <div className="container-xl py-3">
                    <div className="text-center mb-5" style={{ maxWidth: '38rem', margin: '0 auto' }}>
                        <span className="small fw-bold text-uppercase tracking-wider text-teal">LAYANAN POLI GIGI</span>
                        <h2 className="display-6 fw-black mt-1 mb-2" style={{ color: '#173F3C' }}>
                            Perawatan Gigi Lengkap &amp; Terpercaya
                        </h2>
                        <p className="text-secondary small">
                            Menggunakan peralatan berstandar medis tinggi dengan teknik modern minim rasa sakit untuk senyum percaya diri Anda.
                        </p>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Scaling Karang Gigi',
                                desc: 'Pembersihan karang gigi ultrasonik tuntas, bebas bau mulut, dan nafas segar.',
                                tag: 'Paling Populer',
                            },
                            {
                                title: 'Penambalan Estetik Komposit',
                                desc: 'Tambal gigi berlubang dengan warna yang menyatu alami dengan warna gigi asli Anda.',
                                tag: 'Bahan Premium',
                            },
                            {
                                title: 'Pemeriksaan Gigi Anak',
                                desc: 'Pemeriksaan menyenangkan bersama maskot Wanshy tanpa trauma jarum suntik.',
                                tag: 'Ramah Anak',
                            },
                            {
                                title: 'Kawat Gigi & Behel (Ortodonti)',
                                desc: 'Rapikan susunan gigi dengan behel konvensional atau clear aligner transparan modern.',
                                tag: 'Spesialis Ortodonti',
                            },
                            {
                                title: 'Perawatan Saluran Akar (Endo)',
                                desc: 'Menyelamatkan gigi berlubang parah tanpa harus dicabut secara permanen.',
                                tag: 'Bebas Nyeri',
                            },
                            {
                                title: 'Pencabutan Gigi & Odontektomi',
                                desc: 'Penanganan gigi bungsu bermasalah dengan anestesi terkontrol dan proses cepat.',
                                tag: 'Bedah Mulut',
                            },
                        ].map((srv) => (
                            <div key={srv.title} className="col-md-6 col-lg-4">
                                <div className="card h-100 shadow-sm border-0 rounded-3 p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div 
                                                className="avatar avatar-md rounded-3 bg-teal-lt text-teal fw-bold"
                                            >
                                                <Sparkles className="icon" />
                                            </div>
                                            <span className="badge bg-secondary-lt text-secondary small fw-bold">
                                                {srv.tag}
                                            </span>
                                        </div>
                                        <h3 className="card-title fw-bold text-dark fs-3 mb-2">{srv.title}</h3>
                                        <p className="text-secondary small mb-4">{srv.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenBooking(srv.title)}
                                        className="btn btn-outline-primary btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
                                    >
                                        <span>Ambil Antrean Layanan Ini</span>
                                        <ArrowRight className="icon" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dokter Spesialis Praktik Utama */}
            <section id="dokter" className="py-5 bg-white border-top">
                <div className="container-xl py-3">
                    <div className="text-center mb-5" style={{ maxWidth: '38rem', margin: '0 auto' }}>
                        <span className="small fw-bold text-uppercase tracking-wider text-teal">DOKTER SPESIALIS UTAMA</span>
                        <h2 className="display-6 fw-black mt-1 mb-2" style={{ color: '#173F3C' }}>
                            Praktik Dokter Spesialis Gigi
                        </h2>
                        <p className="text-secondary small">
                            Ditangani langsung secara profesional, teliti, dan ramah dengan standar sterilisasi medis tertinggi.
                        </p>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="card shadow-md border-0 rounded-4 overflow-hidden p-4 p-md-5" style={{ background: '#F8FAF9' }}>
                                <div className="row g-4 align-items-center">
                                    <div className="col-md-4 text-center">
                                        <div 
                                            className="avatar avatar-2xl rounded-circle mx-auto mb-3 fw-black fs-1 text-white shadow-md d-flex align-items-center justify-content-center"
                                            style={{ width: 110, height: 110, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                                        >
                                            DF
                                        </div>
                                        <h3 className="h3 fw-black text-dark mb-0">drg. Febri, Sp.KG</h3>
                                        <div className="badge bg-teal-lt text-teal fw-bold mt-1">Spesialis Konservasi Gigi</div>
                                    </div>

                                    <div className="col-md-8 border-start-md ps-md-4">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="status-dot status-dot-animated bg-green"></span>
                                            <span className="fw-bold small text-success">Praktek Aktif &amp; Siap Melayani</span>
                                        </div>
                                        <p className="text-secondary small mb-3">
                                            Berpengalaman dalam bidang konservasi dan estetika gigi, perawatan saluran akar mikro (endodontik), pembersihan karang gigi ultrasonik, serta restorasi mahkota gigi dengan pendekatan minim rasa sakit.
                                        </p>

                                        <div className="p-3 bg-white rounded-3 border small space-y-2 text-secondary mb-4 shadow-2xs">
                                            <div className="d-flex justify-content-between">
                                                <strong>Jadwal Praktik:</strong>
                                                <span className="text-dark fw-bold">Senin - Sabtu: 08.00 - 20.00 WIB</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <strong>Ruang Praktik:</strong>
                                                <span className="badge bg-blue-lt text-blue fw-bold">Ruang Periksa Gigi</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <strong>Sistem Pelayanan:</strong>
                                                <span className="text-teal fw-bold">Antrean Online &amp; Check-In QR</span>
                                            </div>
                                        </div>

                                        {currentUser ? (
                                            <Link
                                                href={dashboard()}
                                                className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm text-decoration-none text-center d-block"
                                            >
                                                Ambil Nomor Antrean di Dashboard &rarr;
                                            </Link>
                                        ) : (
                                            <Link
                                                href={register()}
                                                className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm text-decoration-none text-center d-block"
                                            >
                                                Daftar Akun Untuk Reservasi &rarr;
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer id="kontak" className="text-white py-5" style={{ backgroundColor: '#112926' }}>
                <div className="container-xl">
                    <div className="row g-4 pb-4 border-bottom border-white-subtle">
                        <div className="col-lg-5">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center rounded-3 bg-white text-teal" 
                                    style={{ width: 40, height: 40 }}
                                >
                                    <svg viewBox="0 0 32 32" style={{ width: 24, height: 24, fill: '#0C7C70' }} aria-hidden="true">
                                        <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                                    </svg>
                                </div>
                                <span className="fs-2 fw-black text-white">Klinik Gigi Wansha</span>
                            </div>
                            <p className="text-white-50 small mb-3" style={{ maxWidth: '28rem' }}>
                                Layanan perawatan gigi keluarga berkualitas tinggi dengan standar sterilisasi modern dan sistem antrean cerdas tanpa antre lama.
                            </p>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <h4 className="text-uppercase fw-bold small text-teal mb-3">Jam Operasional</h4>
                            <div className="small text-white-50 space-y-1">
                                <div>Senin - Jumat: 08.00 - 20.00 WIB</div>
                                <div>Sabtu - Minggu: 08.00 - 18.00 WIB</div>
                                <div className="text-warning mt-1">Layanan Antrean Online Buka 24 Jam</div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-4">
                            <h4 className="text-uppercase fw-bold small text-teal mb-3">Kontak &amp; Alamat</h4>
                            <div className="small text-white-50 space-y-1.5">
                                <div><MapPin className="icon icon-inline me-1 text-teal" /> Jl. Kesehatan Medika No. 12, Jakarta</div>
                                <div><Phone className="icon icon-inline me-1 text-teal" /> (021) 7892-1234 / 0812-3456-7890</div>
                                <div><PhoneCall className="icon icon-inline me-1 text-teal" /> Layanan Konsultasi WhatsApp Aktif</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 d-flex flex-column flex-sm-row align-items-center justify-content-between small text-white-50">
                        <div>&copy; {new Date().getFullYear()} Klinik Gigi Wansha Dental Care. Hak cipta dilindungi.</div>
                        <div className="mt-2 mt-sm-0">Sistem Antrean Cerdas &amp; Layanan Poli Gigi</div>
                    </div>
                </div>
            </footer>

            {/* TABLER MODAL: DAFTAR / AMBIL NOMOR ANTREAN ONLINE */}
            {showBookingModal && (
                <div 
                    className="modal modal-blur fade show d-block" 
                    tabIndex={-1} 
                    role="dialog"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
                >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content shadow-xl border-0 rounded-4">
                            <div className="modal-header bg-white py-3 border-bottom">
                                <h3 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 m-0">
                                    <QrCode className="icon text-primary" />
                                    <span>Pendaftaran Nomor Antrean Pasien</span>
                                </h3>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    aria-label="Close" 
                                    onClick={() => setShowBookingModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                {bookingSuccessTicket ? (
                                    <div className="text-center py-3">
                                        <div className="avatar avatar-xl rounded-circle bg-success-lt text-success mx-auto mb-3">
                                            <CheckCircle2 style={{ width: 44, height: 44 }} />
                                        </div>
                                        <h3 className="h2 fw-black text-dark mb-1">Reservasi Berhasil!</h3>
                                        <p className="text-secondary small mb-3">
                                            Nomor antrean dan QR Code digital Anda telah diterbitkan:
                                        </p>

                                        <div className="card p-3 bg-light border-2 border-primary mb-3 text-start">
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                                                <span className="text-secondary small">Nomor Tiket:</span>
                                                <strong className="fs-2 text-primary font-monospace">{bookingSuccessTicket.ticket_number}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between small py-1">
                                                <span className="text-secondary">Nama Pasien:</span>
                                                <strong className="text-dark">{bookingSuccessTicket.patient_name}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between small py-1">
                                                <span className="text-secondary">Layanan &amp; Poli:</span>
                                                <span>{bookingSuccessTicket.service} ({bookingSuccessTicket.room})</span>
                                            </div>
                                            <div className="d-flex justify-content-between small py-1">
                                                <span className="text-secondary">Kode QR Check-In:</span>
                                                <strong className="font-monospace text-dark">{bookingSuccessTicket.qr_code}</strong>
                                            </div>
                                        </div>

                                        <p className="small text-muted mb-4">
                                            Tunjukkan kode ini kepada resepsionis saat Anda tiba di klinik untuk validasi kehadiran ke antrean aktif.
                                        </p>

                                        <div className="d-flex gap-2">
                                            <button 
                                                onClick={() => setShowBookingModal(false)} 
                                                className="btn btn-outline-secondary w-50"
                                            >
                                                Tutup
                                            </button>
                                            <Link href={dashboard()} className="btn btn-primary w-50 fw-bold">
                                                Lihat di Dashboard &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReservationSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Nama Lengkap Pasien *</label>
                                            <input
                                                type="text"
                                                required
                                                className="form-control"
                                                placeholder="Contoh: Dimas Anggara"
                                                value={patientName}
                                                onChange={(e) => setPatientName(e.target.value)}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Nomor WhatsApp Aktif *</label>
                                            <input
                                                type="tel"
                                                required
                                                className="form-control"
                                                placeholder="Contoh: 081234567890"
                                                value={patientPhone}
                                                onChange={(e) => setPatientPhone(e.target.value)}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Pilih Layanan Gigi *</label>
                                            <select
                                                className="form-select"
                                                value={service}
                                                onChange={(e) => setService(e.target.value)}
                                            >
                                                <option value="Scaling karang gigi">Scaling Karang Gigi</option>
                                                <option value="Penambalan gigi estetis">Penambalan Estetis</option>
                                                <option value="Pemeriksaan gigi anak">Pemeriksaan Gigi Anak</option>
                                                <option value="Kawat gigi & behel (Ortodonti)">Kawat Gigi &amp; Behel</option>
                                                <option value="Perawatan saluran akar">Saluran Akar</option>
                                                <option value="Pencabutan gigi bungsu">Pencabutan Gigi Bungsu</option>
                                            </select>
                                        </div>

                                        <div className="p-3 bg-light rounded-3 border mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-secondary small fw-bold">Dokter Bertugas:</span>
                                                <strong className="text-dark">drg. Febri, Sp.KG</strong>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-secondary small fw-bold">Ruangan Praktik:</span>
                                                <span className="badge bg-teal-lt text-teal fw-bold">Ruang Periksa Gigi</span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Kategori Prioritas Pasien</label>
                                            <select
                                                className="form-select"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                            >
                                                <option value="Reguler">Reguler (Pemeriksaan umum biasa)</option>
                                                <option value="Lansia">Lansia (Usia 60 tahun ke atas)</option>
                                                <option value="Anak">Anak (Usia di bawah 12 tahun)</option>
                                                <option value="Darurat">Darurat (Sakit gigi akut / pendarahan)</option>
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-bold">Keluhan / Catatan Tambahan (Opsional)</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                placeholder="Contoh: Gigi belakang berdenyut sejak kemarin..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingBooking || !patientName.trim()}
                                            className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                        >
                                            {submittingBooking ? (
                                                <span>Menerbitkan Nomor Antrean...</span>
                                            ) : (
                                                <>
                                                    <span>Terbitkan Nomor Antrean &amp; QR Code</span>
                                                    <ArrowRight className="icon" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Asisten Virtual Chatbot Widget */}
            <ChatbotWidget />
        </div>
    );
}
