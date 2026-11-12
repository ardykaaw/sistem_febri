<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class QueueController extends Controller
{
    /**
     * Get live queue data for Dashboard and TV Display
     */
    public function getLiveQueue(): JsonResponse
    {
        // Active queue: sudah check-in dan berstatus dipanggil atau menunggu
        // Diurutkan berdasarkan Priority Scheduling (Darurat > Lansia > Anak > Reguler) lalu FIFO (checked_in_at)
        $activeQueue = QueueTicket::activeQueue()->get();

        // Tiket yang saat ini sedang dipanggil per poli
        $currentlyCalling = QueueTicket::where('status', 'dipanggil')
            ->orderBy('called_at', 'desc')
            ->get();

        // Tiket yang belum check-in (baru reservasi online, belum scan QR di klinik)
        $unvalidatedReservations = QueueTicket::where('is_checked_in', false)
            ->where('status', 'menunggu_checkin')
            ->orderBy('created_at', 'desc')
            ->get();

        // Tiket yang selesai hari ini
        $finishedToday = QueueTicket::where('status', 'selesai')
            ->whereDate('updated_at', Carbon::today())
            ->orderBy('completed_at', 'desc')
            ->get();

        // Total metrik
        $stats = [
            'total_reservasi' => QueueTicket::whereDate('created_at', Carbon::today())->count(),
            'menunggu_checkin' => $unvalidatedReservations->count(),
            'antrean_aktif' => $activeQueue->where('status', 'menunggu')->count(),
            'sedang_dipanggil' => $currentlyCalling->count(),
            'selesai_hari_ini' => $finishedToday->count(),
        ];

        return response()->json([
            'success' => true,
            'active_queue' => $activeQueue,
            'currently_calling' => $currentlyCalling,
            'unvalidated_reservations' => $unvalidatedReservations,
            'finished_today' => $finishedToday,
            'stats' => $stats,
            'server_time' => Carbon::now()->format('H:i:s'),
        ]);
    }

    /**
     * Pasien melakukan reservasi online
     */
    public function makeReservation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'required|string|max:30',
            'service' => 'required|string|max:255',
            'doctor' => 'nullable|string|max:255',
            'priority' => 'required|in:Darurat,Lansia,Anak,Reguler',
            'notes' => 'nullable|string',
        ]);

        $doctor = !empty($validated['doctor']) ? $validated['doctor'] : 'drg. Febri, Sp.KG';
        $room = 'Ruang Periksa Gigi';

        // Nomor antrean increment hari ini
        $todayCount = QueueTicket::whereDate('created_at', Carbon::today())->count();
        $ticketNumber = 'A' . str_pad($todayCount + 1, 2, '0', STR_PAD_LEFT);

        // QR Code unik yang akan di-scan di resepsionis klinik
        $qrCode = 'WNS-QR-' . $ticketNumber . '-' . strtoupper(substr(md5(uniqid()), 0, 6));

        $ticket = QueueTicket::create([
            'ticket_number' => $ticketNumber,
            'qr_code' => $qrCode,
            'user_id' => Auth::id(),
            'patient_name' => $validated['patient_name'],
            'patient_phone' => $validated['patient_phone'],
            'service' => $validated['service'],
            'doctor' => $doctor,
            'room' => $room,
            'priority' => $validated['priority'],
            'priority_score' => QueueTicket::getPriorityScore($validated['priority']),
            'notes' => $validated['notes'] ?? null,
            'is_checked_in' => false,
            'status' => 'menunggu_checkin',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dibuat! Tunjukkan QR Code saat tiba di klinik.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Admin/Scanner memvalidasi kehadiran pasien via QR Code / Barcode Scanner
     * Di sinilah algoritma FIFO & Priority Scheduling mulai bekerja!
     */
    public function validateQrCode(Request $request): JsonResponse
    {
        $code = trim($request->input('code', $request->input('qr_code', '')));

        if (!$code) {
            return response()->json([
                'success' => false,
                'message' => 'Kode QR atau Barcode tidak boleh kosong.',
            ], 422);
        }

        // Cari berdasarkan qr_code atau ticket_number
        $ticket = QueueTicket::where('qr_code', $code)
            ->orWhere('ticket_number', strtoupper($code))
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => "Tiket dengan kode '{$code}' tidak ditemukan dalam database.",
            ], 404);
        }

        if ($ticket->is_checked_in) {
            return response()->json([
                'success' => false,
                'already_validated' => true,
                'message' => "Pasien {$ticket->patient_name} (No. {$ticket->ticketNumber}) sudah divalidasi hadir pada {$ticket->checked_in_at->format('H:i')} WIB.",
                'ticket' => $ticket,
            ]);
        }

        // Update status: Pasien hadir di klinik!
        $ticket->update([
            'is_checked_in' => true,
            'checked_in_at' => Carbon::now(),
            'status' => 'menunggu',
        ]);

        // Hitung urutan posisi pasien dalam antrean aktif setelah algoritma Priority + FIFO diterapkan
        $activeList = QueueTicket::activeQueue()->get();
        $position = $activeList->search(fn($item) => $item->id === $ticket->id);
        $positionDisplay = $position !== false ? $position + 1 : 1;

        return response()->json([
            'success' => true,
            'message' => "Validasi kehadiran berhasil! {$ticket->patient_name} (Tiket {$ticket->ticket_number}) masuk antrean urutan ke-{$positionDisplay} dengan prioritas {$ticket->priority}.",
            'ticket' => $ticket->fresh(),
            'queue_position' => $positionDisplay,
            'priority' => $ticket->priority,
        ]);
    }

    /**
     * Admin memanggil pasien ke ruangan poli
     */
    public function callPatient(Request $request): JsonResponse
    {
        $id = $request->input('id', $request->input('ticket_id'));

        if (!$id) {
            return response()->json([
                'success' => false,
                'message' => 'ID tiket tidak boleh kosong.',
            ], 422);
        }

        $ticket = QueueTicket::find($id);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => "Tiket ID {$id} tidak ditemukan.",
            ], 404);
        }

        $updateData = [
            'status' => 'dipanggil',
            'called_at' => Carbon::now(),
            'call_count' => ($ticket->call_count ?? 0) + 1,
        ];

        if ($request->filled('room') && $request->input('room') !== 'Semua') {
            $updateData['room'] = $request->input('room');
        }

        $ticket->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Nomor Antrean {$ticket->ticket_number} ({$ticket->patient_name}) dipanggil ke {$ticket->room}.",
            'ticket' => $ticket->fresh(),
        ]);
    }

    /**
     * Admin menandai penanganan selesai
     */
    public function completePatient(Request $request): JsonResponse
    {
        $id = $request->input('id', $request->input('ticket_id'));

        if (!$id) {
            return response()->json([
                'success' => false,
                'message' => 'ID tiket tidak boleh kosong.',
            ], 422);
        }

        $ticket = QueueTicket::find($id);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => "Tiket ID {$id} tidak ditemukan.",
            ], 404);
        }

        $ticket->update([
            'status' => 'selesai',
            'completed_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pasien {$ticket->patient_name} telah selesai ditangani.",
            'ticket' => $ticket->fresh(),
        ]);
    }

    /**
     * Ambil tiket aktif milik user saat ini
     */
    public function getMyTicket(): JsonResponse
    {
        $userId = Auth::id();
        $userEmail = Auth::user()?->email;

        $ticket = QueueTicket::where('user_id', $userId)
            ->whereIn('status', ['menunggu_checkin', 'menunggu', 'dipanggil'])
            ->latest()
            ->first();

        // Fallback jika belum ada tiket untuk user
        if (!$ticket && Auth::check()) {
            // Cek apakah ada tiket dengan nama atau user
            $ticket = QueueTicket::whereIn('status', ['menunggu_checkin', 'menunggu', 'dipanggil'])
                ->where('patient_name', Auth::user()->name)
                ->latest()
                ->first();
        }

        $position = null;
        if ($ticket && $ticket->is_checked_in) {
            $activeList = QueueTicket::activeQueue()->get();
            $pos = $activeList->search(fn($item) => $item->id === $ticket->id);
            $position = $pos !== false ? $pos + 1 : 1;
        }

        return response()->json([
            'success' => true,
            'has_ticket' => (bool)$ticket,
            'ticket' => $ticket,
            'position' => $position,
        ]);
    }
}
