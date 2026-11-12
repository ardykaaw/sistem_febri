import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="page page-center" style={{ backgroundColor: '#F0F7F4' }}>
            <div className="container container-tight py-4">
                {/* Logo & Brand Header */}
                <div className="text-center mb-4">
                    <Link href={home()} className="d-inline-flex flex-column align-items-center text-decoration-none">
                        <div 
                            className="d-flex align-items-center justify-content-center text-white mb-2 shadow-sm"
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                backgroundColor: '#0C7C70',
                            }}
                        >
                            {/* Klinik Wansha Tooth Logo SVG */}
                            <svg viewBox="0 0 32 32" style={{ width: 32, height: 32, fill: '#FFFFFF' }} aria-hidden="true">
                                <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                            </svg>
                        </div>
                        <h1 className="h2 mb-0 fw-bold" style={{ color: '#173F3C' }}>Klinik Gigi Wansha</h1>
                        <span className="text-secondary small">Sistem Antrean Cerdas &amp; Reservasi Online</span>
                    </Link>
                </div>

                {/* Tabler Card */}
                <div className="card card-md shadow-sm border-0">
                    <div className="card-body">
                        {title && (
                            <h2 className="card-title text-center mb-1 fs-3 fw-bold" style={{ color: '#173F3C' }}>
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-secondary text-center small mb-4">
                                {description}
                            </p>
                        )}
                        {children}
                    </div>
                </div>

                {/* Bottom Back Link & Trust Badge */}
                <div className="text-center text-secondary mt-4 small">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <ShieldCheck className="icon text-primary" />
                        <span>Data Reservasi Terenkripsi &amp; Aman</span>
                    </div>
                    <Link href={home()} className="text-secondary text-decoration-none d-inline-flex align-items-center gap-1">
                        <ArrowLeft className="icon icon-inline" />
                        <span>Kembali ke Beranda Utama</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
