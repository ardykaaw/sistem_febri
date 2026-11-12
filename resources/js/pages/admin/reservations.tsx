import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    Search, 
    CheckCircle2, 
    Clock, 
    RefreshCw, 
    ShieldAlert, 
    HeartPulse, 
    QrCode, 
    Users,
    Phone,
    Check,
    Sparkles
} from 'lucide-react';

interface ReservationItem {
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
    status: string;
    created_at: string;
    checked_in_at: string | null;
}

export default function Reservations() {
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/queue/live');
            const data = await res.json();
            if (data.success) {
                // Combine all lists from live queue to form complete reservation history
                const all: ReservationItem[] = [
                    ...(data.active_queue || []),
                    ...(data.unvalidated_reservations || []),
                    ...(data.finished_today || []),
                ];
                // remove duplicate IDs if any
                const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
                // sort by ticket number
                unique.sort((a, b) => a.ticket_number.localeCompare(b.ticket_number));
                setReservations(unique);
            }
        } catch (err) {
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
        const interval = setInterval(fetchReservations, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleManualValidate = async (qrCode: string, patientName: string) => {
        try {
            const res = await fetch('/api/queue/validate-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: qrCode }),
            });
            const data = await res.json();
            if (data.success) {
                setNotification(`Kehadiran ${patientName} berhasil divalidasi manual ke dalam antrean aktif!`);
                setTimeout(() => setNotification(null), 4000);
                fetchReservations();
            } else {
                alert(data.message || 'Gagal memvalidasi.');
            }
        } catch {
            alert('Kesalahan server saat memvalidasi.');
        }
    };

    const filteredReservations = reservations.filter((item) => {
        const query = search.toLowerCase();
        const matchesQuery = 
            item.patient_name.toLowerCase().includes(query) ||
            item.ticket_number.toLowerCase().includes(query) ||
            (item.patient_phone && item.patient_phone.toLowerCase().includes(query)) ||
            (item.qr_code && item.qr_code.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        if (statusFilter === 'pending') return !item.is_checked_in;
        if (statusFilter === 'checked_in') return item.is_checked_in && item.status !== 'selesai';
        if (statusFilter === 'completed') return item.status === 'selesai';
        return true;
    });

    const pendingCount = reservations.filter((r) => !r.is_checked_in).length;
    const activeCount = reservations.filter((r) => r.is_checked_in && r.status !== 'selesai').length;

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'Darurat':
                return 'bg-red-lt text-red';
            case 'Lansia':
                return 'bg-yellow-lt text-yellow';
            case 'Anak':
                return 'bg-azure-lt text-azure';
            default:
                return 'bg-teal-lt text-teal';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Data Reservasi', href: '/admin/reservasi' }]}>
            <Head title="Data Reservasi Pasien - Klinik Wansha" />

            {/* Page Header */}
            <div className="page-header d-print-none mb-4">
                <div className="row g-2 align-items-center">
                    <div className="col">
                        <div className="page-pretitle text-secondary fw-bold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                            Rekap Data Pendaftaran Pasien Online
                        </div>
                        <h2 className="page-title d-flex align-items-center gap-2 fw-black" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                            <div 
                                className="d-flex align-items-center justify-content-center text-white"
                                style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)' }}
                            >
                                <ClipboardList size={20} />
                            </div>
                            <span>Data Reservasi Pasien</span>
                            <span className="badge px-3 py-1 fs-6 fw-bold" style={{ background: '#E6F4F1', color: '#0C7C70', borderRadius: 9999 }}>
                                {reservations.length} Terdaftar Hari Ini
                            </span>
                        </h2>
                    </div>
                    <div className="col-auto ms-auto d-print-none">
                        <div className="btn-list">
                            <Link
                                href="/admin/scan"
                                className="btn d-none d-sm-inline-flex align-items-center gap-2 fw-semibold"
                                style={{
                                    background: '#FFFFFF',
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: 10,
                                    color: '#0C7C70',
                                    padding: '8px 16px',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <QrCode size={18} />
                                <span>Buka Scanner QR</span>
                            </Link>
                            <button
                                onClick={fetchReservations}
                                disabled={loading}
                                className="btn d-inline-flex align-items-center gap-2 text-white fw-bold shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '8px 18px',
                                    boxShadow: '0 4px 14px -2px rgba(12, 124, 112, 0.35)'
                                }}
                            >
                                <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                                <span>Segarkan Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Alert */}
            {notification && (
                <div 
                    className="alert alert-dismissible mb-4 shadow-sm" 
                    role="alert"
                    style={{
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 14,
                        padding: '14px 18px'
                    }}
                >
                    <div className="d-flex align-items-center gap-3">
                        <div 
                            className="d-flex align-items-center justify-content-center text-white flex-shrink-0"
                            style={{ width: 36, height: 36, borderRadius: 10, background: '#10B981' }}
                        >
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h4 className="alert-title mb-0 fw-bold" style={{ color: '#065F46' }}>Validasi Berhasil</h4>
                            <div className="small" style={{ color: '#047857' }}>{notification}</div>
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

            {/* Unified Modern Reservations Card */}
            <div 
                className="card border-0 shadow-sm overflow-hidden mb-4"
                style={{
                    borderRadius: '1.25rem',
                    background: '#FFFFFF',
                    boxShadow: '0 4px 24px -2px rgba(12, 124, 112, 0.08), 0 2px 8px -2px rgba(17, 41, 38, 0.04)'
                }}
            >
                {/* Integrated Search & Filter Controls in Card Header */}
                <div className="p-4 bg-white" style={{ borderBottom: '1px solid rgba(12, 124, 112, 0.08)' }}>
                    <div className="row g-3 align-items-center justify-content-between">
                        <div className="col-lg-5 col-md-6">
                            <div className="input-icon">
                                <span className="input-icon-addon ps-3">
                                    <Search size={18} className="text-secondary" />
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama pasien, no tiket, atau HP..."
                                    className="form-control"
                                    style={{
                                        borderRadius: 10,
                                        border: '1.5px solid #E2E8F0',
                                        padding: '10px 14px 10px 42px',
                                        fontSize: '0.9rem',
                                        background: '#F8FAFC'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="col-lg-auto col-md-auto">
                            <div className="d-flex align-items-center gap-1.5 p-1 bg-light rounded-3" style={{ border: '1px solid #E2E8F0' }}>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className="btn btn-sm fw-bold px-3 py-1.5 transition-all"
                                    style={{
                                        borderRadius: 8,
                                        background: statusFilter === 'all' ? '#0C7C70' : 'transparent',
                                        color: statusFilter === 'all' ? '#FFFFFF' : '#64748B',
                                        border: 'none',
                                        boxShadow: statusFilter === 'all' ? '0 2px 8px rgba(12, 124, 112, 0.3)' : 'none',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    Semua ({reservations.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('pending')}
                                    className="btn btn-sm fw-bold px-3 py-1.5 transition-all"
                                    style={{
                                        borderRadius: 8,
                                        background: statusFilter === 'pending' ? '#F59E0B' : 'transparent',
                                        color: statusFilter === 'pending' ? '#FFFFFF' : '#64748B',
                                        border: 'none',
                                        boxShadow: statusFilter === 'pending' ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    Belum Check-In ({pendingCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('checked_in')}
                                    className="btn btn-sm fw-bold px-3 py-1.5 transition-all"
                                    style={{
                                        borderRadius: 8,
                                        background: statusFilter === 'checked_in' ? '#10B981' : 'transparent',
                                        color: statusFilter === 'checked_in' ? '#FFFFFF' : '#64748B',
                                        border: 'none',
                                        boxShadow: statusFilter === 'checked_in' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    Sudah Hadir ({activeCount})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover table-striped">
                        <thead>
                            <tr className="bg-light">
                                <th className="font-weight-bold">No. Tiket</th>
                                <th className="font-weight-bold">Kode QR</th>
                                <th className="font-weight-bold">Nama Pasien</th>
                                <th className="font-weight-bold">Kontak HP</th>
                                <th className="font-weight-bold">Layanan &amp; Dokter</th>
                                <th className="font-weight-bold">Ruangan Poli</th>
                                <th className="font-weight-bold text-center">Prioritas</th>
                                <th className="font-weight-bold text-center">Status Kehadiran</th>
                                <th className="font-weight-bold text-end">Aksi Petugas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-5 text-center">
                                        <div className="empty">
                                            <div className="empty-icon text-muted">
                                                <ClipboardList style={{ width: 48, height: 48, opacity: 0.4 }} />
                                            </div>
                                            <p className="empty-title fw-bold">Tidak ada data reservasi</p>
                                            <p className="empty-subtitle text-secondary">
                                                Tidak ditemukan reservasi yang sesuai dengan kata kunci pencarian atau filter status.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map((item) => (
                                    <tr key={item.id}>
                                        {/* No. Tiket */}
                                        <td>
                                            <div className="fw-black fs-4 text-primary font-monospace">
                                                {item.ticket_number}
                                            </div>
                                        </td>

                                        {/* Kode QR */}
                                        <td className="font-monospace text-secondary small">
                                            {item.qr_code}
                                        </td>

                                        {/* Nama Pasien */}
                                        <td>
                                            <div className="fw-bold text-dark">{item.patient_name}</div>
                                        </td>

                                        {/* Kontak HP */}
                                        <td className="font-monospace text-secondary small">
                                            {item.patient_phone || '-'}
                                        </td>

                                        {/* Layanan & Dokter */}
                                        <td>
                                            <div className="fw-medium text-dark">{item.service}</div>
                                            <div className="text-secondary small">{item.doctor}</div>
                                        </td>

                                        {/* Ruangan */}
                                        <td>
                                            <span className="badge bg-blue-lt text-blue">
                                                {item.room}
                                            </span>
                                        </td>

                                        {/* Prioritas */}
                                        <td className="text-center">
                                            <span className={`badge ${getPriorityBadge(item.priority)} px-2.5 py-1 fs-6 fw-bold`}>
                                                {item.priority}
                                            </span>
                                        </td>

                                        {/* Status Kehadiran */}
                                        <td className="text-center">
                                            {item.is_checked_in ? (
                                                <span className="badge bg-success-lt text-success px-2.5 py-1 fs-6 fw-bold">
                                                    <Check className="icon icon-inline me-1" />
                                                    Sudah Hadir
                                                </span>
                                            ) : (
                                                <span className="badge bg-warning-lt text-warning px-2.5 py-1 fs-6 fw-bold">
                                                    <Clock className="icon icon-inline me-1" />
                                                    Menunggu Check-In
                                                </span>
                                            )}
                                        </td>

                                        {/* Aksi Petugas */}
                                        <td className="text-end">
                                            {!item.is_checked_in ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleManualValidate(item.qr_code, item.patient_name)}
                                                    className="btn btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm text-white"
                                                    style={{
                                                        borderRadius: 8,
                                                        background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                        border: 'none',
                                                        padding: '6px 14px',
                                                        fontWeight: 600,
                                                        fontSize: '0.82rem',
                                                        boxShadow: '0 2px 6px -1px rgba(12, 124, 112, 0.3)'
                                                    }}
                                                    title="Validasi kehadiran manual jika pasien tiba di klinik"
                                                >
                                                    <CheckCircle2 size={15} />
                                                    <span>Validasi Hadir</span>
                                                </button>
                                            ) : (
                                                <span className="badge bg-secondary-lt text-secondary font-monospace">
                                                    {item.checked_in_at 
                                                        ? new Date(item.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                                                        : 'Aktif'
                                                    }
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card-footer d-flex align-items-center justify-content-between py-2 bg-light border-top text-secondary small">
                    <div>
                        Menampilkan <strong>{filteredReservations.length}</strong> data reservasi.
                    </div>
                    <div>
                        Sistem antrean sinkron otomatis secara berkala.
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
