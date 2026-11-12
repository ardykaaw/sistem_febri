<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'qr_code',
        'user_id',
        'patient_name',
        'patient_phone',
        'service',
        'doctor',
        'room',
        'priority',
        'priority_score',
        'notes',
        'is_checked_in',
        'status',
        'call_count',
        'called_at',
        'completed_at',
    ];

    protected $casts = [
        'is_checked_in' => 'boolean',
        'call_count' => 'integer',
        'checked_in_at' => 'datetime',
        'called_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function getPriorityScore(string $priority): int
    {
        return match ($priority) {
            'Darurat' => 4,
            'Lansia' => 3,
            'Anak' => 2,
            default => 1,
        };
    }

    /**
     * Scope for active queues that have validated presence at the clinic
     * Sorted by Priority Scheduling (Darurat > Lansia > Anak > Reguler) + FIFO (Waktu Check-in)
     */
    public function scopeActiveQueue($query)
    {
        return $query->where('is_checked_in', true)
            ->whereIn('status', ['dipanggil', 'menunggu'])
            ->orderByRaw("CASE WHEN status = 'dipanggil' THEN 0 ELSE 1 END")
            ->orderByDesc('priority_score')
            ->orderBy('checked_in_at', 'asc')
            ->orderBy('id', 'asc');
    }
}
