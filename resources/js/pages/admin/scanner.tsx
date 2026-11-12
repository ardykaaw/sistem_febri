import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
    QrCode, 
    Camera, 
    CameraOff, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    ArrowRight, 
    RefreshCw, 
    Users, 
    Keyboard,
    ShieldAlert,
    Clock,
    Check,
    Search,
    Tv,
    Barcode,
    FlipHorizontal,
    Video
} from 'lucide-react';

interface ValidationResult {
    success: boolean;
    message: string;
    ticket?: {
        ticket_number: string;
        patient_name: string;
        service: string;
        doctor: string;
        room: string;
        priority: string;
        qr_code: string;
        checked_in_at: string;
    };
    queue_position?: number;
    priority?: string;
    already_validated?: boolean;
}

export default function Scanner() {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannerMode, setScannerMode] = useState<'gun' | 'camera'>('gun');
    const [scanningCamera, setScanningCamera] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [isMirror, setIsMirror] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<string | null>(null);

    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [validating, setValidating] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingTickets, setPendingTickets] = useState<any[]>([]);
    const [pendingSearch, setPendingSearch] = useState('');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Fetch unvalidated reservations for simulation / quick check-in
    const fetchPending = async () => {
        try {
            const res = await fetch('/api/queue/live');
            const data = await res.json();
            if (data.success) {
                setPendingTickets(data.unvalidated_reservations || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Load available video input devices
    const loadDevices = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            setCameraDevices(videoInputs);
            if (videoInputs.length > 0 && !selectedDeviceId) {
                // Prefer environment/back camera if available, otherwise first camera
                const backCam = videoInputs.find(
                    (d) =>
                        d.label.toLowerCase().includes('back') ||
                        d.label.toLowerCase().includes('belakang') ||
                        d.label.toLowerCase().includes('rear') ||
                        d.label.toLowerCase().includes('environment')
                );
                setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
            }
        } catch (e) {
            console.warn('Gagal membaca daftar perangkat kamera:', e);
        }
    };

    // Stop camera stream safely
    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanningCamera(false);
        setCameraLoading(false);
    }, []);

    // Start camera with proper fallbacks
    const startCamera = async (deviceIdToUse?: string) => {
        stopCamera();
        setCameraLoading(true);
        setCameraError(null);

        const targetDeviceId = deviceIdToUse || selectedDeviceId;

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser Anda tidak mendukung akses kamera (WebRTC tidak tersedia). Gunakan browser modern (Chrome / Edge / Safari).');
            }

            let stream: MediaStream | null = null;

            // Strategy 1: specific device if selected
            if (targetDeviceId) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: targetDeviceId },
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    });
                } catch {
                    // Fallback if exact deviceId failed
                    stream = null;
                }
            }

            // Strategy 2: environment / any camera with ideal resolution
            if (!stream) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    });
                } catch {
                    // Strategy 3: basic fallback
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true
                    });
                }
            }

            streamRef.current = stream;
            setScanningCamera(true);
            setCameraLoading(false);

            // Re-enumerate devices now that permission is granted (to get real labels like "FaceTime HD Camera")
            loadDevices();
        } catch (err: any) {
            console.error('Camera access error:', err);
            let msg = 'Gagal mengakses kamera.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                msg = 'Izin kamera ditolak oleh browser. Silakan klik ikon gembok/kamera di address bar browser Anda, pilih "Izinkan", lalu coba lagi.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                msg = 'Perangkat kamera / webcam tidak ditemukan di laptop atau komputer Anda.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                msg = 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Teams, atau tab browser lain). Tutup aplikasi tersebut dan coba lagi.';
            } else if (err.message) {
                msg = err.message;
            }
            setCameraError(msg);
            setScanningCamera(false);
            setCameraLoading(false);
        }
    };

    // Attach stream to video element whenever videoRef or scanningCamera changes
    useEffect(() => {
        if (scanningCamera && streamRef.current && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = streamRef.current;
            video.onloadedmetadata = () => {
                video.play().catch((e) => console.log('Video play error:', e));
            };
        }
    }, [scanningCamera]);

    // High-performance Hybrid QR Decoder Loop: Native BarcodeDetector + adaptive jsQR
    useEffect(() => {
        if (!scanningCamera) {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
            return;
        }

        let isProcessing = false;

        // Try initializing Native BarcodeDetector if supported by Chromium/Edge
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let nativeDetector: any = null;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (window as any).BarcodeDetector !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            }
        } catch (e) {
            console.log('Native BarcodeDetector not available, using jsQR fallback:', e);
        }

        const scanFrame = async () => {
            if (isProcessing) return;
            if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

            const video = videoRef.current;
            isProcessing = true;

            try {
                let detectedCode: string | null = null;

                // Method 1: Ultra-fast Native BarcodeDetector (hardware-accelerated in Chrome)
                if (nativeDetector) {
                    try {
                        const barcodes = await nativeDetector.detect(video);
                        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                            detectedCode = barcodes[0].rawValue.trim();
                        }
                    } catch (err) {
                        // fallback to jsQR
                    }
                }

                // Method 2: jsQR Fallback with optimized downscaling and inversion
                if (!detectedCode && canvasRef.current) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                        // Downscale to 640px max dimension for optimal QR detection & anti-aliasing against screen moiré
                        const videoW = video.videoWidth || 640;
                        const videoH = video.videoHeight || 480;
                        const scale = Math.min(1, 640 / Math.max(videoW, videoH));
                        const targetW = Math.round(videoW * scale);
                        const targetH = Math.round(videoH * scale);

                        if (canvas.width !== targetW || canvas.height !== targetH) {
                            canvas.width = targetW;
                            canvas.height = targetH;
                        }

                        // Draw full frame
                        ctx.drawImage(video, 0, 0, targetW, targetH);
                        let imageData = ctx.getImageData(0, 0, targetW, targetH);
                        let qrResult = jsQR(imageData.data, targetW, targetH, {
                            inversionAttempts: 'attemptBoth',
                        });

                        // If not found in full frame, try focused center crop (where patient points the phone)
                        if (!qrResult || !qrResult.data) {
                            const cropSize = Math.round(Math.min(targetW, targetH) * 0.7);
                            const cropX = Math.round((targetW - cropSize) / 2);
                            const cropY = Math.round((targetH - cropSize) / 2);
                            const cropData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
                            qrResult = jsQR(cropData.data, cropSize, cropSize, {
                                inversionAttempts: 'attemptBoth',
                            });
                        }

                        if (qrResult && qrResult.data) {
                            detectedCode = qrResult.data.trim();
                        }
                    }
                }

                // Handle valid detection
                if (detectedCode) {
                    const now = Date.now();
                    // Debounce: prevent duplicate scan within 3 seconds for same ticket
                    if (detectedCode === lastScannedRef.current.code && now - lastScannedRef.current.time < 3000) {
                        isProcessing = false;
                        return;
                    }

                    lastScannedRef.current = { code: detectedCode, time: now };
                    setScanFeedback(detectedCode);
                    setTimeout(() => setScanFeedback(null), 3000);
                    handleValidate(detectedCode);
                }
            } catch (err) {
                console.warn('Frame scan error:', err);
            } finally {
                isProcessing = false;
            }
        };

        // Scan every 150ms for responsive and instant detection
        scanIntervalRef.current = setInterval(scanFrame, 150);

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
        };
    }, [scanningCamera]);

    // Play Beep on validation
    const playBeep = (isSuccess: boolean) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (isSuccess) {
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } else {
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch {
            // ignore audio restriction
        }
    };

    // Submit Barcode / QR
    const handleValidate = async (codeToValidate: string) => {
        const clean = codeToValidate.trim();
        if (!clean) return;

        setValidating(true);
        setValidationResult(null);

        try {
            const res = await fetch('/api/queue/validate-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: clean }),
            });
            const data: ValidationResult = await res.json();
            setValidationResult(data);
            setBarcodeInput('');
            fetchPending();
            playBeep(data.success);
        } catch {
            playBeep(false);
            setValidationResult({
                success: false,
                message: 'Terjadi kegagalan koneksi ke server saat memvalidasi.',
            });
        } finally {
            setValidating(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleSubmitInput = (e: React.FormEvent) => {
        e.preventDefault();
        handleValidate(barcodeInput);
    };

    const filteredPending = pendingTickets.filter((t) => {
        const q = pendingSearch.toLowerCase();
        return (
            t.patient_name.toLowerCase().includes(q) ||
            t.ticket_number.toLowerCase().includes(q) ||
            (t.qr_code && t.qr_code.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Scan Kehadiran', href: '/admin/scan' }]}>
            <Head title="Validasi Kehadiran Pasien (Check-In QR) - Klinik Wansha" />

            {/* Page Header */}
            <div className="page-header d-print-none mb-4">
                <div className="row g-2 align-items-center justify-content-between">
                    <div className="col">
                        <div className="page-pretitle text-secondary fw-bold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                            Meja Resepsionis &amp; Terminal Check-In Pasien
                        </div>
                        <h2 className="page-title d-flex align-items-center gap-2 fw-black" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                            <div 
                                className="d-flex align-items-center justify-content-center text-white"
                                style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)' }}
                            >
                                <QrCode size={20} />
                            </div>
                            <span>Scan Kehadiran Tiket Pasien</span>
                            <span className="badge px-3 py-1 fs-6 fw-bold" style={{ background: '#E6F4F1', color: '#0C7C70', borderRadius: 9999 }}>
                                Terminal Aktif
                            </span>
                        </h2>
                    </div>
                    <div className="col-auto ms-auto d-print-none">
                        <div className="btn-list">
                            <Link
                                href="/admin/antrean"
                                className="btn d-inline-flex align-items-center gap-2 text-white fw-bold shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                    borderRadius: 10,
                                    border: 'none',
                                    padding: '8px 18px',
                                    boxShadow: '0 4px 14px -2px rgba(12, 124, 112, 0.35)'
                                }}
                            >
                                <Users size={17} />
                                <span>Lihat Manajemen Antrean</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interactive Station Grid */}
            <div className="row row-cards g-4">
                {/* Left Column (7 cols): Unified Scanner Station */}
                <div className="col-lg-7">
                    <div 
                        className="card border-0 shadow-sm overflow-hidden mb-4"
                        style={{
                            borderRadius: '1.25rem',
                            background: '#FFFFFF',
                            boxShadow: '0 4px 24px -2px rgba(12, 124, 112, 0.08)'
                        }}
                    >
                        {/* Scanner Mode Toggle Bar */}
                        <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                            <div className="d-flex gap-1.5 p-1 bg-white rounded-3 shadow-2xs border">
                                <button
                                    type="button"
                                    onClick={() => setScannerMode('gun')}
                                    className="btn btn-sm fw-bold px-3 py-1.5 d-inline-flex align-items-center gap-2 transition-all"
                                    style={{
                                        borderRadius: 8,
                                        background: scannerMode === 'gun' ? '#0C7C70' : 'transparent',
                                        color: scannerMode === 'gun' ? '#FFFFFF' : '#64748B',
                                        border: 'none',
                                        boxShadow: scannerMode === 'gun' ? '0 2px 8px rgba(12, 124, 112, 0.3)' : 'none'
                                    }}
                                >
                                    <Barcode size={16} />
                                    <span>Scanner Barcode USB / Input</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScannerMode('camera');
                                        if (!scanningCamera) {
                                            startCamera();
                                        }
                                    }}
                                    className="btn btn-sm fw-bold px-3 py-1.5 d-inline-flex align-items-center gap-2 transition-all"
                                    style={{
                                        borderRadius: 8,
                                        background: scannerMode === 'camera' ? '#0C7C70' : 'transparent',
                                        color: scannerMode === 'camera' ? '#FFFFFF' : '#64748B',
                                        border: 'none',
                                        boxShadow: scannerMode === 'camera' ? '0 2px 8px rgba(12, 124, 112, 0.3)' : 'none'
                                    }}
                                >
                                    <Camera size={16} />
                                    <span>Kamera Web QR</span>
                                </button>
                            </div>

                            <span className="badge px-2.5 py-1 fw-bold d-none d-sm-inline-flex align-items-center gap-1.5" style={{ background: '#E6F4F1', color: '#0C7C70', borderRadius: 9999 }}>
                                <span className={`w-2 h-2 rounded-full ${scanningCamera ? 'bg-success animate-pulse' : 'bg-secondary'}`} />
                                <span>{scanningCamera ? 'Sensor Kamera Aktif' : 'Sensor Siap'}</span>
                            </span>
                        </div>

                        {/* Scanner Body Area */}
                        <div className="p-4">
                            {scannerMode === 'gun' ? (
                                /* Mode 1: USB Barcode Gun & Quick Input */
                                <div className="space-y-4">
                                    <div 
                                        className="p-4 rounded-3 text-center mb-3"
                                        style={{
                                            background: '#F8FAFC',
                                            border: '2px dashed #CBD5E1',
                                            borderRadius: 14
                                        }}
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-teal mb-2"
                                            style={{ background: '#E6F4F1', color: '#0C7C70', width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px' }}
                                        >
                                            <Barcode size={24} />
                                        </div>
                                        <div className="fw-bold text-dark fs-3 mb-1">Arahkan Scanner Fisik ke Kode QR Pasien</div>
                                        <p className="text-secondary small mb-0 max-w-sm mx-auto">
                                            Arahkan scanner barcode USB ke HP pasien, atau ketik langsung kode QR/nomor tiket pada kolom di bawah:
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmitInput}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold text-secondary small text-uppercase" style={{ letterSpacing: '0.04em' }}>
                                                Input Kode QR / Nomor Tiket
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={barcodeInput}
                                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                                    placeholder="Scan barcode di sini atau ketik WNS-QR-..."
                                                    className="form-control form-control-lg font-monospace fw-bold"
                                                    style={{
                                                        borderRadius: '10px 0 0 10px',
                                                        border: '2px solid #0C7C70',
                                                        fontSize: '1.1rem',
                                                        padding: '12px 16px'
                                                    }}
                                                    autoComplete="off"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={validating || !barcodeInput.trim()}
                                                    className="btn btn-lg px-4 text-white fw-bold shadow-sm"
                                                    style={{
                                                        borderRadius: '0 10px 10px 0',
                                                        background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                        border: 'none',
                                                        fontSize: '0.95rem'
                                                    }}
                                                >
                                                    {validating ? (
                                                        <>
                                                            <RefreshCw size={17} className="animate-spin me-1.5" />
                                                            <span>Memvalidasi...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check size={18} className="me-1.5" />
                                                            <span>Validasi Hadir</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                /* Mode 2: Webcam Video Scanner */
                                <div>
                                    {/* Camera Controls & Device Selector */}
                                    <div className="d-flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                                            {cameraDevices.length > 1 && (
                                                <div className="input-icon" style={{ maxWidth: 220 }}>
                                                    <span className="input-icon-addon ps-2">
                                                        <Video size={14} className="text-secondary" />
                                                    </span>
                                                    <select
                                                        value={selectedDeviceId}
                                                        onChange={(e) => {
                                                            setSelectedDeviceId(e.target.value);
                                                            startCamera(e.target.value);
                                                        }}
                                                        className="form-select form-select-sm"
                                                        style={{ borderRadius: 8, fontSize: '12px', paddingLeft: 30 }}
                                                    >
                                                        {cameraDevices.map((d, idx) => (
                                                            <option key={d.deviceId || idx} value={d.deviceId}>
                                                                {d.label || `Kamera ${idx + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {scanningCamera && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMirror(!isMirror)}
                                                    className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 text-secondary"
                                                    style={{ borderRadius: 8, fontSize: '12px' }}
                                                    title="Balik arah horizontal (Mirror)"
                                                >
                                                    <FlipHorizontal size={13} />
                                                    <span>{isMirror ? 'Cermin: Aktif' : 'Cermin: Mati'}</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-1.5">
                                            {scanningCamera ? (
                                                <button
                                                    type="button"
                                                    onClick={stopCamera}
                                                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5"
                                                    style={{ borderRadius: 8 }}
                                                >
                                                    <CameraOff size={14} />
                                                    <span>Matikan Kamera</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={cameraLoading}
                                                    onClick={() => startCamera()}
                                                    className="btn btn-sm text-white fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                                                    style={{ borderRadius: 8, background: '#0C7C70', border: 'none' }}
                                                >
                                                    {cameraLoading ? (
                                                        <>
                                                            <RefreshCw size={14} className="animate-spin" />
                                                            <span>Membuka Kamera...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera size={14} />
                                                            <span>Buka Kamera</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Camera Error Alert with Action */}
                                    {cameraError && (
                                        <div className="alert alert-danger mb-3 shadow-2xs" role="alert" style={{ borderRadius: 12 }}>
                                            <div className="d-flex align-items-start gap-2.5">
                                                <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold small mb-1">Akses Kamera Terkendala:</div>
                                                    <div className="small text-secondary mb-2" style={{ lineHeight: 1.45 }}>{cameraError}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => startCamera()}
                                                        className="btn btn-sm btn-danger px-3 py-1"
                                                        style={{ borderRadius: 8, fontSize: '12px' }}
                                                    >
                                                        <RefreshCw size={12} className="me-1" />
                                                        Coba Buka Kamera Lagi
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scan Feedback Banner */}
                                    {scanFeedback && (
                                        <div 
                                            className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center gap-2 shadow-sm animate-fade-in"
                                            style={{ borderRadius: 10, background: '#E6F4F1', border: '1px solid #0C7C70', color: '#0C7C70' }}
                                        >
                                            <CheckCircle2 size={18} />
                                            <div className="small fw-bold">
                                                QR Code Terdeteksi: <span className="font-monospace">{scanFeedback}</span> (Sedang divalidasi...)
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Stream Container */}
                                    {scanningCamera ? (
                                        <>
                                            <div 
                                                className="position-relative rounded-3 overflow-hidden bg-black border shadow-sm" 
                                                style={{ 
                                                    borderRadius: 14, 
                                                    aspectRatio: '16/9', 
                                                    width: '100%', 
                                                    maxHeight: '440px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <video 
                                                    ref={videoRef} 
                                                    autoPlay 
                                                    playsInline 
                                                    muted 
                                                    className="w-100 h-100 object-cover" 
                                                    style={{ transform: isMirror ? 'scaleX(-1)' : 'none' }}
                                                />

                                                {/* Hidden Canvas for QR decoding */}
                                                <canvas ref={canvasRef} style={{ display: 'none' }} />

                                                {/* Crosshair Scanner Laser Sweep */}
                                                <div 
                                                    className="position-absolute top-50 start-50 translate-middle pointer-events-none d-flex align-items-center justify-content-center"
                                                    style={{ zIndex: 5 }}
                                                >
                                                    <div 
                                                        className="border border-3 position-relative"
                                                        style={{ 
                                                            width: 220, 
                                                            height: 220, 
                                                            borderRadius: 16,
                                                            boxShadow: '0 0 25px rgba(12, 124, 112, 0.5)',
                                                            borderColor: '#0C7C70'
                                                        }}
                                                    >
                                                        {/* Corner Accents */}
                                                        <div className="position-absolute top-0 start-0 w-3 h-3 border-top border-start border-3 border-white -mt-1 -ms-1" style={{ borderRadius: '4px 0 0 0' }} />
                                                        <div className="position-absolute top-0 end-0 w-3 h-3 border-top border-end border-3 border-white -mt-1 -me-1" style={{ borderRadius: '0 4px 0 0' }} />
                                                        <div className="position-absolute bottom-0 start-0 w-3 h-3 border-bottom border-start border-3 border-white -mb-1 -ms-1" style={{ borderRadius: '0 0 0 4px' }} />
                                                        <div className="position-absolute bottom-0 end-0 w-3 h-3 border-bottom border-end border-3 border-white -mb-1 -me-1" style={{ borderRadius: '0 0 4px 0' }} />

                                                        {/* Scanning Laser Line */}
                                                        <div 
                                                            className="position-absolute top-0 start-0 end-0"
                                                            style={{ 
                                                                height: 3, 
                                                                background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
                                                                boxShadow: '0 0 12px #22C55E',
                                                                animation: 'bounce 1.5s infinite alternate' 
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Floating Instruction Pill at Bottom */}
                                                <div 
                                                    className="position-absolute bottom-0 start-50 translate-middle-x mb-3 text-white px-3 py-1.5 rounded-pill small d-flex align-items-center gap-2 pointer-events-none shadow"
                                                    style={{ 
                                                        background: 'rgba(15, 23, 42, 0.75)', 
                                                        backdropFilter: 'blur(6px)',
                                                        zIndex: 6,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
                                                    <span className="fw-medium">Arahkan QR Code pasien ke tengah bingkai</span>
                                                </div>
                                            </div>

                                            {/* Scanner Pro-Tips Bar */}
                                            <div className="mt-2.5 p-2 px-3 bg-light rounded-3 border d-flex align-items-center justify-content-between text-secondary" style={{ fontSize: '12px' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-teal-lt fw-bold">Tips Pemindaian</span>
                                                    <span>Beri jarak <strong>15–25 cm</strong> dari kamera (jangan terlalu dekat agar fokus tidak kabur).</span>
                                                </div>
                                                <label className="btn btn-sm btn-ghost-secondary p-0 m-0 text-decoration-underline cursor-pointer" style={{ fontSize: '11px' }}>
                                                    <span>Scan dari Foto/File</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="d-none" 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const reader = new FileReader();
                                                            reader.onload = () => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement('canvas');
                                                                    canvas.width = img.width;
                                                                    canvas.height = img.height;
                                                                    const ctx = canvas.getContext('2d');
                                                                    if (ctx) {
                                                                        ctx.drawImage(img, 0, 0);
                                                                        const imgData = ctx.getImageData(0, 0, img.width, img.height);
                                                                        const res = jsQR(imgData.data, img.width, img.height);
                                                                        if (res && res.data) {
                                                                            handleValidate(res.data);
                                                                        } else {
                                                                            alert('Kode QR tidak ditemukan di dalam gambar tersebut.');
                                                                        }
                                                                    }
                                                                };
                                                                img.src = reader.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <div 
                                            className="p-5 text-center border border-dashed rounded-3 bg-light" 
                                            style={{ borderRadius: 14 }}
                                        >
                                            <div 
                                                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-secondary mb-3"
                                                style={{ width: 56, height: 56, background: '#E2E8F0', borderRadius: 16, margin: '0 auto 12px' }}
                                            >
                                                <Camera size={28} className="text-secondary" style={{ opacity: 0.7 }} />
                                            </div>
                                            <div className="fw-bold text-dark fs-4 mb-1">Kamera Web Scanner Belum Aktif</div>
                                            <p className="text-secondary small mb-3 max-w-sm mx-auto">
                                                Gunakan kamera laptop atau webcam USB untuk mendeteksi QR tiket pasien di layar HP secara otomatis.
                                            </p>
                                            <button
                                                type="button"
                                                disabled={cameraLoading}
                                                onClick={() => startCamera()}
                                                className="btn btn-primary px-4 py-2 text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                                                style={{
                                                    background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                    borderRadius: 10,
                                                    border: 'none'
                                                }}
                                            >
                                                {cameraLoading ? (
                                                    <>
                                                        <RefreshCw size={16} className="animate-spin" />
                                                        <span>Membuka Kamera...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Camera size={16} />
                                                        <span>Aktifkan Kamera Sekarang</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Collapsible / Integrated Quick Check-In from Today's Reservations */}
                        <div className="bg-light p-4 border-top">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-1.5 fs-4">
                                        <Clock size={16} className="text-warning" />
                                        <span>Reservasi Menunggu Check-in Hari Ini</span>
                                        <span className="badge bg-warning-lt ms-1">
                                            {pendingTickets.length} Pasien
                                        </span>
                                    </h4>
                                    <p className="text-secondary small mb-0 mt-0.5">
                                        Petugas resepsionis dapat melakukan validasi instan 1-klik jika pasien tidak membawa gadget atau barcode scanner fisik bermasalah.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchPending}
                                    className="btn btn-sm d-inline-flex align-items-center gap-1 text-secondary"
                                    style={{ borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                                    title="Segarkan daftar"
                                >
                                    <RefreshCw size={14} />
                                    <span>Segarkan</span>
                                </button>
                            </div>

                            {/* Search pending */}
                            {pendingTickets.length > 0 && (
                                <div className="mb-3">
                                    <div className="input-icon">
                                        <span className="input-icon-addon ps-2.5">
                                            <Search size={15} className="text-secondary" />
                                        </span>
                                        <input
                                            type="text"
                                            value={pendingSearch}
                                            onChange={(e) => setPendingSearch(e.target.value)}
                                            placeholder="Cari nama pasien atau tiket..."
                                            className="form-control form-control-sm"
                                            style={{ borderRadius: 8, border: '1px solid #E2E8F0', paddingLeft: 34 }}
                                        />
                                    </div>
                                </div>
                            )}

                            {pendingTickets.length === 0 ? (
                                <div className="p-3 text-center bg-white rounded-3 border" style={{ borderRadius: 10 }}>
                                    <CheckCircle2 size={24} className="text-success mb-1" />
                                    <div className="fw-bold text-dark small">Semua Pasien Hari Ini Telah Check-In!</div>
                                    <div className="text-muted small">Tidak ada antrean tertunda yang belum diverifikasi di resepsionis.</div>
                                </div>
                            ) : (
                                <div className="space-y-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                    {filteredPending.map((t) => (
                                        <div 
                                            key={t.id}
                                            className="p-2.5 bg-white rounded-3 border d-flex align-items-center justify-content-between mb-2 shadow-2xs"
                                            style={{ borderRadius: 10 }}
                                        >
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div className="fw-black text-primary font-monospace fs-4">
                                                    {t.ticket_number}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark small">{t.patient_name}</div>
                                                    <div className="text-secondary" style={{ fontSize: '11px' }}>
                                                        {t.room} • {t.service} • <span className="badge bg-secondary-lt">{t.priority}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleValidate(t.qr_code)}
                                                disabled={validating}
                                                className="btn btn-sm d-inline-flex align-items-center gap-1 text-white shadow-2xs"
                                                style={{
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                    border: 'none',
                                                    padding: '5px 12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <span>Check-In &rarr;</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (5 cols): Live Boarding Pass / Verification Result */}
                <div className="col-lg-5">
                    {validationResult ? (
                        /* Card Hasil Validasi (Boarding Pass Style) */
                        <div 
                            className="card border-0 shadow-sm overflow-hidden mb-4"
                            style={{
                                borderRadius: '1.25rem',
                                background: '#FFFFFF',
                                boxShadow: '0 8px 30px -4px rgba(12, 124, 112, 0.12)'
                            }}
                        >
                            {/* Boarding Pass Banner */}
                            <div 
                                className="p-4 text-white text-center"
                                style={{
                                    background: validationResult.success 
                                        ? 'linear-gradient(135deg, #0C7C70 0%, #064E46 100%)' 
                                        : 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                                }}
                            >
                                <div 
                                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white mb-2"
                                    style={{
                                        width: 48,
                                        height: 48,
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        margin: '0 auto 10px',
                                        borderRadius: 9999
                                    }}
                                >
                                    {validationResult.success ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                                </div>
                                <h3 className="fw-black text-white m-0 fs-2" style={{ letterSpacing: '-0.02em' }}>
                                    {validationResult.success ? 'Validasi Kehadiran Berhasil!' : 'Peringatan Validasi'}
                                </h3>
                                <div className="text-white small opacity-90 mt-1">
                                    {validationResult.message}
                                </div>
                            </div>

                            {validationResult.ticket && (
                                <div className="p-4">
                                    <div className="text-center pb-3 border-bottom mb-3">
                                        <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                                            NOMOR TIKET PASIEN
                                        </span>
                                        <div 
                                            className="font-monospace fw-black display-3 text-teal my-1"
                                            style={{ color: '#0C7C70', letterSpacing: '-0.02em' }}
                                        >
                                            {validationResult.ticket.ticket_number}
                                        </div>
                                        <div className="badge px-3 py-1 fw-bold fs-6" style={{ background: '#E6F4F1', color: '#0C7C70', borderRadius: 9999 }}>
                                            Posisi Antrean: Urutan ke-{validationResult.queue_position}
                                        </div>
                                    </div>

                                    <div className="list-group list-group-flush small">
                                        <div className="list-group-item d-flex justify-content-between px-0 py-2 border-bottom">
                                            <span className="text-secondary">Nama Pasien:</span>
                                            <strong className="text-dark fs-5">{validationResult.ticket.patient_name}</strong>
                                        </div>
                                        <div className="list-group-item d-flex justify-content-between px-0 py-2 border-bottom">
                                            <span className="text-secondary">Ruangan &amp; Dokter:</span>
                                            <strong className="text-dark">{validationResult.ticket.room} ({validationResult.ticket.doctor})</strong>
                                        </div>
                                        <div className="list-group-item d-flex justify-content-between px-0 py-2 border-bottom">
                                            <span className="text-secondary">Layanan Perawatan:</span>
                                            <strong className="text-dark">{validationResult.ticket.service}</strong>
                                        </div>
                                        <div className="list-group-item d-flex justify-content-between px-0 py-2 border-bottom">
                                            <span className="text-secondary">Prioritas Medis:</span>
                                            <span className="badge bg-teal-lt fw-bold px-2.5 py-1">
                                                {validationResult.ticket.priority}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-2">
                                        <Link
                                            href="/admin/antrean"
                                            className="btn w-100 text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                            style={{
                                                background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                                borderRadius: 10,
                                                padding: '10px 16px',
                                                border: 'none'
                                            }}
                                        >
                                            <span>Buka Antrean &amp; Panggil Pasien</span>
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Standby Placeholder Card */
                        <div 
                            className="card border-0 shadow-sm text-center p-5 mb-4"
                            style={{
                                borderRadius: '1.25rem',
                                background: '#FFFFFF',
                                boxShadow: '0 4px 24px -2px rgba(12, 124, 112, 0.08)'
                            }}
                        >
                            <div 
                                className="w-16 h-16 rounded-3 mx-auto flex items-center justify-center text-secondary mb-3"
                                style={{
                                    width: 64,
                                    height: 64,
                                    background: '#F1F5F9',
                                    borderRadius: 20,
                                    margin: '0 auto 16px'
                                }}
                            >
                                <QrCode size={32} style={{ opacity: 0.5 }} />
                            </div>
                            <h3 className="fw-bold text-dark fs-3 mb-1">Menunggu Scan Tiket</h3>
                            <p className="text-secondary small mb-4 max-w-xs mx-auto leading-relaxed">
                                Arahkan scanner ke kode QR di aplikasi HP pasien atau lakukan verifikasi cepat pada daftar di sebelah kiri.
                            </p>
                            <div className="p-3 bg-light rounded-3 text-start small border">
                                <div className="fw-bold text-dark mb-1">Mekanisme Check-In:</div>
                                <div className="text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
                                    1. Pasien tiba di klinik menunjukkan QR tiket di HP.<br/>
                                    2. Scanner membaca kode QR &rarr; backend mencatat kehadiran.<br/>
                                    3. Pasien resmi masuk ke antrean aktif FIFO &amp; Priority Scheduling.<br/>
                                    4. Layar monitor TV di ruang tunggu otomatis mengumumkan antrean.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
