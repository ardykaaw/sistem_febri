<?php

namespace Database\Seeders;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Example Admin Account
        $admin = User::updateOrCreate(
            ['email' => 'admin@klinikwansha.com'],
            [
                'name' => 'Admin Klinik Wansha',
                'role' => 'admin',
                'password' => bcrypt('admin123'),
                'email_verified_at' => now(),
            ]
        );

        // 2. Example User / Pasien Account
        $user = User::updateOrCreate(
            ['email' => 'user@klinikwansha.com'],
            [
                'name' => 'Pasien Budi Pratama',
                'role' => 'user',
                'password' => bcrypt('user123'),
                'email_verified_at' => now(),
            ]
        );

        // 3. Initial Queue Tickets demonstrating FIFO + Priority Scheduling
        QueueTicket::truncate();

        // A01: Pasien Darurat (Hadir duluan jam 08.15, Prioritas Darurat = Skor 4, Sedang Dipanggil di Poli 1)
        QueueTicket::create([
            'ticket_number' => 'A01',
            'qr_code' => 'WNS-QR-A01-EMG',
            'patient_name' => 'Siti Aminah',
            'patient_phone' => '0812-9844-1120',
            'service' => 'Sakit gigi akut & pembengkakan gusi',
            'doctor' => 'drg. Alya Nirmala, Sp.KG',
            'room' => 'Poli Gigi 1',
            'priority' => 'Darurat',
            'priority_score' => 4,
            'is_checked_in' => true,
            'checked_in_at' => Carbon::now()->subMinutes(45),
            'status' => 'dipanggil',
            'called_at' => Carbon::now()->subMinutes(10),
        ]);

        // A02: Pasien Lansia (Hadir jam 08.20, Prioritas Lansia = Skor 3, Menunggu di Poli 1)
        QueueTicket::create([
            'ticket_number' => 'A02',
            'qr_code' => 'WNS-QR-A02-OLD',
            'patient_name' => 'H. Suwandi',
            'patient_phone' => '0813-5561-2290',
            'service' => 'Pencabutan sisa akar gigi',
            'doctor' => 'drg. Alya Nirmala, Sp.KG',
            'room' => 'Poli Gigi 1',
            'priority' => 'Lansia',
            'priority_score' => 3,
            'is_checked_in' => true,
            'checked_in_at' => Carbon::now()->subMinutes(35),
            'status' => 'menunggu',
        ]);

        // A03: Pasien Anak (Hadir jam 08.30, Prioritas Anak = Skor 2, Sedang Dipanggil di Poli 2)
        QueueTicket::create([
            'ticket_number' => 'A03',
            'qr_code' => 'WNS-QR-A03-KID',
            'patient_name' => 'Keisha Putri (Anak)',
            'patient_phone' => '0857-1190-3344',
            'service' => 'Pemeriksaan gigi anak & fluoridasi',
            'doctor' => 'drg. Keisha Putri, Sp.KGA',
            'room' => 'Poli Gigi 2',
            'priority' => 'Anak',
            'priority_score' => 2,
            'is_checked_in' => true,
            'checked_in_at' => Carbon::now()->subMinutes(30),
            'status' => 'dipanggil',
            'called_at' => Carbon::now()->subMinutes(5),
        ]);

        // A04: Pasien Reguler (Hadir jam 08.35, Prioritas Reguler = Skor 1, Menunggu di Poli 3)
        QueueTicket::create([
            'ticket_number' => 'A04',
            'qr_code' => 'WNS-QR-A04-REG',
            'patient_name' => 'Rian Pratama',
            'patient_phone' => '0878-3312-9988',
            'service' => 'Tambal gigi estetik komposit',
            'doctor' => 'drg. Bimo Prasetyo, Sp.Ort',
            'room' => 'Poli Gigi 3',
            'priority' => 'Reguler',
            'priority_score' => 1,
            'is_checked_in' => true,
            'checked_in_at' => Carbon::now()->subMinutes(25),
            'status' => 'menunggu',
        ]);

        // A05: Tiket Pasien Budi Pratama (Belum Check-in / Menunggu Validasi QR di Klinik!)
        // Inilah tiket yang dimiliki oleh user@klinikwansha.com!
        QueueTicket::create([
            'ticket_number' => 'A05',
            'qr_code' => 'WNS-QR-A05-BUDI',
            'user_id' => $user->id,
            'patient_name' => 'Pasien Budi Pratama',
            'patient_phone' => '0812-3456-7890',
            'service' => 'Scaling karang gigi & kontrol rutin',
            'doctor' => 'drg. Alya Nirmala, Sp.KG',
            'room' => 'Poli Gigi 1',
            'priority' => 'Reguler',
            'priority_score' => 1,
            'is_checked_in' => false,
            'status' => 'menunggu_checkin',
            'created_at' => Carbon::now()->subMinutes(15),
        ]);
    }
}
