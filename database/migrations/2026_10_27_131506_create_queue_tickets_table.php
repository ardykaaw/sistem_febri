<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number');
            $table->string('qr_code')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('patient_name');
            $table->string('patient_phone');
            $table->string('service');
            $table->string('doctor');
            $table->string('room');
            $table->string('priority')->default('Reguler'); // Darurat, Lansia, Anak, Reguler
            $table->integer('priority_score')->default(1);  // 4, 3, 2, 1
            $table->text('notes')->nullable();
            $table->boolean('is_checked_in')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->string('status')->default('menunggu_checkin'); // menunggu_checkin, menunggu, dipanggil, selesai, batal
            $table->timestamp('called_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_tickets');
    }
};
