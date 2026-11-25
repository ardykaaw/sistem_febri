<?php

use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\QueueController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes untuk Aplikasi Mobile & Eksternal
|--------------------------------------------------------------------------
| Seluruh route di sini otomatis memiliki prefix '/api'
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// API Antrean & Pasien
Route::prefix('queue')->group(function () {
    Route::get('/live', [QueueController::class, 'getLiveQueue']);
    Route::get('/my-ticket', [QueueController::class, 'getMyTicket']);
    Route::post('/reserve', [QueueController::class, 'makeReservation']);
    Route::post('/validate-qr', [QueueController::class, 'validateQrCode']);
    Route::post('/call', [QueueController::class, 'callPatient']);
    Route::post('/complete', [QueueController::class, 'completePatient']);
});

// API Chatbot Konsultasi Gigi
Route::post('/chatbot', [ChatbotController::class, 'handleChat']);
