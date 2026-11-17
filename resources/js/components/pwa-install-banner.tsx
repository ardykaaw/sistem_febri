import React, { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, WifiOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // 1. Check if running in standalone mode (already installed)
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
                document.referrer.includes('android-app://');
            setIsStandalone(isStandaloneMode);
            return isStandaloneMode;
        };

        if (checkStandalone()) return;

        // 2. Check if iOS device
        const ua = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua);
        setIsIos(isIosDevice);

        // Check if dismissed in this session
        const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        // 3. Listen for BeforeInstallPrompt event (Android / Chromium)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const event = e as BeforeInstallPromptEvent;
            setDeferredPrompt(event);
            setIsInstallable(true);
        };

        // 4. App Installed listener
        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            setIsStandalone(true);
            toast.success('Aplikasi Wansha Dental Care berhasil dipasang!', {
                description: 'Anda sekarang dapat membuka antrian langsung dari layar utama.',
            });
        };

        // 5. Global trigger for manual install buttons elsewhere in UI
        const handleCustomTrigger = () => {
            if (deferredPrompt) {
                promptInstall();
            } else if (isIosDevice) {
                setShowIosGuide(true);
            } else {
                toast.info('Instalasi Aplikasi', {
                    description: 'Gunakan menu browser (titik tiga) lalu pilih "Install / Pasang Aplikasi".',
                });
            }
        };

        // 6. Online / Offline network listeners
        const handleOffline = () => {
            toast.error('Koneksi Terputus (Offline)', {
                icon: <WifiOff className="h-4 w-4 text-red-500" />,
                description: 'Aplikasi berjalan dalam mode offline dengan data tersimpan.',
                duration: 5000,
            });
        };

        const handleOnline = () => {
            toast.success('Koneksi Kembali Online', {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                description: 'Data antrian dan reservasi kembali sinkron otomatis.',
                duration: 4000,
            });
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('trigger-pwa-install', handleCustomTrigger);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [deferredPrompt]);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            if (isIos) {
                setShowIosGuide(true);
            }
            return;
        }

        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                setIsInstallable(false);
                setDeferredPrompt(null);
            }
        } catch (err) {
            console.error('Install prompt error:', err);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    // If already running as standalone app, don't show prompt
    if (isStandalone) {
        return null;
    }

    return (
        <>
            {/* Floating Install Banner for Android / Desktop */}
            {isInstallable && !isDismissed && (
                <div className="fixed bottom-20 left-4 z-40 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:left-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#0C7C70]/20 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-[#0C7C70]/30 dark:bg-slate-900/95">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0C7C70] to-[#08544C] text-white shadow-md">
                            <Download className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                Pasang Aplikasi
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Akses antrian klinik cepat & praktis tanpa browser.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={promptInstall}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C7C70] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#096359] active:scale-95"
                            >
                                Install
                            </button>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Safari Guide Modal */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0C7C70] text-white">
                                    <Download className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                    Pasang di iPhone / iPad
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0C7C70]/10 font-bold text-[#0C7C70]">1</span>
                                <p className="flex-1">
                                    Ketuk tombol <strong className="text-slate-800 dark:text-white">Bagikan (Share)</strong> <Share2 className="inline h-3.5 w-3.5 mx-1 text-blue-500" /> di bilah bawah browser Safari.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0C7C70]/10 font-bold text-[#0C7C70]">2</span>
                                <p className="flex-1">
                                    Gulir menu ke bawah lalu pilih <strong className="text-slate-800 dark:text-white">Tambah ke Layar Utama</strong> (Add to Home Screen) <PlusSquare className="inline h-3.5 w-3.5 mx-1 text-slate-700 dark:text-slate-300" />.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0C7C70]/10 font-bold text-[#0C7C70]">3</span>
                                <p className="flex-1">
                                    Ketuk tombol <strong className="text-slate-800 dark:text-white">Tambah</strong> di sudut kanan atas.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowIosGuide(false)}
                            className="mt-4 w-full rounded-xl bg-[#0C7C70] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#096359]"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default PwaInstallBanner;

