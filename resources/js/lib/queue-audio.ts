// Sistem Audio & Text-to-Speech Antrean Klinik Wansha

export interface AudioSettings {
    voiceURI: string;
    voiceName: string;
    chimeStyle: 'dingdong' | 'tritone' | 'melody' | 'single' | 'none';
    rate: number;
    pitch: number;
    volume: number;
    phraseFormat: 'standard' | 'formal' | 'brief';
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    voiceURI: '',
    voiceName: '',
    chimeStyle: 'dingdong',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    phraseFormat: 'standard',
};

const STORAGE_KEY = 'klinik_wansha_audio_settings';

export function getStoredAudioSettings(): AudioSettings {
    if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
        }
    } catch {
        // fallback
    }
    return DEFAULT_AUDIO_SETTINGS;
}

export function saveStoredAudioSettings(settings: AudioSettings): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // fallback
    }
}

// Global AudioContext Singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        if (!audioCtx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtx = new AudioCtxClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    } catch {
        return null;
    }
}

// Putar Nada Bel / Chime sesuai preferensi pengguna
export function playChimeTone(style: AudioSettings['chimeStyle']): number {
    const ctx = getAudioContext();
    if (!ctx || style === 'none') return 0;

    const now = ctx.currentTime;

    const playTone = (freq: number, startDelay: number, duration: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startDelay);
        gain.gain.setValueAtTime(gainVal, now + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration);
    };

    switch (style) {
        case 'tritone':
            // 3 Nada Harmoni Mewah: C5 (523Hz), E5 (659Hz), G5 (784Hz)
            playTone(523.25, 0.0, 0.6, 0.35);
            playTone(659.25, 0.22, 0.6, 0.4);
            playTone(783.99, 0.44, 1.2, 0.5);
            return 1400; // ms sebelum TTS bicara

        case 'melody':
            // Melodi Lembut: F5 (698Hz), A5 (880Hz), C6 (1046Hz)
            playTone(698.46, 0.0, 0.5, 0.3);
            playTone(880.00, 0.18, 0.5, 0.35);
            playTone(1046.50, 0.36, 1.1, 0.45);
            return 1300;

        case 'single':
            // 1 Nada Bel Halus: G5 (784Hz)
            playTone(783.99, 0.0, 1.1, 0.45);
            return 800;

        case 'dingdong':
        default:
            // Ding-Dong Klasik Bandara: D5 (587Hz) lalu A5 (880Hz)
            playTone(587.33, 0.0, 0.6, 0.35);
            playTone(880.00, 0.25, 1.2, 0.45);
            return 1150;
    }
}

// Susun teks pengumuman panggilan
export function buildAnnouncementText(
    ticketNumber: string,
    patientName: string,
    room: string,
    format: AudioSettings['phraseFormat'] = 'standard'
): string {
    // Pisahkan huruf tiket agar diucapkan satu per satu (misal: "A 0 1")
    const spacedTicket = ticketNumber.split('').join(' ');

    switch (format) {
        case 'formal':
            return `Panggilan kepada nomor antrean, ${spacedTicket}, atas nama ${patientName}, silakan menuju ke ${room}`;
        case 'brief':
            return `Nomor antrean, ${spacedTicket}, silakan masuk ke ${room}`;
        case 'standard':
        default:
            return `Nomor antrean, ${spacedTicket}, atas nama ${patientName}, silakan menuju ke ${room}`;
    }
}

// Jalankan Text to Speech lengkap dengan bel
export function announceQueueCall(
    ticketNumber: string,
    patientName: string,
    room: string,
    settings: AudioSettings,
    onEnd?: () => void
): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
    }

    // Batalkan pengumuman yang sedang berjalan agar tidak bertumpuk
    window.speechSynthesis.cancel();

    // Bunyikan nada bel
    const delayBeforeSpeech = playChimeTone(settings.chimeStyle);

    setTimeout(() => {
        const text = buildAnnouncementText(ticketNumber, patientName, room, settings.phraseFormat);
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        // Pilih voice yang cocok
        const voices = window.speechSynthesis.getVoices();
        let chosenVoice = null;

        if (settings.voiceURI) {
            chosenVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
        }

        // Fallback: Cari suara Bahasa Indonesia jika voiceURI tidak ditemukan
        if (!chosenVoice) {
            chosenVoice = voices.find(
                (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
            );
        }

        if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang;
        } else {
            utterance.lang = 'id-ID';
        }

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }, delayBeforeSpeech);
}
