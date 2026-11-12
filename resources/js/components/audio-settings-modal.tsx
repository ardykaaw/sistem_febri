import React, { useState, useEffect } from 'react';
import { 
    Volume2, 
    Settings, 
    X, 
    Play, 
    RotateCcw, 
    Check, 
    Mic, 
    Bell, 
    Sliders, 
    Sparkles 
} from 'lucide-react';
import { 
    AudioSettings, 
    DEFAULT_AUDIO_SETTINGS, 
    getStoredAudioSettings, 
    saveStoredAudioSettings, 
    announceQueueCall 
} from '@/lib/queue-audio';

interface AudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (settings: AudioSettings) => void;
}

export default function AudioSettingsModal({ isOpen, onClose, onSaved }: AudioSettingsModalProps) {
    const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isPlayingTest, setIsPlayingTest] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Ambil daftar voices dari SpeechSynthesis
    useEffect(() => {
        setSettings(getStoredAudioSettings());

        const updateVoices = () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const list = window.speechSynthesis.getVoices();
                setAvailableVoices(list);
            }
        };

        updateVoices();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Kelompokkan suara: Bahasa Indonesia terlebih dahulu
    const indonesianVoices = availableVoices.filter(
        (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    const otherVoices = availableVoices.filter(
        (v) => !v.lang.startsWith('id') && !v.lang.includes('ID') && !v.name.toLowerCase().includes('indonesia')
    );

    const handleSave = () => {
        saveStoredAudioSettings(settings);
        setSavedSuccess(true);
        if (onSaved) onSaved(settings);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 600);
    };

    const handleReset = () => {
        setSettings(DEFAULT_AUDIO_SETTINGS);
        saveStoredAudioSettings(DEFAULT_AUDIO_SETTINGS);
    };

    const handleTestAudio = () => {
        setIsPlayingTest(true);
        announceQueueCall('A01', 'Budi Santoso', 'Ruang Periksa Gigi', settings, () => {
            setIsPlayingTest(false);
        });
        // Fallback jika onend tidak terpanggil
        setTimeout(() => setIsPlayingTest(false), 5000);
    };

    return (
        <div 
            className="modal modal-blur fade show d-block" 
            tabIndex={-1} 
            role="dialog"
            style={{ 
                backgroundColor: 'rgba(7, 26, 23, 0.75)', 
                backdropFilter: 'blur(10px)',
                zIndex: 9999 
            }}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '36rem' }}>
                <div 
                    className="modal-content border-0 text-white shadow-2xl"
                    style={{
                        background: '#0E2824',
                        borderRadius: '24px',
                        border: '1px solid rgba(46, 175, 155, 0.35)',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
                    }}
                >
                    {/* Header */}
                    <div 
                        className="modal-header py-4 px-4 px-md-5 d-flex align-items-center justify-content-between"
                        style={{ borderBottom: '1px solid rgba(46, 175, 155, 0.2)' }}
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div 
                                className="d-flex align-items-center justify-content-center rounded-3 text-white"
                                style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #0C7C70, #08554D)', border: '1px solid rgba(255,255,255,0.15)' }}
                            >
                                <Volume2 style={{ width: 22, height: 22, color: '#34D399' }} />
                            </div>
                            <div>
                                <h4 className="modal-title fw-black text-white fs-3 m-0">Pengaturan Suara Panggilan</h4>
                                <div className="small text-white-50" style={{ fontSize: '12px' }}>
                                    Sesuaikan karakter suara, nada bel, dan kecepatan panggil antrean.
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            aria-label="Close" 
                            onClick={onClose}
                        ></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4 p-md-5">
                        {/* 1. Pemilihan Suara (SpeechSynthesis Voice) */}
                        <div className="mb-4">
                            <label className="form-label d-flex align-items-center justify-content-between text-white fw-bold mb-2">
                                <span className="d-flex align-items-center gap-2">
                                    <Mic style={{ width: 16, height: 16, color: '#34D399' }} />
                                    <span>Pilih Karakter Suara Pengucap</span>
                                </span>
                                {indonesianVoices.length > 0 && (
                                    <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', fontSize: '11px' }}>
                                        Tersedia Bahasa Indonesia
                                    </span>
                                )}
                            </label>

                            <select
                                className="form-select bg-dark text-white border-0 py-2.5"
                                style={{
                                    background: '#071A17',
                                    border: '1px solid rgba(46, 175, 155, 0.35)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: '#E6F4F1'
                                }}
                                value={settings.voiceURI}
                                onChange={(e) => {
                                    const selected = availableVoices.find((v) => v.voiceURI === e.target.value);
                                    setSettings({
                                        ...settings,
                                        voiceURI: e.target.value,
                                        voiceName: selected ? selected.name : '',
                                    });
                                }}
                            >
                                <option value="">Otomatis (Default Suara Bahasa Indonesia Sistem)</option>

                                {indonesianVoices.length > 0 && (
                                    <optgroup label="Suara Bahasa Indonesia (Rekomendasi)">
                                        {indonesianVoices.map((v) => (
                                            <option key={v.voiceURI} value={v.voiceURI}>
                                                🇮🇩 {v.name} ({v.lang})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}

                                {otherVoices.length > 0 && (
                                    <optgroup label="Suara Natural Lainnya (OS / Browser)">
                                        {otherVoices.slice(0, 25).map((v) => (
                                            <option key={v.voiceURI} value={v.voiceURI}>
                                                🌐 {v.name} ({v.lang})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <div className="text-white-50 mt-1.5" style={{ fontSize: '11px' }}>
                                Karakter suara diambil otomatis dari mesin suara sistem operasi (macOS / Windows / Chrome).
                            </div>
                        </div>

                        {/* 2. Tipe Nada Bel (Chime) */}
                        <div className="mb-4">
                            <label className="form-label d-flex align-items-center gap-2 text-white fw-bold mb-2">
                                <Bell style={{ width: 16, height: 16, color: '#F5B755' }} />
                                <span>Pilihan Nada Bel (Chime Pembuka)</span>
                            </label>

                            <div className="row g-2">
                                {[
                                    { id: 'dingdong', title: 'Ding-Dong Klasik', desc: '2 Nada Bandara Elegan' },
                                    { id: 'tritone', title: 'Tri-Tone Modern', desc: '3 Nada Rumah Sakit Mewah' },
                                    { id: 'melody', title: 'Melodi Lembut', desc: 'Harmoni 3 Nada Tenang' },
                                    { id: 'single', title: 'Single Bell', desc: '1 Nada Halus Singkat' },
                                    { id: 'none', title: 'Tanpa Nada Bel', desc: 'Langsung Suara Ucapan' },
                                ].map((item) => {
                                    const isSelected = settings.chimeStyle === item.id;
                                    return (
                                        <div key={item.id} className="col-sm-6">
                                            <button
                                                type="button"
                                                onClick={() => setSettings({ ...settings, chimeStyle: item.id as AudioSettings['chimeStyle'] })}
                                                className="w-100 p-2.5 text-start rounded-3 transition-all d-flex align-items-center justify-content-between"
                                                style={{
                                                    background: isSelected ? 'rgba(12, 124, 112, 0.4)' : '#071A17',
                                                    border: isSelected ? '1.5px solid #34D399' : '1px solid rgba(46, 175, 155, 0.25)',
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                <div>
                                                    <div className="fw-bold text-white small">{item.title}</div>
                                                    <div className="text-white-50" style={{ fontSize: '10px' }}>{item.desc}</div>
                                                </div>
                                                {isSelected && <Check style={{ width: 16, height: 16, color: '#34D399' }} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Slider Kecepatan & Nada Bicara */}
                        <div className="mb-4 p-3 rounded-3" style={{ background: '#071A17', border: '1px solid rgba(46, 175, 155, 0.2)' }}>
                            <div className="row g-3">
                                <div className="col-sm-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small fw-bold text-white">Kecepatan Bicara</span>
                                        <span className="badge bg-teal-lt text-teal">{settings.rate.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.7"
                                        max="1.2"
                                        step="0.05"
                                        className="form-range"
                                        value={settings.rate}
                                        onChange={(e) => setSettings({ ...settings, rate: parseFloat(e.target.value) })}
                                    />
                                    <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '10px' }}>
                                        <span>Tenang (0.7x)</span>
                                        <span>Standar (0.9x)</span>
                                        <span>Cepat (1.2x)</span>
                                    </div>
                                </div>

                                <div className="col-sm-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small fw-bold text-white">Tinggi Nada (Pitch)</span>
                                        <span className="badge bg-teal-lt text-teal">{settings.pitch.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.8"
                                        max="1.3"
                                        step="0.05"
                                        className="form-range"
                                        value={settings.pitch}
                                        onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                                    />
                                    <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '10px' }}>
                                        <span>Rendah (0.8)</span>
                                        <span>Standar (1.0)</span>
                                        <span>Ramah (1.3)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Format Kalimat Panggilan */}
                        <div className="mb-4">
                            <label className="form-label d-flex align-items-center gap-2 text-white fw-bold mb-2">
                                <Sliders style={{ width: 16, height: 16, color: '#38BDF8' }} />
                                <span>Format Kalimat Pengumuman</span>
                            </label>
                            <select
                                className="form-select bg-dark text-white border-0 py-2"
                                style={{
                                    background: '#071A17',
                                    border: '1px solid rgba(46, 175, 155, 0.35)',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    color: '#E6F4F1'
                                }}
                                value={settings.phraseFormat}
                                onChange={(e) => setSettings({ ...settings, phraseFormat: e.target.value as AudioSettings['phraseFormat'] })}
                            >
                                <option value="standard">Lengkap: "Nomor antrean, A 0 1, atas nama Budi Santoso, silakan menuju ke Ruang Periksa Gigi"</option>
                                <option value="formal">Formal: "Panggilan kepada nomor antrean, A 0 1, atas nama Budi Santoso, silakan menuju ke Ruang Periksa Gigi"</option>
                                <option value="brief">Ringkas: "Nomor antrean, A 0 1, silakan masuk ke Ruang Periksa Gigi"</option>
                            </select>
                        </div>

                        {/* Button Uji Coba Suara */}
                        <button
                            type="button"
                            onClick={handleTestAudio}
                            disabled={isPlayingTest}
                            className="btn w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 text-white shadow"
                            style={{
                                background: 'linear-gradient(135deg, #0C7C70 0%, #08554D 100%)',
                                border: '1px solid rgba(52, 211, 153, 0.4)',
                                borderRadius: '12px'
                            }}
                        >
                            <Play style={{ width: 16, height: 16, fill: '#34D399', color: '#34D399' }} className={isPlayingTest ? 'animate-spin' : ''} />
                            <span>{isPlayingTest ? 'Memutar Uji Coba Suara...' : '🔊 Uji Coba Suara Sekarang'}</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <div 
                        className="modal-footer py-3 px-4 px-md-5 d-flex align-items-center justify-content-between"
                        style={{ borderTop: '1px solid rgba(46, 175, 155, 0.2)' }}
                    >
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-link text-white-50 text-decoration-none small d-flex align-items-center gap-1.5 p-0"
                        >
                            <RotateCcw style={{ width: 14, height: 14 }} />
                            <span>Reset Default</span>
                        </button>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-outline-secondary text-white border-secondary-subtle px-4"
                                style={{ borderRadius: '10px' }}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="btn btn-success px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                                style={{ borderRadius: '10px', background: '#34D399', color: '#071A17', border: 'none' }}
                            >
                                <Check style={{ width: 16, height: 16 }} />
                                <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
