import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';
import ChatbotWidget from '@/components/chatbot-widget';
import { 
    LayoutDashboard, 
    ListOrdered, 
    QrCode, 
    ClipboardList, 
    Home, 
    LogOut, 
    User, 
    Clock, 
    Menu, 
    X,
    Ticket,
    Shield,
    PhoneCall,
    Tv,
    Sparkles
} from 'lucide-react';

interface TablerLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function TablerLayout({ children, breadcrumbs = [] }: TablerLayoutProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;
    const isAdmin = currentUser?.role === 'admin';

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
            );
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    const adminNavItems = [
        {
            title: 'Dashboard Utama',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Manajemen Antrean',
            href: '/admin/antrean',
            icon: ListOrdered,
        },
        {
            title: 'Scan Kehadiran',
            href: '/admin/scan',
            icon: QrCode,
        },
        {
            title: 'Data Reservasi',
            href: '/admin/reservasi',
            icon: ClipboardList,
        },
        {
            title: 'Layar TV Monitor',
            href: '/display',
            icon: Tv,
            newTab: true,
        },
        {
            title: 'Halaman Beranda',
            href: '/',
            icon: Home,
        },
    ];

    const patientNavItems = [
        {
            title: 'Tiket & Antrean Saya',
            href: '/dashboard',
            icon: Ticket,
        },
        {
            title: 'Tanya Asisten AI (Vani)',
            href: '#chat',
            icon: Sparkles,
            isChat: true,
        },
        {
            title: 'Halaman Beranda',
            href: '/',
            icon: Home,
        },
    ];

    const navItems = isAdmin ? adminNavItems : patientNavItems;

    const isActive = (href: string) => {
        if (href === '/dashboard' && currentPath === '/dashboard') return true;
        if (href !== '/' && href !== '/dashboard' && currentPath.startsWith(href)) return true;
        if (href === '/' && currentPath === '/') return true;
        return false;
    };

    return (
        <div className="page">
            {/* Mobile Top Navigation Bar (Only on mobile < 992px) */}
            <div className="mobile-top-bar d-flex d-lg-none align-items-center justify-content-between px-3 py-2 w-100 shadow-sm">
                <Link href="/dashboard" className="d-flex align-items-center text-decoration-none gap-2">
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-3 shadow-sm text-white" 
                        style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                    >
                        <svg viewBox="0 0 32 32" style={{ width: 20, height: 20, fill: 'white' }} aria-hidden="true">
                            <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                        </svg>
                    </div>
                    <div className="text-start">
                        <span className="d-block fw-bold fs-4 text-white lh-1">Klinik Wansha</span>
                        <span className="d-block small" style={{ fontSize: '10px', color: '#97AEA9' }}>
                            {isAdmin ? 'Panel Admin' : 'Portal Pasien'}
                        </span>
                    </div>
                </Link>

                <div className="d-flex align-items-center gap-2">
                    {isAdmin ? (
                        <span className="badge bg-yellow-lt py-1 px-2 fw-bold" style={{ fontSize: '10px' }}>Admin</span>
                    ) : (
                        <span className="badge bg-teal-lt py-1 px-2 fw-bold" style={{ fontSize: '10px' }}>Pasien</span>
                    )}
                    <button
                        className="btn btn-icon btn-sm text-white border-0"
                        type="button"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Buka Menu Navigasi"
                    >
                        <Menu style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="mobile-sidebar-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Tabler Vertical Sidebar (Offcanvas on Mobile, Fixed on Desktop) */}
            <aside 
                className={`navbar navbar-vertical navbar-expand-lg ${mobileMenuOpen ? 'mobile-drawer-open' : ''}`} 
                data-bs-theme="dark" 
                style={{ 
                    backgroundColor: '#112926',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}
            >
                <div className="container-fluid px-3 py-3 flex-column align-items-stretch h-100">
                    {/* Top Row: Brand & Close Button */}
                    <div className="d-flex align-items-center justify-content-between w-100 pb-3 border-bottom border-white-subtle">
                        <Link 
                            href="/dashboard" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="d-flex align-items-center text-decoration-none gap-2"
                        >
                            <div 
                                className="d-flex align-items-center justify-content-center rounded-3 shadow-sm text-white" 
                                style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #0C7C70, #08554D)' }}
                            >
                                <svg viewBox="0 0 32 32" style={{ width: 22, height: 22, fill: 'white' }} aria-hidden="true">
                                    <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                                </svg>
                            </div>
                            <div className="text-start">
                                <span className="d-block fw-black fs-3 text-white lh-1">Klinik Wansha</span>
                                <span className="d-block text-secondary small mt-0.5" style={{ fontSize: '11px', color: '#97AEA9' }}>
                                    Antrean &amp; Poli Gigi
                                </span>
                            </div>
                        </Link>

                        {/* Mobile Close Button */}
                        <button
                            className="btn btn-sm btn-icon text-white-50 border-0 d-lg-none"
                            type="button"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Tutup menu"
                        >
                            <X style={{ width: 18, height: 18 }} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div 
                        className="navbar-collapse flex-column align-items-stretch w-100 mt-3" 
                        id="sidebar-menu"
                        style={{ flexGrow: 1 }}
                    >
                        <div className="text-uppercase fw-bold px-3 py-1 mb-1" style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#7E9F97' }}>
                            {isAdmin ? 'Menu Administrator' : 'Menu Pasien'}
                        </div>

                        <ul className="navbar-nav d-flex flex-column gap-1 p-0 m-0 w-100" style={{ listStyle: 'none' }}>
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;
                                const isExternal = 'newTab' in item && item.newTab;
                                const isChat = 'isChat' in item && item.isChat;

                                if (isChat) {
                                    return (
                                        <li key={item.title} className="nav-item w-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    window.dispatchEvent(new CustomEvent('open-chatbot'));
                                                }}
                                                className="nav-link w-100 d-flex align-items-center gap-2 px-3 py-2 rounded-2 text-decoration-none border-0 text-start"
                                                style={{
                                                    color: '#A3C2BB',
                                                    backgroundColor: 'transparent',
                                                    fontSize: '13px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <span className="nav-link-icon d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, color: '#20C997' }}>
                                                    <Sparkles style={{ width: 18, height: 18 }} />
                                                </span>
                                                <span className="nav-link-title flex-grow-1">
                                                    {item.title}
                                                </span>
                                                <span className="badge bg-teal-lt text-teal" style={{ fontSize: '9px' }}>AI</span>
                                            </button>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.href} className="nav-item w-100">
                                        {isExternal ? (
                                             <a 
                                                href={item.href} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="nav-link w-100 d-flex align-items-center gap-2 px-3 py-2 rounded-2 text-decoration-none"
                                                style={{ color: '#A3C2BB', fontSize: '13px' }}
                                            >
                                                <span className="nav-link-icon d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, color: '#20C997' }}>
                                                    <Icon style={{ width: 18, height: 18 }} />
                                                </span>
                                                <span className="nav-link-title flex-grow-1">
                                                    {item.title}
                                                </span>
                                                <span className="badge bg-teal-lt text-teal" style={{ fontSize: '9px' }}>Baru</span>
                                            </a>
                                        ) : (
                                            <Link 
                                                href={item.href} 
                                                className="nav-link w-100 d-flex align-items-center gap-2 px-3 py-2 rounded-2 text-decoration-none transition-all"
                                                style={{
                                                    color: active ? '#ffffff' : '#A3C2BB',
                                                    backgroundColor: active ? 'rgba(12, 124, 112, 0.45)' : 'transparent',
                                                    borderLeft: active ? '3.5px solid #20C997' : '3.5px solid transparent',
                                                    fontWeight: active ? '700' : '500',
                                                    fontSize: '13px',
                                                }}
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <span className="nav-link-icon d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, color: active ? '#20C997' : '#7E9F97' }}>
                                                    <Icon style={{ width: 18, height: 18 }} />
                                                </span>
                                                <span className="nav-link-title">
                                                    {item.title}
                                                </span>
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Clean User Profile & Logout at Bottom of Sidebar (Klinik Beroperasi Card removed per user request) */}
                        <div className="mt-auto pt-3 border-top border-white-subtle w-100">
                            <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                    <div 
                                        className="avatar avatar-xs rounded-circle text-white fw-bold shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #0C7C70, #08554D)', width: 32, height: 32, fontSize: '11px' }}
                                    >
                                        {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'KW'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-white small fw-bold text-truncate" style={{ fontSize: '12px' }}>
                                            {currentUser?.name || 'Pengguna'}
                                        </div>
                                        <div className="text-secondary small text-truncate" style={{ fontSize: '10px', color: '#88AAA1' }}>
                                            {isAdmin ? '👑 Administrator' : '👤 Pasien Terdaftar'}
                                        </div>
                                    </div>
                                </div>
                                <form onSubmit={handleLogout}>
                                    <button 
                                        type="submit" 
                                        className="btn btn-icon btn-ghost-danger btn-sm p-1.5 text-danger-subtle rounded-2" 
                                        title="Keluar dari akun"
                                    >
                                        <LogOut style={{ width: 15, height: 15 }} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Top Navbar Header */}
            <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none bg-white border-bottom shadow-2xs py-2">
                <div className="container-xl d-flex align-items-center justify-content-between">
                    {/* Breadcrumbs */}
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 py-1">
                            {breadcrumbs.length > 0 ? (
                                breadcrumbs.map((b, idx) => (
                                    <li key={b.href} className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active fw-bold text-dark' : 'text-secondary'}`}>
                                        {idx === breadcrumbs.length - 1 ? (
                                            <span>{b.title}</span>
                                        ) : (
                                            <Link href={b.href} className="text-secondary text-decoration-none hover:text-primary">
                                                {b.title}
                                            </Link>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="breadcrumb-item active fw-bold text-dark">
                                    <span>Dashboard</span>
                                </li>
                            )}
                        </ol>
                    </nav>

                    {/* Right Utilities & User Profile */}
                    <div className="d-flex align-items-center gap-3">
                        {/* Live Clock */}
                        <div className="d-flex align-items-center gap-1.5 text-secondary small bg-light px-3 py-1.5 rounded-pill border">
                            <Clock style={{ width: 14, height: 14, color: '#0C7C70' }} />
                            <span className="fw-bold font-monospace text-dark" style={{ fontSize: '12px' }}>{currentTime}</span>
                        </div>

                        {/* Role Badge */}
                        {isAdmin ? (
                            <span className="badge bg-yellow-lt fw-bold border-yellow px-2.5 py-1.5" style={{ fontSize: '11px' }}>
                                👑 Administrator
                            </span>
                        ) : (
                            <span className="badge bg-teal-lt fw-bold px-2.5 py-1.5" style={{ fontSize: '11px' }}>
                                👤 Pasien Terdaftar
                            </span>
                        )}

                        {/* User Profile Pill */}
                        <div className="d-flex align-items-center gap-2 ps-3 border-start">
                            <div 
                                className="avatar avatar-sm rounded-circle text-white fw-bold"
                                style={{ background: 'linear-gradient(135deg, #0C7C70, #08554D)', width: 34, height: 34 }}
                            >
                                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'KW'}
                            </div>
                            <div className="text-start d-none d-xl-block">
                                <div className="fw-bold small lh-1 text-dark">{currentUser?.name || 'Pengguna'}</div>
                                <div className="text-secondary small font-monospace mt-0.5" style={{ fontSize: '11px' }}>
                                    {currentUser?.email || ''}
                                </div>
                            </div>

                            <form onSubmit={handleLogout} className="ms-1">
                                <button 
                                    type="submit" 
                                    className="btn btn-ghost-danger btn-icon btn-sm" 
                                    title="Keluar dari akun"
                                >
                                    <LogOut style={{ width: 16, height: 16 }} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Wrapper */}
            <div className="page-wrapper" style={{ backgroundColor: '#F4F7F6', minHeight: '100vh' }}>
                <div className="page-body py-4">
                    <div className="container-xl">
                        {children}
                    </div>
                </div>

                {/* Tabler Clean Footer */}
                <footer className="footer footer-transparent d-print-none border-top py-3 mt-auto bg-white">
                    <div className="container-xl">
                        <div className="row text-center align-items-center flex-row-reverse">
                            <div className="col-lg-auto ms-lg-auto">
                                <ul className="list-inline list-inline-dots mb-0 small text-secondary">
                                    <li className="list-inline-item">
                                        <a href="/#antrean" className="link-secondary text-decoration-none">Status Antrean</a>
                                    </li>
                                    <li className="list-inline-item">
                                        <a href="/#layanan" className="link-secondary text-decoration-none">Layanan Gigi</a>
                                    </li>
                                    <li className="list-inline-item">
                                        <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="link-secondary text-decoration-none">
                                            Kontak Klinik
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="col-12 col-lg-auto mt-3 mt-lg-0 text-start">
                                <div className="small text-secondary">
                                    &copy; {new Date().getFullYear()}{' '}
                                    <strong className="text-dark">Klinik Gigi Wansha</strong>. Sistem Antrean Cerdas &amp; Layanan Poli Gigi.
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Asisten Virtual Chatbot Widget */}
            <ChatbotWidget />
        </div>
    );
}
