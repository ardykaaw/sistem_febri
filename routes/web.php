<?php

use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\QueueController;
use Illuminate\Support\Facades\Route;

// Halaman Utama & Halaman TV Display Realtime Klinik
Route::inertia('/', 'welcome')->name('home');
Route::inertia('/display', 'tv-display')->name('tv.display');
Route::inertia('/tv', 'tv-display'); // Alias mudah untuk display TV

// API Antrean & Validasi Kedatangan Pasien (FIFO + Priority Scheduling)
Route::prefix('api/queue')->group(function () {
    Route::get('/live', [QueueController::class, 'getLiveQueue']);
    Route::get('/my-ticket', [QueueController::class, 'getMyTicket']);
    Route::post('/reserve', [QueueController::class, 'makeReservation']);
    Route::post('/validate-qr', [QueueController::class, 'validateQrCode']);
    Route::post('/call', [QueueController::class, 'callPatient']);
    Route::post('/complete', [QueueController::class, 'completePatient']);
});

// API Chatbot Pintar (RAG & Gemini Integration)
Route::post('/api/chatbot', [ChatbotController::class, 'handleChat']);

// Dashboard Pasien & Admin (Menu Terpisah untuk Admin)
Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('admin/antrean', 'admin/queue-management')->name('admin.queue');
    Route::inertia('admin/scan', 'admin/scanner')->name('admin.scanner');
    Route::inertia('admin/reservasi', 'admin/reservations')->name('admin.reservations');
});

require __DIR__.'/settings.php';
