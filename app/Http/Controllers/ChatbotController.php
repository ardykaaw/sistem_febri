<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    /**
     * Handle incoming patient chat message using clean RAG (Retrieval-Augmented Generation)
     * Professional, concise, without emoji-slop or robotic boilerplate.
     */
    public function handleChat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $userMessage = trim($validated['message']);
        $chatHistory = $validated['history'] ?? [];

        // 1. RETRIEVAL: Live queue status
        $queueContext = $this->getLiveQueueContext();

        // 2. RETRIEVAL: User's active ticket
        $userTicketContext = $this->getUserTicketContext();

        // 3. RETRIEVAL: Clinic & Doctor Knowledge Base
        $clinicalKnowledge = $this->getClinicalKnowledge();

        // 4. GENERATION: Gemini API (if key available)
        $geminiKey = config('services.gemini.key');
        $geminiModel = config('services.gemini.model', 'gemini-1.5-flash');

        if (!empty($geminiKey)) {
            try {
                $geminiReply = $this->queryGemini(
                    $geminiKey,
                    $geminiModel,
                    $userMessage,
                    $chatHistory,
                    $queueContext,
                    $userTicketContext,
                    $clinicalKnowledge
                );

                if ($geminiReply) {
                    return response()->json([
                        'success' => true,
                        'reply' => $geminiReply,
                        'engine' => 'gemini_rag',
                        'server_time' => Carbon::now()->format('H:i:s'),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini API call failed, switching to Local NLP: ' . $e->getMessage());
            }
        }

        // 5. LOCAL RAG FALLBACK (Guaranteed 100% uptime, clean & concise)
        $localReply = $this->generateLocalNlpReply(
            $userMessage,
            $queueContext,
            $userTicketContext,
            $clinicalKnowledge
        );

        return response()->json([
            'success' => true,
            'reply' => $localReply,
            'engine' => 'local_rag',
            'server_time' => Carbon::now()->format('H:i:s'),
        ]);
    }

    protected function getLiveQueueContext(): array
    {
        $callingTickets = QueueTicket::where('status', 'dipanggil')
            ->orderBy('called_at', 'desc')
            ->get();

        $waitingCount = QueueTicket::where('status', 'menunggu')
            ->where('is_checked_in', true)
            ->count();

        $pendingCheckinCount = QueueTicket::where('status', 'menunggu_checkin')
            ->where('is_checked_in', false)
            ->count();

        $finishedCount = QueueTicket::where('status', 'selesai')
            ->whereDate('updated_at', Carbon::today())
            ->count();

        $currentlyCallingStr = $callingTickets->isNotEmpty()
            ? $callingTickets->map(fn($t) => "Nomor {$t->ticket_number} (Pasien {$t->patient_name}, Layanan: {$t->service})")->implode(', ')
            : 'Belum ada antrean yang sedang dipanggil';

        return [
            'currently_calling' => $currentlyCallingStr,
            'calling_count' => $callingTickets->count(),
            'waiting_count' => $waitingCount,
            'pending_checkin_count' => $pendingCheckinCount,
            'finished_count' => $finishedCount,
            'total_today' => $waitingCount + $callingTickets->count() + $finishedCount + $pendingCheckinCount,
        ];
    }

    protected function getUserTicketContext(): ?array
    {
        if (!Auth::check()) {
            return null;
        }

        $user = Auth::user();
        $ticket = QueueTicket::where('user_id', $user->id)
            ->whereIn('status', ['menunggu_checkin', 'menunggu', 'dipanggil'])
            ->latest()
            ->first();

        if (!$ticket) {
            return null;
        }

        return [
            'ticket_number' => $ticket->ticket_number,
            'patient_name' => $ticket->patient_name,
            'service' => $ticket->service,
            'doctor' => $ticket->doctor ?? 'drg. Febri, Sp.KG',
            'room' => $ticket->room ?? 'Ruang Periksa Gigi',
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'is_checked_in' => (bool) $ticket->is_checked_in,
            'qr_code' => $ticket->qr_code,
        ];
    }

    protected function getClinicalKnowledge(): array
    {
        return [
            'clinic_name' => 'Klinik Gigi Wansha',
            'doctor' => [
                'name' => 'drg. Febri, Sp.KG',
                'title' => 'Dokter Gigi Spesialis Konservasi Gigi (Sp.KG)',
                'room' => 'Ruang Periksa Gigi',
                'schedule' => 'Senin s/d Sabtu, pukul 08.00 – 20.00 WITA. Hari Minggu dan Libur Nasional tutup.',
            ],
            'services' => [
                'Perawatan Saluran Akar (PSA)' => 'Spesialisasi drg. Febri, Sp.KG untuk infeksi pulpa/saraf gigi agar gigi tidak perlu dicabut.',
                'Penambalan Estetis Komposit' => 'Tambal gigi berlubang sewarna gigi asli.',
                'Scaling Karang Gigi' => 'Pembersihan karang gigi ultrasonik dan perawatan gusi.',
                'Pencabutan Gigi & Sisa Akar' => 'Pencabutan steril untuk gigi rusak berat atau sisa akar.',
                'Pemeriksaan Gigi Anak' => 'Pemeriksaan gigi anak dengan pendekatan ramah.',
                'Kawat Gigi (Ortodonti)' => 'Perapihan susunan gigi.',
            ],
        ];
    }

    protected function queryGemini(
        string $apiKey,
        string $model,
        string $userMessage,
        array $chatHistory,
        array $queueContext,
        ?array $userTicketContext,
        array $clinicalKnowledge
    ): ?string {
        $systemInstruction = "Anda adalah asisten virtual resmi Klinik Gigi Wansha bersama drg. Febri, Sp.KG.\n" .
            "PRINSIP PENULISAN JAWABAN:\n" .
            "- Jawab dengan bahasa Indonesia yang alami, ringkas, profesional, dan to the point.\n" .
            "- HINDARI penggunaan emoji yang berlebihan (maksimal 1 atau tanpa emoji sama sekali agar terlihat elegan).\n" .
            "- Jangan mengulang salam pembuka yang panjang di setiap pesan.\n" .
            "- Jika ditanya antrean, gunakan data live di bawah ini secara tepat.\n" .
            "- Jika ada keluhan sakit gigi berdenyut/lubang dalam, jelaskan bahwa drg. Febri, Sp.KG berspesialisasi dalam Perawatan Saluran Akar (PSA) untuk mempertahankan gigi asli.\n\n" .
            "DATA LIVE KLINIK HARI INI:\n" .
            "- Sedang Dipanggil: {$queueContext['currently_calling']}\n" .
            "- Menunggu Giliran: {$queueContext['waiting_count']} pasien\n" .
            "- Belum Check-in QR: {$queueContext['pending_checkin_count']} pasien\n" .
            "- Selesai Hari Ini: {$queueContext['finished_count']} pasien\n" .
            "- Dokter: {$clinicalKnowledge['doctor']['name']} ({$clinicalKnowledge['doctor']['title']})\n" .
            "- Jam Praktik: {$clinicalKnowledge['doctor']['schedule']}\n";

        if ($userTicketContext) {
            $systemInstruction .= "\nTIKET PASIEN INI:\n" .
                "- Nomor: {$userTicketContext['ticket_number']}\n" .
                "- Pasien: {$userTicketContext['patient_name']}\n" .
                "- Layanan: {$userTicketContext['service']}\n" .
                "- Status: {$userTicketContext['status']} (Check-in: " . ($userTicketContext['is_checked_in'] ? 'Sudah' : 'Belum') . ")\n";
        }

        $contents = [];
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => "[SYSTEM INSTRUCTION]\n" . $systemInstruction]],
        ];
        $contents[] = [
            'role' => 'model',
            'parts' => [['text' => 'Dimengerti. Saya akan menjawab dengan ringkas, profesional, dan berbasis data klinik.']],
        ];

        $recentHistory = array_slice($chatHistory, -4);
        foreach ($recentHistory as $item) {
            if (isset($item['role'], $item['content']) && in_array($item['role'], ['user', 'assistant'])) {
                $role = $item['role'] === 'assistant' ? 'model' : 'user';
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $item['content']]],
                ];
            }
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]],
        ];

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(10)->post($endpoint, [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 500,
            ],
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $replyText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($replyText) {
                return trim($replyText);
            }
        }

        return null;
    }

    protected function generateLocalNlpReply(
        string $message,
        array $queue,
        ?array $userTicket,
        array $knowledge
    ): string {
        $msg = strtolower($message);

        // 1. Antrean
        if (
            str_contains($msg, 'antrean') || str_contains($msg, 'antrian') || 
            str_contains($msg, 'nomor berapa') || str_contains($msg, 'nomor berap') ||
            str_contains($msg, 'siapa dipanggil') || str_contains($msg, 'lagi dipanggil') ||
            str_contains($msg, 'sisa antrean')
        ) {
            $reply = "Informasi antrean saat ini:\n\n";
            $reply .= "• Sedang dipanggil: **{$queue['currently_calling']}**\n";
            $reply .= "• Menunggu di ruang tunggu: **{$queue['waiting_count']} pasien**\n";
            $reply .= "• Belum check-in QR: **{$queue['pending_checkin_count']} pasien**\n";
            $reply .= "• Selesai hari ini: **{$queue['finished_count']} pasien**\n\n";

            if ($userTicket) {
                $statusText = match ($userTicket['status']) {
                    'menunggu_checkin' => 'Menunggu Check-In (arahkan QR tiket ke scanner saat tiba)',
                    'menunggu' => 'Sedang menunggu giliran di ruang tunggu',
                    'dipanggil' => 'Saat ini sedang dipanggil, silakan masuk ke Ruang Periksa Gigi',
                    'selesai' => 'Pemeriksaan telah selesai',
                    default => $userTicket['status'],
                };
                $reply .= "Status tiket Anda (**{$userTicket['ticket_number']}**): {$statusText}.";
            }

            return $reply;
        }

        // 2. Tiket Saya
        if (str_contains($msg, 'tiket saya') || str_contains($msg, 'nomor saya') || str_contains($msg, 'antrean saya')) {
            if ($userTicket) {
                return "Rincian tiket Anda hari ini:\n\n" .
                    "• Nomor Tiket: **{$userTicket['ticket_number']}**\n" .
                    "• Pasien: {$userTicket['patient_name']}\n" .
                    "• Layanan: {$userTicket['service']}\n" .
                    "• Prioritas: {$userTicket['priority']}\n" .
                    "• Status: " . ($userTicket['is_checked_in'] ? 'Sudah Check-In (aktif di monitor antrean)' : 'Belum Check-In (silakan scan QR di meja resepsionis)');
            }
            return "Anda belum memiliki tiket antrean aktif untuk hari ini. Silakan melakukan reservasi melalui menu Ambil Antrean di halaman Beranda.";
        }

        // 3. Sakit gigi / ngilu / berdenyut / lubang dalam
        if (
            str_contains($msg, 'ngilu') || str_contains($msg, 'berdenyut') || 
            str_contains($msg, 'lubang') || str_contains($msg, 'nyeri') || 
            str_contains($msg, 'sakit gigi') || str_contains($msg, 'bengkak')
        ) {
            return "Keluhan gigi berdenyut atau ngilu parah umumnya menandakan infeksi pada jaringan saraf gigi (pulpa) akibat lubang yang dalam.\n\n" .
                "drg. Febri, Sp.KG (Spesialis Konservasi Gigi) berfokus pada tindakan **Perawatan Saluran Akar (PSA)** untuk membersihkan infeksi dan mempertahankan gigi asli agar tidak perlu dicabut.\n\n" .
                "Jika rasa sakit sangat mengganggu, Anda dapat memilih kategori prioritas **Darurat** saat mengambil nomor antrean.";
        }

        // 4. Scaling / Karang Gigi
        if (str_contains($msg, 'karang') || str_contains($msg, 'scaling') || str_contains($msg, 'bau mulut') || str_contains($msg, 'gusi berdarah')) {
            return "Untuk karang gigi, gusi mudah berdarah, atau bau mulut, layanan yang tepat adalah **Scaling Karang Gigi** menggunakan instrumen ultrasonik steril.\n\n" .
                "Perawatan ini dianjurkan secara rutin setiap 6 bulan sekali. Anda dapat memilih layanan Scaling Karang Gigi dengan prioritas Reguler pada form reservasi.";
        }

        // 5. Tambal Gigi
        if (str_contains($msg, 'tambal') || str_contains($msg, 'patah') || str_contains($msg, 'gompal')) {
            return "Untuk gigi berlubang ringan hingga sedang, tindakan yang disarankan adalah **Penambalan Estetis Komposit**.\n\n" .
                "Bahan komposit resin yang digunakan memiliki warna yang menyatu alami dengan gigi asli dan kuat untuk mengunyah.";
        }

        // 6. Cabut Gigi
        if (str_contains($msg, 'cabut') || str_contains($msg, 'bungsu') || str_contains($msg, 'sisa akar') || str_contains($msg, 'goyang')) {
            return "Klinik menyediakan tindakan **Pencabutan Gigi & Sisa Akar** dengan anestesi lokal untuk gigi yang sudah tidak dapat dipertahankan lagi.\n\n" .
                "drg. Febri, Sp.KG akan memeriksa kondisi gigi terlebih dahulu untuk memastikan apakah gigi masih bisa dirawat atau memang perlu dicabut.";
        }

        // 7. Jadwal Praktik
        if (str_contains($msg, 'jadwal') || str_contains($msg, 'jam buka') || str_contains($msg, 'buka jam') || str_contains($msg, 'dokter')) {
            return "Informasi dokter & jadwal praktik:\n\n" .
                "• Dokter: **drg. Febri, Sp.KG** (Spesialis Konservasi Gigi)\n" .
                "• Ruangan: **Ruang Periksa Gigi**\n" .
                "• Jadwal: **Senin s/d Sabtu, pukul 08.00 – 20.00 WITA**\n" .
                "• Hari Minggu dan Libur Nasional: Tutup";
        }

        // 8. Cara Ambil Antrean
        if (str_contains($msg, 'cara') || str_contains($msg, 'daftar') || str_contains($msg, 'reservasi') || str_contains($msg, 'alur') || str_contains($msg, 'ambil antrean')) {
            return "Alur antrean di Klinik Wansha:\n\n" .
                "1. **Reservasi:** Buka halaman Beranda, pilih layanan dan prioritas, lalu ambil tiket untuk mendapatkan Nomor Antrean dan Kode QR.\n" .
                "2. **Check-In:** Saat tiba di klinik, scan kode QR di kamera meja resepsionis.\n" .
                "3. **Tunggu Giliran:** Nomor Anda akan tampil di TV Display ruang tunggu dan dipanggil otomatis saat dokter siap melayani.";
        }

        // 9. Biaya
        if (str_contains($msg, 'biaya') || str_contains($msg, 'harga') || str_contains($msg, 'tarif') || str_contains($msg, 'bayar')) {
            return "Biaya tindakan disesuaikan dengan kondisi kasus dan bahan medis yang digunakan. Konsultasi dan estimasi biaya akan dijelaskan secara transparan oleh dokter sebelum tindakan dimulai.";
        }

        // Default
        return "Halo, ada yang bisa kami bantu seputar antrean, jadwal drg. Febri, Sp.KG, atau keluhan gigi Anda?";
    }
}
