import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { 
    Users, 
    Bell, 
    CheckCircle2, 
    Clock, 
    ShieldAlert, 
    HeartPulse, 
    RefreshCw, 
    AlertCircle,
    Filter,
    QrCode,
    Sparkles,
    Check,
    Settings
} from 'lucide-react';
import AudioSettingsModal from '@/components/audio-settings-modal';

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
    priority_score: number;
    status: string;
    checked_in_at: string | null;
    called_at: string | null;
}

export default function QueueManagement() {
    const [activeQueue, setActiveQueue] = useState<QueueItem[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<string>('Semua');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showAudioModal, setShowAudioModal] = useState(false);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/queue/live');
            const data = await res.json();
            if (data.success) {
                setActiveQueue(data.active_queue || []);
            }
        } catch (err) {
            console.error('Error fetching queue:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 4000);
        return () => clearInterval(interval);
    }, []);

    const showNotif = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };

    const playCallChime = () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {
            // ignore audio restriction
        }
    };

    const handleCall = async (id: number, ticketNumber: string, room: string) => {
        setActionLoading(id);
        try {
            const res = await fetch('/api/queue/call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ticket_id: id, room }),
            });
            const data = await res.json();
            if (data.success) {
                playCallChime();
                showNotif('success', `Tiket ${ticketNumber} dipanggil ke ${room}! Layar monitor TV dan audio speaker otomatis mengumumkan.`);
                fetchQueue();
            } else {
                showNotif('error', data.message || 'Gagal memanggil pasien');
            }
        } catch {
            showNotif('error', 'Terjadi kesalahan server saat memanggil');
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (id: number, ticketNumber: string) => {
        setActionLoading(id);
        try {
            const res = await fetch('/api/queue/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ticket_id: id }),
            });
            const data = await res.json();
            if (data.success) {
                showNotif('success', `Tiket ${ticketNumber} telah berhasil diselesaikan.`);
                fetchQueue();
            } else {
                showNotif('error', data.message || 'Gagal menyelesaikan pasien');
            }
        } catch {
            showNotif('error', 'Terjadi kesalahan server saat menyelesaikan');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredQueue = activeQueue.filter((item) => {
        if (selectedRoom === 'Semua') return true;
        return item.room === selectedRoom;
    });

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'Darurat':
                return { badgeClass: 'bg-red-lt text-red border-red', icon: <ShieldAlert className="icon icon-inline me-1 text-red" /> };
            case 'Lansia':
                return { badgeClass: 'bg-yellow-lt text-yellow border-yellow', icon: <Clock className="icon icon-inline me-1 text-yellow" /> };
            case 'Anak':
                return { badgeClass: 'bg-azure-lt text-azure border-azure', icon: <HeartPulse className="icon icon-inline me-1 text-azure" /> };
            default:
                return { badgeClass: 'bg-teal-lt text-teal border-teal', icon: <Sparkles className="icon icon-inline me-1 text-teal" /> };
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Manajemen Antrean', href: '/admin/antrean' }]}>
            <Head title="Manajemen Antrean Aktif (FIFO & Prioritas) - Klinik Wansha" />

            {/* Page Header */}
            <div className="page-header d-print-none mb-3">
                <div className="row g-2 align-items-center">
                    <div className="col">
                        <div className="page-pretitle text-secondary fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                            Penjadwalan Otomatis Medical Priority &amp; FIFO Check-In
                        </div>
                        <h2 className="page-title d-flex align-items-center gap-2">
                            <span>Manajemen Antrean Pasien Aktif</span>
                            <span className="badge bg-teal-lt px-3 py-1 fs-5 fw-bold">
                                {activeQueue.length} Pasien Terdaftar
                            </span>
                        </h2>
                    </div>
                    <div className="col-auto ms-auto d-print-none">
                        <div className="btn-list">
                            <button
                                type="button"
                                onClick={() => setShowAudioModal(true)}
                                className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                                style={{ borderRadius: '10px' }}
                                title="Pilih suara Text-to-Speech dan jenis nada bel antrean"
                            >
                                <Settings className="icon text-warning" />
                                <span>Pengaturan Suara</span>
                            </button>
                            <Link
                                href="/admin/scan"
                                className="btn btn-outline-primary d-inline-flex align-items-center gap-1.5"
                                style={{ borderRadius: '10px' }}
                            >
                                <QrCode className="icon" />
                                <span>Buka Scanner Barcode / QR</span>
                            </Link>
                            <button
                                onClick={fetchQueue}
                                disabled={loading}
                                className="btn btn-primary d-inline-flex align-items-center gap-1.5 shadow-sm"
                                style={{ borderRadius: '10px' }}
                            >
                                <RefreshCw className={`icon ${loading ? 'animate-spin' : ''}`} />
                                <span>Segarkan Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Alert */}
            {notification && (
                <div 
                    className={`alert alert-dismissible mb-3 shadow-sm rounded-3 ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`} 
                    role="alert"
                >
                    <div className="d-flex align-items-center gap-2">
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="icon alert-icon text-success fs-3" />
                        ) : (
                            <AlertCircle className="icon alert-icon text-danger fs-3" />
                        )}
                        <div>
                            <h4 className="alert-title mb-0 fs-4">{notification.type === 'success' ? 'Panggilan Terkirim' : 'Peringatan'}</h4>
                            <div className="text-secondary small">{notification.text}</div>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="btn-close" 
                        aria-label="Close" 
                        onClick={() => setNotification(null)}
                    ></button>
                </div>
            )}

            {/* Unified Modern Active Queue Card */}
            <div 
                className="card border-0 shadow-sm overflow-hidden mb-4"
                style={{
                    borderRadius: '1.25rem',
                    background: '#FFFFFF',
                    boxShadow: '0 4px 24px -2px rgba(12, 124, 112, 0.08), 0 2px 8px -2px rgba(17, 41, 38, 0.04)'
                }}
            >
                {/* Card Header with Integrated Room Filter & Priority Legend */}
                <div 
                    className="p-4 bg-white"
                    style={{ borderBottom: '1px solid rgba(12, 124, 112, 0.08)' }}
                >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                        <div>
                            <div className="d-flex align-items-center gap-2.5">
                                <h3 className="fw-black text-dark m-0 fs-2" style={{ letterSpacing: '-0.02em' }}>
                                    Daftar Antrean Aktif
                                </h3>
                                <span 
                                    className="badge px-3 py-1.5 fw-bold"
                                    style={{
                                        background: '#E6F4F1',
                                        color: '#0C7C70',
                                        borderRadius: 9999,
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    {filteredQueue.length} Pasien
                                </span>
                            </div>
                            <p className="text-secondary small mb-0 mt-1">
                                Urutan pelayanan ditentukan secara otomatis melalui Medical Priority Scheduling dan waktu kedatangan pasien (FIFO).
                            </p>
                        </div>

                        {/* Dokter & Ruangan Praktik Tunggal */}
                        <div className="d-flex align-items-center gap-2 px-3 py-1.5 bg-light rounded-3" style={{ border: '1px solid #E2E8F0' }}>
                            <span className="status-dot status-dot-animated bg-green"></span>
                            <span className="small fw-bold text-dark">drg. Febri, Sp.KG</span>
                            <span className="text-secondary">•</span>
                            <span className="badge bg-teal-lt text-teal fw-bold">Ruang Periksa Gigi</span>
                        </div>
                    </div>

                    {/* Priority Legend Bar */}
                    <div className="d-flex align-items-center gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                        <span className="text-secondary small fw-semibold me-1">Urutan Prioritas:</span>
                        <span className="badge px-2.5 py-1 fw-bold" style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 9999, fontSize: '0.74rem' }}>
                            1. Darurat (100)
                        </span>
                        <span className="badge px-2.5 py-1 fw-bold" style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 9999, fontSize: '0.74rem' }}>
                            2. Lansia (75)
                        </span>
                        <span className="badge px-2.5 py-1 fw-bold" style={{ background: '#E0F2FE', color: '#0284C7', borderRadius: 9999, fontSize: '0.74rem' }}>
                            3. Anak (50)
                        </span>
                        <span className="badge px-2.5 py-1 fw-bold" style={{ background: '#E6F4F1', color: '#0C7C70', borderRadius: 9999, fontSize: '0.74rem' }}>
                            4. Reguler (10)
                        </span>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover mb-0">
                        <thead>
                            <tr className="bg-light">
                                <th className="w-1 text-center font-weight-bold">Urutan</th>
                                <th className="font-weight-bold">Nomor Tiket</th>
                                <th className="font-weight-bold">Nama Pasien</th>
                                <th className="font-weight-bold">Layanan &amp; Dokter</th>
                                <th className="font-weight-bold">Ruangan Poli</th>
                                <th className="font-weight-bold text-center">Prioritas</th>
                                <th className="font-weight-bold">Jam Check-In</th>
                                <th className="font-weight-bold text-center">Status</th>
                                <th className="font-weight-bold text-end">Aksi Pemanggilan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-5 text-center">
                                        <div className="empty py-4">
                                            <div className="empty-icon text-muted mb-3">
                                                <Users style={{ width: 48, height: 48, opacity: 0.35 }} />
                                            </div>
                                            <p className="empty-title fw-bold fs-3 text-dark mb-1">
                                                Tidak ada antrean aktif pada ruangan ini
                                            </p>
                                            <p className="empty-subtitle text-secondary small mb-3" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                                                Pasien yang telah melakukan reservasi online perlu memvalidasi kehadirannya di resepsionis (via scanner QR/barcode) agar masuk ke urutan antrean aktif.
                                            </p>
                                            <div className="empty-action">
                                                <Link href="/admin/scan" className="btn btn-primary d-inline-flex align-items-center gap-1.5 shadow-sm">
                                                    <QrCode className="icon" />
                                                    <span>Buka Menu Scan Kehadiran</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((item, idx) => {
                                    const priorityStyle = getPriorityBadge(item.priority);
                                    const isCalled = item.status === 'dipanggil';

                                    return (
                                        <tr 
                                            key={item.id}
                                            className={isCalled ? 'table-warning' : ''}
                                        >
                                            {/* Urutan */}
                                            <td className="text-center fw-bold text-secondary">
                                                <span className="badge bg-secondary-lt fs-5">
                                                    #{idx + 1}
                                                </span>
                                            </td>

                                            {/* No Tiket */}
                                            <td>
                                                <div className="fw-black fs-3 text-primary font-monospace lh-1">
                                                    {item.ticket_number}
                                                </div>
                                                <div className="text-secondary small font-monospace mt-0.5" style={{ fontSize: '11px' }}>
                                                    {item.qr_code}
                                                </div>
                                            </td>

                                            {/* Pasien */}
                                            <td>
                                                <div className="fw-bold text-dark">{item.patient_name}</div>
                                                <div className="text-secondary small font-monospace" style={{ fontSize: '11px' }}>
                                                    {item.patient_phone || '-'}
                                                </div>
                                            </td>

                                            {/* Layanan & Dokter */}
                                            <td>
                                                <div className="fw-medium text-dark">{item.service}</div>
                                                <div className="text-secondary small" style={{ fontSize: '11px' }}>
                                                    {item.doctor}
                                                </div>
                                            </td>

                                            {/* Ruangan */}
                                            <td>
                                                <span className="badge bg-blue-lt text-blue px-2.5 py-1">
                                                    {item.room}
                                                </span>
                                            </td>

                                            {/* Kategori Prioritas */}
                                            <td className="text-center">
                                                <span className={`badge ${priorityStyle.badgeClass} px-2.5 py-1 fs-6 fw-bold`}>
                                                    {priorityStyle.icon}
                                                    {item.priority}
                                                </span>
                                            </td>

                                            {/* Jam Hadir */}
                                            <td className="text-secondary font-monospace small">
                                                {item.checked_in_at 
                                                    ? new Date(item.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                                                    : '-'
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="text-center">
                                                {isCalled ? (
                                                    <span className="badge bg-warning text-white px-2.5 py-1 fs-6 fw-bold animate-pulse">
                                                        <Bell className="icon icon-inline me-1" />
                                                        DIPANGGIL
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary-lt text-secondary px-2.5 py-1 fs-6">
                                                        Menunggu
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi Pemanggilan */}
                                            <td className="text-end">
                                                <div className="btn-list justify-content-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCall(item.id, item.ticket_number, item.room)}
                                                        disabled={actionLoading === item.id}
                                                        className="btn btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm text-white"
                                                        style={{
                                                            borderRadius: 8,
                                                            background: isCalled ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                            border: 'none',
                                                            padding: '6px 14px',
                                                            fontWeight: 600,
                                                            fontSize: '0.82rem'
                                                        }}
                                                        title="Panggil nomor antrean ini ke speaker dan layar TV"
                                                    >
                                                        <Bell size={14} className={isCalled ? 'animate-bounce' : ''} />
                                                        <span>{isCalled ? 'Panggil Ulang' : 'Panggil'}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleComplete(item.id, item.ticket_number)}
                                                        disabled={actionLoading === item.id}
                                                        className="btn btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm text-white"
                                                        style={{
                                                            borderRadius: 8,
                                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                            border: 'none',
                                                            padding: '6px 14px',
                                                            fontWeight: 600,
                                                            fontSize: '0.82rem'
                                                        }}
                                                        title="Selesaikan pemeriksaan pasien"
                                                    >
                                                        <Check size={14} />
                                                        <span>Selesai</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card-footer d-flex align-items-center justify-content-between py-2 bg-light border-top text-secondary small">
                    <div>
                        Menampilkan <strong>{filteredQueue.length}</strong> pasien aktif dalam antrean.
                    </div>
                    <div>
                        Sinkronisasi otomatis setiap 4 detik.
                    </div>
                </div>
            </div>

            {/* Modal Pengaturan Suara Text-to-Speech & Bel */}
            <AudioSettingsModal
                isOpen={showAudioModal}
                onClose={() => setShowAudioModal(false)}
            />
        </AppLayout>
    );
}
