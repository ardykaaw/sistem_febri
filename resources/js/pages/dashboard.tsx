import AppLayout from '@/layouts/app-layout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Users, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    QrCode, 
    ArrowRight, 
    Check, 
    Plus, 
    Building2, 
    ListOrdered,
    ClipboardList,
    Copy, 
    CheckCheck,
    X,
    RefreshCw,
    ShieldAlert,
    HeartPulse,
    Activity,
    Calendar,
    Phone
} from 'lucide-react';

interface QueueTicketData {
    id: number;
    ticket_number: string;
    qr_code: string;
    patient_name: string;
    patient_phone: string;
    service: string;
    doctor: string;
    room: string;
    priority: string;
    priority_score: number;
    is_checked_in: boolean;
    checked_in_at: string | null;
    status: string;
    called_at: string | null;
}

export default function Dashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;
    const isAdmin = currentUser?.role === 'admin';

    // State Data Antrean
    const [activeQueue, setActiveQueue] = useState<QueueTicketData[]>([]);
    const [currentlyCalling, setCurrentlyCalling] = useState<QueueTicketData[]>([]);
    const [stats, setStats] = useState({
        total_reservasi: 0,
        menunggu_checkin: 0,
        antrean_aktif: 0,
        sedang_dipanggil: 0,
        selesai_hari_ini: 0,
    });
    const [loading, setLoading] = useState(false);

    // Patient User State
    const [myTicket, setMyTicket] = useState<QueueTicketData | null>(null);
    const [myPosition, setMyPosition] = useState<number | null>(null);
    const [showNewReservationModal, setShowNewReservationModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [copiedQr, setCopiedQr] = useState(false);

    // Form Reservasi Baru Pasien
    const [resService, setResService] = useState('Scaling karang gigi');
    const [resDoctor, setResDoctor] = useState('drg. Febri, Sp.KG');
    const [resPriority, setResPriority] = useState<'Reguler' | 'Lansia' | 'Anak' | 'Darurat'>('Reguler');
    const [resPhone, setResPhone] = useState(currentUser?.phone || '0812-3456-7890');
    const [resNotes, setResNotes] = useState('');
    const [isSubmittingRes, setIsSubmittingRes] = useState(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchQueueData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/queue/live');
            const data = await res.json();
            if (data.success) {
                setActiveQueue(data.active_queue || []);
                setCurrentlyCalling(data.currently_calling || []);
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch queue data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTicket = async () => {
        try {
            const res = await fetch('/api/queue/my-ticket');
            const data = await res.json();
            if (data.success) {
                setMyTicket(data.ticket);
                setMyPosition(data.position);
            }
        } catch (err) {
            console.error('Failed to fetch user ticket:', err);
        }
    };

    useEffect(() => {
        fetchQueueData();
        fetchMyTicket();
        const interval = setInterval(() => {
            fetchQueueData();
            fetchMyTicket();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCopyQr = (code: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedQr(true);
            setTimeout(() => setCopiedQr(false), 2000);
        }
    };

    const handleCreateReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingRes(true);
        try {
            const res = await fetch('/api/queue/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: currentUser?.name || 'Pasien',
                    patient_phone: resPhone,
                    service: resService,
                    doctor: resDoctor,
                    priority: resPriority,
                    notes: resNotes,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Reservasi berhasil! Kode QR Anda telah terbit.');
                setShowNewReservationModal(false);
                fetchMyTicket();
                fetchQueueData();
            } else {
                showToast(data.message || 'Gagal membuat reservasi.');
            }
        } catch {
            showToast('Terjadi kesalahan saat membuat reservasi.');
        } finally {
            setIsSubmittingRes(false);
        }
    };

    const handleSelfCheckin = async (qrCode: string) => {
        try {
            const res = await fetch('/api/queue/validate-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: qrCode }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Check-in berhasil! Tiket Anda telah masuk ke antrean aktif.');
                fetchMyTicket();
                fetchQueueData();
            } else {
                showToast(data.message || 'Gagal memvalidasi.');
            }
        } catch {
            showToast('Kesalahan server saat check-in.');
        }
    };

    const getPriorityBadgeClass = (p: string) => {
        switch (p) {
            case 'Darurat':
                return 'badge bg-red-lt text-red fw-bold';
            case 'Lansia':
                return 'badge bg-yellow-lt text-yellow fw-bold';
            case 'Anak':
                return 'badge bg-azure-lt text-azure fw-bold';
            default:
                return 'badge bg-teal-lt text-teal fw-bold';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title={isAdmin ? 'Dashboard Admin - Klinik Wansha' : 'Tiket & Antrean Saya - Klinik Wansha'} />

            {/* Toast Alert */}
            {toastMessage && (
                <div className="alert alert-success alert-dismissible shadow-sm mb-4" role="alert">
                    <div className="d-flex align-items-center">
                        <CheckCircle2 style={{ width: 18, height: 18, marginRight: 8 }} />
                        <div>{toastMessage}</div>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setToastMessage(null)} aria-label="Close"></button>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAMPILAN DASHBOARD ADMIN (TABLER STYLING)                 */}
            {/* ========================================================= */}
            {isAdmin ? (
                <>
                    {/* Tabler Page Header */}
                    <div className="page-header d-print-none mb-4">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <div className="page-pretitle text-secondary">
                                    Administrator Panel
                                </div>
                                <h2 className="page-title text-dark">
                                    Dashboard Operasional Klinik
                                </h2>
                                <div className="text-secondary small mt-1">
                                    Selamat datang kembali, <strong>{currentUser?.name}</strong>. Pantau antrean &amp; aktivitas klinik secara realtime.
                                </div>
                            </div>
                            <div className="col-auto ms-auto d-print-none">
                                <div className="btn-list">
                                    <button
                                        type="button"
                                        onClick={fetchQueueData}
                                        disabled={loading}
                                        className="btn btn-outline-primary d-flex align-items-center gap-1.5"
                                    >
                                        <RefreshCw style={{ width: 14, height: 14 }} className={loading ? 'spinner-border spinner-border-sm' : ''} />
                                        <span>Segarkan Data</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 Stat Cards Modern Tabler */}
                    <div className="row row-deck row-cards mb-4">
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-hover shadow-sm border-0 rounded-4">
                                <div className="card-body p-3.5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div 
                                            className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                                            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #206BC4 0%, #17549C 100%)', boxShadow: '0 4px 12px rgba(32, 107, 196, 0.25)' }}
                                        >
                                            <Users style={{ width: 22, height: 22 }} />
                                        </div>
                                        <div>
                                            <div className="fw-black fs-2 text-dark lh-1" style={{ letterSpacing: '-0.02em' }}>
                                                {stats.total_reservasi}
                                            </div>
                                            <div className="text-secondary small mt-1 fw-medium" style={{ fontSize: '12px' }}>Total Reservasi Hari Ini</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-hover shadow-sm border-0 rounded-4">
                                <div className="card-body p-3.5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div 
                                            className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                                            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #F5B755 0%, #D89524 100%)', boxShadow: '0 4px 12px rgba(245, 183, 85, 0.28)' }}
                                        >
                                            <Clock style={{ width: 22, height: 22 }} />
                                        </div>
                                        <div>
                                            <div className="fw-black fs-2 text-warning lh-1" style={{ letterSpacing: '-0.02em' }}>
                                                {stats.menunggu_checkin}
                                            </div>
                                            <div className="text-secondary small mt-1 fw-medium" style={{ fontSize: '12px' }}>Menunggu Validasi QR</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-hover shadow-sm border-0 rounded-4">
                                <div className="card-body p-3.5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div 
                                            className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                                            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0C7C70 0%, #07524A 100%)', boxShadow: '0 4px 14px rgba(12, 124, 112, 0.35)' }}
                                        >
                                            <Activity style={{ width: 22, height: 22 }} />
                                        </div>
                                        <div>
                                            <div className="fw-black fs-2 text-teal lh-1" style={{ color: '#0C7C70', letterSpacing: '-0.02em' }}>
                                                {stats.antrean_aktif}
                                            </div>
                                            <div className="text-secondary small mt-1 fw-medium" style={{ fontSize: '12px' }}>Antrean Aktif (FIFO+Prioritas)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-hover shadow-sm border-0 rounded-4">
                                <div className="card-body p-3.5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div 
                                            className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                                            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #2FB344 0%, #1E7E2E 100%)', boxShadow: '0 4px 12px rgba(47, 179, 68, 0.25)' }}
                                        >
                                            <CheckCircle2 style={{ width: 22, height: 22 }} />
                                        </div>
                                        <div>
                                            <div className="fw-black fs-2 text-success lh-1" style={{ letterSpacing: '-0.02em' }}>
                                                {stats.selesai_hari_ini}
                                            </div>
                                            <div className="text-secondary small mt-1 fw-medium" style={{ fontSize: '12px' }}>Pasien Selesai Dilayani</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Navigation Cards (3 Menu Utama Tabler) */}
                    <div className="row row-cards mb-4">
                        <div className="col-md-4">
                            <div className="card card-hover shadow-sm border-0 rounded-4 h-100">
                                <div className="card-body p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div 
                                                className="d-flex align-items-center justify-content-center rounded-3 text-teal" 
                                                style={{ width: 42, height: 42, backgroundColor: '#E2F5F0', color: '#0C7C70' }}
                                            >
                                                <ListOrdered style={{ width: 22, height: 22 }} />
                                            </div>
                                            <span className="badge bg-teal-lt">{activeQueue.length} Pasien</span>
                                        </div>
                                        <h3 className="card-title text-dark mb-1 fw-bold fs-3">Manajemen Antrean</h3>
                                        <p className="text-secondary small mb-4" style={{ lineHeight: '1.5' }}>
                                            Urutan pasien otomatis teratur berdasarkan Medical Priority &amp; FIFO waktu kedatangan. Panggil dan selesaikan pemeriksaan.
                                        </p>
                                    </div>
                                    <Link 
                                        href="/admin/antrean" 
                                        className="btn btn-primary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-1.5 fw-bold shadow-sm"
                                    >
                                        <span>Kelola Antrean Aktif</span>
                                        <ArrowRight style={{ width: 14, height: 14 }} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card card-hover shadow-sm border-0 rounded-4 h-100">
                                <div className="card-body p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div 
                                                className="d-flex align-items-center justify-content-center rounded-3 text-purple" 
                                                style={{ width: 42, height: 42, backgroundColor: '#F4EBFF', color: '#7E3AF2' }}
                                            >
                                                <QrCode style={{ width: 22, height: 22 }} />
                                            </div>
                                            <span className="badge" style={{ backgroundColor: '#F4EBFF', color: '#7E3AF2', border: '1px solid rgba(126, 58, 242, 0.2)' }}>
                                                {stats.menunggu_checkin} Pending
                                            </span>
                                        </div>
                                        <h3 className="card-title text-dark mb-1 fw-bold fs-3">Scan Kehadiran</h3>
                                        <p className="text-secondary small mb-4" style={{ lineHeight: '1.5' }}>
                                            Validasi kedatangan via kamera webcam resepsionis atau barcode scanner laser USB untuk aktivasi urutan antrean di klinik.
                                        </p>
                                    </div>
                                    <Link 
                                        href="/admin/scan" 
                                        className="btn btn-outline-primary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-1.5 fw-bold"
                                    >
                                        <span>Buka Kamera Scanner</span>
                                        <ArrowRight style={{ width: 14, height: 14 }} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="card card-hover shadow-sm border-0 rounded-4 h-100">
                                <div className="card-body p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div 
                                                className="d-flex align-items-center justify-content-center rounded-3 text-blue" 
                                                style={{ width: 42, height: 42, backgroundColor: '#E8F4FD', color: '#206BC4' }}
                                            >
                                                <ClipboardList style={{ width: 22, height: 22 }} />
                                            </div>
                                            <span className="badge bg-azure-lt">{stats.total_reservasi} Total</span>
                                        </div>
                                        <h3 className="card-title text-dark mb-1 fw-bold fs-3">Data Reservasi</h3>
                                        <p className="text-secondary small mb-4" style={{ lineHeight: '1.5' }}>
                                            Daftar lengkap seluruh pasien yang booking online hari ini, kontak WhatsApp, dan validasi hadir secara manual.
                                        </p>
                                    </div>
                                    <Link 
                                        href="/admin/reservasi" 
                                        className="btn btn-outline-primary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-1.5 fw-bold"
                                    >
                                        <span>Lihat Data Reservasi</span>
                                        <ArrowRight style={{ width: 14, height: 14 }} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Ruang Poli Gigi (Tabler Cards) */}
                    <div className="card mb-4 shadow-2xs">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h3 className="card-title d-flex align-items-center gap-2 text-dark">
                                <Building2 style={{ width: 18, height: 18, color: '#0C7C70' }} />
                                <span>Status Ruangan Poli Gigi Realtime</span>
                            </h3>
                            <span className="badge bg-green-lt">Live Monitor</span>
                        </div>
                        <div className="card-body p-3">
                            <div className="row g-3">
                                {[
                                    { room: 'Poli Gigi 1', doctor: 'drg. Alya Nirmala, Sp.KG', spec: 'Konservasi Gigi & Perawatan Saluran Akar' },
                                    { room: 'Poli Gigi 2', doctor: 'drg. Keisha Putri, Sp.KGA', spec: 'Kedokteran Gigi Anak & Pencegahan' },
                                    { room: 'Poli Gigi 3', doctor: 'drg. Bimo Prasetyo, Sp.Ort', spec: 'Ortodonti & Kawat Gigi Estetik' },
                                ].map((p) => {
                                    const activePatient = currentlyCalling.find((c) => c.room === p.room);
                                    return (
                                        <div key={p.room} className="col-md-4">
                                            <div className="card card-sm bg-light-lt border rounded-3 p-3 h-100">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span className="fw-bold text-dark">{p.room}</span>
                                                    {activePatient ? (
                                                        <span className="badge bg-warning text-warning-fg">
                                                            <span className="status-dot status-dot-animated bg-white me-1"></span>
                                                            MELAYANI
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success-lt">STANDBY</span>
                                                    )}
                                                </div>
                                                <div className="fw-bold small text-dark">{p.doctor}</div>
                                                <div className="text-secondary small mb-3" style={{ fontSize: '11px' }}>{p.spec}</div>

                                                <div className="pt-2 border-top mt-auto">
                                                    {activePatient ? (
                                                        <div className="p-2 rounded-2 bg-white border d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <span className="text-secondary text-uppercase fw-bold d-block" style={{ fontSize: '10px' }}>
                                                                    Sedang Diperiksa:
                                                                </span>
                                                                <span className="fw-bold small text-dark">{activePatient.patient_name}</span>
                                                            </div>
                                                            <span className="font-monospace fw-bold fs-3 text-teal" style={{ color: '#0C7C70' }}>
                                                                {activePatient.ticket_number}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-secondary small py-2 bg-white rounded-2 border">
                                                            Belum ada pasien yang dipanggil
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Table Recent Active Queue (Tabler Card Table) */}
                    <div className="card shadow-2xs">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h3 className="card-title text-dark">Antrean Aktif Terkini</h3>
                            <Link href="/admin/antrean" className="btn btn-sm btn-link">
                                Kelola Semua Antrean ({activeQueue.length}) &rarr;
                            </Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th className="w-1">Urutan</th>
                                        <th>No. Tiket</th>
                                        <th>Nama Pasien</th>
                                        <th>Ruangan Poli</th>
                                        <th>Layanan Perawatan</th>
                                        <th>Kategori Prioritas</th>
                                        <th>Jam Hadir</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeQueue.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4 text-secondary">
                                                Tidak ada antrean aktif saat ini. Pasien yang telah reservasi harus scan QR di resepsionis untuk masuk antrean.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeQueue.slice(0, 5).map((q, idx) => (
                                            <tr key={q.id}>
                                                <td className="text-secondary font-monospace fw-bold">#{idx + 1}</td>
                                                <td>
                                                    <span className="font-monospace fw-bold fs-3 text-teal" style={{ color: '#0C7C70' }}>
                                                        {q.ticket_number}
                                                    </span>
                                                </td>
                                                <td className="fw-bold text-dark">{q.patient_name}</td>
                                                <td><span className="badge bg-light text-dark">{q.room}</span></td>
                                                <td className="text-secondary small">{q.service}</td>
                                                <td>
                                                    <span className={getPriorityBadgeClass(q.priority)}>
                                                        {q.priority}
                                                    </span>
                                                </td>
                                                <td className="text-secondary font-monospace small">
                                                    {q.checked_in_at ? new Date(q.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td>
                                                    {q.status === 'dipanggil' ? (
                                                        <span className="badge bg-warning text-warning-fg">DIPANGGIL</span>
                                                    ) : (
                                                        <span className="badge bg-secondary-lt">Menunggu</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* ========================================================= */
                /* TAMPILAN DASHBOARD PASIEN (USER MODE - TABLER STYLING)   */
                /* ========================================================= */
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        {/* Page Header */}
                        <div className="page-header d-print-none mb-4">
                            <div className="row align-items-center">
                                <div className="col">
                                    <div className="page-pretitle text-secondary">Pasien Klinik Wansha</div>
                                    <h2 className="page-title text-dark">Tiket &amp; Antrean Kunjungan Saya</h2>
                                    <div className="text-secondary small mt-1">
                                        Selamat datang, <strong>{currentUser?.name}</strong>. Tunjukkan QR code di bawah saat Anda tiba di klinik.
                                    </div>
                                </div>
                                <div className="col-auto ms-auto">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewReservationModal(true)}
                                        className="btn btn-primary d-flex align-items-center gap-1"
                                    >
                                        <Plus style={{ width: 16, height: 16 }} />
                                        <span>Reservasi Baru</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {myTicket ? (
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                                <div className="card-status-top" style={{ backgroundColor: '#0C7C70', height: 4 }}></div>
                                <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div 
                                            className="d-flex align-items-center justify-content-center rounded-3 shadow-xs text-white" 
                                            style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                                        >
                                            <svg viewBox="0 0 32 32" style={{ width: 18, height: 18, fill: 'white' }} aria-hidden="true">
                                                <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-bold small lh-1 text-dark">Klinik Gigi Wansha</div>
                                            <div className="text-secondary" style={{ fontSize: '11px' }}>Tiket Digital Kunjungan Resmi</div>
                                        </div>
                                    </div>
                                    <span className={getPriorityBadgeClass(myTicket.priority)}>
                                        Prioritas: {myTicket.priority}
                                    </span>
                                </div>

                                <div className="card-body p-4">
                                    <div className="row g-4 align-items-center">
                                        <div className="col-md-7">
                                            <div className="text-secondary text-uppercase fw-bold small" style={{ letterSpacing: '0.08em' }}>
                                                NOMOR TIKET ANDA
                                            </div>
                                            <div className="font-monospace fw-bold display-3 text-teal my-1" style={{ color: '#0C7C70' }}>
                                                {myTicket.ticket_number}
                                            </div>

                                            <div className="list-group list-group-flush small mt-3">
                                                <div className="list-group-item d-flex justify-content-between px-0 py-1.5 border-bottom">
                                                    <span className="text-secondary">Nama Pasien:</span>
                                                    <strong className="text-dark">{myTicket.patient_name}</strong>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between px-0 py-1.5 border-bottom">
                                                    <span className="text-secondary">Layanan:</span>
                                                    <strong className="text-dark">{myTicket.service}</strong>
                                                </div>
                                                <div className="list-group-item d-flex justify-content-between px-0 py-1.5 border-bottom">
                                                    <span className="text-secondary">Dokter &amp; Poli:</span>
                                                    <strong className="text-dark">{myTicket.doctor} ({myTicket.room})</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Big QR Code Card */}
                                        <div className="col-md-5 text-center">
                                            <div className="p-3 bg-light rounded-3 border d-inline-block shadow-2xs">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(myTicket.qr_code)}`}
                                                    alt="QR Code Tiket"
                                                    style={{ width: 140, height: 140 }}
                                                    className="rounded-2"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyQr(myTicket.qr_code)}
                                                    className="btn btn-sm btn-ghost-secondary font-monospace"
                                                >
                                                    {copiedQr ? <CheckCheck style={{ width: 13, height: 13, color: '#20c997' }} /> : <Copy style={{ width: 13, height: 13 }} />}
                                                    <span className="ms-1">{myTicket.qr_code}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrival status & guidance */}
                                    <div className="mt-4 pt-3 border-top">
                                        {!myTicket.is_checked_in ? (
                                            <div className="alert alert-warning mb-0" role="alert">
                                                <div className="d-flex align-items-center mb-1">
                                                    <Clock style={{ width: 16, height: 16, marginRight: 6 }} />
                                                    <strong className="small">STATUS: MENUNGGU VALIDASI KEHADIRAN DI KLINIK</strong>
                                                </div>
                                                <p className="small mb-2 text-secondary">
                                                    Tunjukkan QR Code ini pada scanner kamera di meja resepsionis saat tiba di klinik untuk mengaktifkan urutan antrean FIFO dan prioritas Anda.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelfCheckin(myTicket.qr_code)}
                                                    className="btn btn-sm btn-warning d-inline-flex align-items-center gap-1"
                                                >
                                                    <span>Uji Coba: Simulasi Check-in Hadir Sekarang</span>
                                                    <ArrowRight style={{ width: 12, height: 12 }} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="alert alert-success mb-0" role="alert">
                                                <div className="d-flex align-items-center mb-1">
                                                    <CheckCircle2 style={{ width: 16, height: 16, marginRight: 6 }} />
                                                    <strong className="small">KEHADIRAN TELAH TERVERIFIKASI DI KLINIK</strong>
                                                </div>
                                                <p className="small mb-0 text-secondary">
                                                    Anda telah masuk dalam antrean aktif. Silakan duduk di ruang tunggu dan perhatikan monitor TV antrean.
                                                    {myPosition !== null && (
                                                        <span className="d-block mt-1 fw-bold text-success">
                                                            Posisi Antrean Anda: Urutan ke-{myPosition} aktif.
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card text-center p-5 shadow-2xs">
                                <div className="card-body">
                                    <div className="avatar avatar-xl bg-teal-lt text-teal rounded-circle mx-auto mb-3">
                                        <QrCode style={{ width: 36, height: 36 }} />
                                    </div>
                                    <h3 className="card-title fs-2 text-dark">Belum Ada Antrean Aktif Hari Ini</h3>
                                    <p className="text-secondary small max-w-sm mx-auto mb-4">
                                        Silakan buat reservasi perawatan gigi untuk mendapatkan nomor tiket antrean dan kode QR kedatangan Anda.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewReservationModal(true)}
                                        className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-4 py-2"
                                    >
                                        <Plus style={{ width: 16, height: 16 }} />
                                        <span>Buat Reservasi Perawatan Gigi</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TABLER MODAL RESERVASI BARU PASIEN */}
            {showNewReservationModal && (
                <div className="modal modal-blur fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content shadow-lg border-0 rounded-3">
                            <div className="modal-header">
                                <h5 className="modal-title text-dark fw-bold">Reservasi Perawatan Gigi Baru</h5>
                                <button type="button" className="btn-close" onClick={() => setShowNewReservationModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleCreateReservation}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label required">Layanan Perawatan</label>
                                        <select
                                            value={resService}
                                            onChange={(e) => setResService(e.target.value)}
                                            className="form-select"
                                        >
                                            <option>Scaling karang gigi</option>
                                            <option>Sakit gigi akut (Darurat)</option>
                                            <option>Pemeriksaan gigi anak</option>
                                            <option>Penambalan komposit</option>
                                            <option>Konsultasi kawat gigi / Behel</option>
                                            <option>Pencabutan sisa akar gigi</option>
                                        </select>
                                    </div>

                                    <div className="p-3 bg-light rounded-3 border mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-secondary small fw-bold">Dokter Praktik:</span>
                                            <strong className="text-dark">drg. Febri, Sp.KG</strong>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-secondary small fw-bold">Ruangan Pelayanan:</span>
                                            <span className="badge bg-teal-lt text-teal fw-bold">Ruang Periksa Gigi</span>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label required">Kategori Prioritas Medis</label>
                                        <div className="btn-group w-100" role="group">
                                            {(['Reguler', 'Anak', 'Lansia', 'Darurat'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setResPriority(p)}
                                                    className={`btn ${resPriority === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="form-text small text-secondary mt-1">
                                            Skor Prioritas: Darurat &gt; Lansia &gt; Anak &gt; Reguler.
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label required">Nomor WhatsApp / HP</label>
                                        <input
                                            type="tel"
                                            value={resPhone}
                                            onChange={(e) => setResPhone(e.target.value)}
                                            required
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Catatan Keluhan (Opsional)</label>
                                        <input
                                            type="text"
                                            value={resNotes}
                                            onChange={(e) => setResNotes(e.target.value)}
                                            placeholder="Contoh: Gigi ngilu saat minum dingin"
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-link link-secondary" onClick={() => setShowNewReservationModal(false)}>
                                        Batal
                                    </button>
                                    <button type="submit" disabled={isSubmittingRes} className="btn btn-primary ms-auto">
                                        {isSubmittingRes ? 'Menerbitkan Tiket...' : 'Konfirmasi & Dapatkan QR Code'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
