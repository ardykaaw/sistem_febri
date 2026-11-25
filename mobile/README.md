# Aplikasi Mobile Pasien - Klinik Wansha

Folder ini berisi source code aplikasi mobile native Android & iOS untuk Klinik Wansha yang dibangun menggunakan **React + Capacitor**.

## Cara Menjalankan di Android Studio (PC / Windows / Mac):

1. **Buka Android Studio:**
   - Pilih menu **Open** (Buka Project).
   - Arahkan ke folder:
     ```
     sistem_antrian/mobile/android
     ```
     *(Buka langsung folder `android` di dalam folder `mobile` ini)*.

2. **Sinkronisasi Gradle:**
   - Biarkan Android Studio mendownload dependensi Gradle secara otomatis.

3. **Jalankan Aplikasi ke HP Android:**
   - Hubungkan HP Android ke komputer dengan kabel USB (pastikan *USB Debugging* aktif).
   - Pastikan HP terhubung ke Wi-Fi yang sama dengan server Laravel (atau atur IP server di aplikasi pada ikon pojok kanan atas).
   - Klik tombol **Run** (Play Hijau $\blacktriangleright$) di toolbar Android Studio.
   - Aplikasi akan otomatis ter-compile dan langsung terpasang di HP Android Anda.

## Struktur Folder:
- `android/` -> Project native Android Studio (Gradle, Manifest, Java MainActivity)
- `src/` -> Komponen tampilan React mobile (terkoneksi realtime ke API Laravel)
- `dist/` -> Web assets terkompilasi yang di-load oleh WebView native Capacitor
