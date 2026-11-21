# TECHNICAL SPECIFICATION DOCUMENT (TSD)

**Sistem Digitalisasi Praktik Mandiri Bidan & Rumah Sakit Terintegrasi**  
*(Dual-Frontend Vercel + Unified Backend VPS — Opsi A & RBAC 5 Role Terpadu)*

**Versi 3.0 Final (Sinkron DDL Gabungan 97 Tabel, Newborn Care & Notifikasi Email) — November 2026**

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Kelompok / Kelas** | Tanpa Ampun — Kelompok 01 — Sains Data B |
| **Tim Penyusun** | 1. Muhammad Dzikri Reyfandy (Project Leader & UI/UX)<br>2. Muhammad Ghazy Hikmatiar (Frontend Developer — Web RS)<br>3. Muhammad Naufal Hafizh Fauzia Putra (Frontend Developer — Web Bidan)<br>4. Rasya Pradipta Effendi (Backend & Database Developer) |
| **Pemilik Klinik / RS** | Ria Indrasti J., S.Keb. |
| **Dosen Pengampu** | Bambang Widoyono, S.T., M.T.I. |
| **Topologi Produksi** | Opsi A (Subdomain Terpisah): 2 SPA Frontend di Vercel (`bidan.[domain].id` & `rs.[domain].id`) + 1 Backend REST API (`api.[domain].id`) & SQL Server 2025 (97 tabel) di Server VPS |
| **Model Hak Akses (RBAC)** | 5 Role Utama (6 Profil Efektif): `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (sub-role: `PERAWAT` & `RESEPSIONIS`), dan `PASIEN` |

---

## Riwayat Revisi Dokumen

| Versi | Tanggal | Disusun Oleh | Status | Deskripsi Perubahan |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 | 02/11/2026 | Kelompok 01 | Baseline RSI | Versi awal TSD Praktik Mandiri Bidan (18 entitas, 51 endpoint), diturunkan dari FSD v1.0. |
| 1.1 | 17/11/2026 | Kelompok 01 | Revisi | Kanal notifikasi dan OTP diganti dari WhatsApp gateway menjadi email transaksional (SMTP/API). |
| 2.0 | 18/11/2026 | Kelompok 01 | Draft | Integrasi skema basis data Rumah Sakit (77 entitas Mini World) dan perluasan awal ke 95 endpoint. |
| 2.1 | 18/11/2026 | Kelompok 01 | Final | Pembaruan menyeluruh: (1) Arsitektur Dual-Frontend Hybrid (2 SPA Vercel + 1 Backend VPS via Opsi A Subdomain Terpisah); (2) Penyederhanaan & penyelarasan RBAC menjadi tepat 5 Role (`SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` [`PERAWAT` & `RESEPSIONIS`], `PASIEN`) beserta alasan bisnis per endpoint; (3) Pemulihan 100% route alias TSD v1.0 (`/sesi/*`) & ekspansi ke 121 endpoint; (4) Kelengkapan Specification Card (3.3), Skema Referensi RS (4.2), dan `sp_pulang_rawat_inap`. |
| 2.2 | 19/11/2026 | Kelompok 01 | Revisi | Audit kelengkapan layanan kebidanan: ANC, persalinan, dan KB sudah tercakup; layanan Baby Care / Newborn Care (asuhan bayi baru lahir, kunjungan neonatal KN1–KN3, pemantauan tumbuh kembang) ditambahkan: +5 endpoint (No. 112–116), +2 entitas (`asuhan_bbl`, `pemeriksaan_bayi`), +1 view, +2 audit trigger, perluasan pengingat H-1, dan seed katalog layanan KIA. Jumlah endpoint dikoreksi ke 126 sesuai tabel indeks (121 baris sebelumnya + 5). |
| 3.0 | 19/11/2026 | Kelompok 01 | Final | Sinkronisasi penuh dengan DDL gabungan (95 tabel) dan DBML: Bagian 4 diganti kamus data lengkap 97 tabel; nama objek disesuaikan (`audit_log`, `paket_detail`, `mutasi_stok`); `item_inventaris` dan `riwayat_stok` dihapus karena stok terpusat di `stok_batch`; status tempat tidur mengikuti `CHECK (KOSONG, TERISI, PEMBERSIHAN)`; penambahan `email` pada `pasien` dan `staf`, akun portal pasien (`pasien_id`, `sub_peran`), `catatan_pulang`, dan skrip `04_ddl_ekstensi_bidan_v3.sql`; endpoint 112 dipindah ke `/bayi/{id}/asuhan-bbl`; jumlah endpoint 117 dikoreksi menjadi 121 (v2.1) dan 126 (saat ini); sorotan revisi dihapus. |

---

## Lembar Persetujuan

| Peran | Nama | Tanggung Jawab | Tanggal |
| :--- | :--- | :--- | :--- |
| Project Leader & UI/UX | Muhammad Dzikri Reyfandy | TSD Bagian 0, 1, 2 & Desain RBAC 5 Role | 18/11/2026 |
| Frontend Developer (FE RS) | Muhammad Ghazy Hikmatiar | TSD Bagian 2, 3, 4 & Deploy FE RS di Vercel | 18/11/2026 |
| Frontend Developer (FE Bidan) | Muhammad Naufal Hafizh Fauzia Putra | TSD Bagian 2, 3, 5 & Deploy FE Bidan di Vercel | 18/11/2026 |
| Backend & DB Developer | Rasya Pradipta Effendi | TSD Bagian 3–6, RBAC Middleware & Deploy VPS | 18/11/2026 |
| Pemilik Klinik / RS | Ria Indrasti J., S.Keb. | Validasi Proses Bisnis & Pembagian Wewenang Role | 18/11/2026 |
| Dosen Pengampu | Bambang Widoyono, S.T., M.T.I. | Persetujuan Teknis TSD & Skema DB | 18/11/2026 |

---

## Ringkasan Perubahan & Pembaruan (What's New in TSD v2.1)

> **Catatan Pembaruan Utama Dokumen TSD v2.1**  
> Dokumen TSD v2.1 ini menyelaraskan dua kebutuhan akademik dan operasional sekaligus: mempertahankan antarmuka dan alur Praktik Mandiri Bidan sesuai FSD v1.0 (MK Rekayasa Sistem Informasi) serta mengimplementasikan penuh skema basis data Rumah Sakit (DDL gabungan 95 tabel) (MK Basis Data) di atas satu Backend API terpadu.  
> Pembaruan utama pada versi ini meliputi: (1) Penyederhanaan matriks hak akses (RBAC) menjadi tepat 5 Role operasional sesuai kebutuhan bisnis nyata—`SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (dengan sub-role `PERAWAT` dan `RESEPSIONIS`), serta `PASIEN`—lengkap dengan alasan bisnis pada setiap endpoint; (2) Standar deployment produksi Opsi A (Subdomain Terpisah) dengan arsitektur Hybrid Vercel + Server VPS; dan (3) Ekspansi 121 endpoint REST API termasuk route alias TSD v1.0 (`/sesi/*`).

### 0.1 Matriks Perbandingan Evolusi Sistem (v1.0 → v2.0 → v2.1)

| Aspek Teknis | TSD v1.0 (Baseline RSI) | TSD v2.0 (Draft Gabungan) | TSD v2.1 (Final — Saat Ini) |
| :--- | :--- | :--- | :--- |
| **Model Role & RBAC** | 3 Role (Bidan, Admin, Pasien) | 8 Role terpisah (Bidan, Dokter, Perawat, Apoteker, Admin, Kasir, Laboran, Radiolog) | Tepat 5 Role Bisnis Terpadu: `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (sub-role `PERAWAT` & `RESEPSIONIS`), dan `PASIEN` — dipetakan rinci ke seluruh 121 endpoint |
| **Cakupan Aplikasi Frontend** | 1 Aplikasi Web (Praktik Mandiri Bidan) | 1 Aplikasi Web Gabungan (Bidan + RS) | 2 Aplikasi Web SPA Terpisah (FE Bidan untuk MK RSI & FE RS untuk MK Basis Data) terhubung ke 1 Backend |
| **Hosting & Topologi Deployment** | Single Server IIS 10 (Static + Reverse Proxy) | Single Server IIS 10 (Static + Reverse Proxy) | Hybrid Vercel + VPS (Opsi A Subdomain Terpisah): FE Bidan & FE RS di Vercel CDN; Backend & DB di Server VPS |
| **Domain & Titik Akses** | 1 Domain tunggal klinik | 1 Domain tunggal RS-Klinik | 3 Subdomain terpisah: `bidan.[domain].id`, `rs.[domain].id`, dan `api.[domain].id` |
| **Jumlah Entitas Database** | 18 Entitas (Praktik Bidan) | DDL gabungan 95 tabel | 97 tabel (DDL gabungan 95 + 2 ekstensi KIA) beserta kolom `sub_peran` dan `pasien_id` pada tabel `akun_pengguna` |
| **Jumlah Endpoint REST API** | 51 Endpoint (`/sesi/*`, `/inventaris/*`, dll.) | 95 Endpoint (`/jadwal-praktik/*`, tanpa alias `/sesi/*`) | 121 Endpoint: 95 rute v2.0 + 4 route alias TSD v1.0 (`/sesi/*`) + 22 endpoint fitur RS & master referensi |
| **Stored Procedures & Objek DB** | 6 Stored Procedures | 8 Stored Procedures | 9 Stored Procedures (penambahan `sp_pulang_rawat_inap` & dual-mode stok pada `sp_simpan_kunjungan`) |

### 0.2 Tujuh Pilar Perubahan Kunci pada TSD v2.1

1. **Penyelarasan RBAC 5 Role & Penjelasan Bisnis per Endpoint:** Mengganti skema 8 role terfragmentasi di v2.0 menjadi tepat 5 role yang sesuai dengan struktur organisasi klinik/rumah sakit operasional: `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (dengan sub-role `PERAWAT` dan `RESEPSIONIS`), serta `PASIEN`. Pemisahan tugas (*Segregation of Duties*) diterapkan ketat: Resepsionis menangani front-office & kasir tanpa akses isi rekam medis; Perawat menangani asuhan klinis, triase, rawat inap, imunisasi, dan pengeluaran obat resep; Dokter memegang otoritas diagnosis, resep, operasi, dan pulang rawat inap; Admin Lokal mengelola operasional unit; Superadmin memegang kendali penuh lintas unit & pembuatan akun.
2. **Arsitektur Deployment Hybrid Vercel + Server VPS (Opsi A — Subdomain Terpisah):** Kedua frontend (`apps/fe-bidan` dan `apps/fe-rs`) di-deploy terpisah pada Vercel menggunakan pengaturan Root Directory monorepo, sementara Backend Express (`:3000`) dan SQL Server 2025 (`:1433`) di-deploy di Server VPS di balik subdomain HTTPS `api.[domain].id`.
3. **Pemulihan 100% Kompatibilitas Endpoint TSD v1.0 (`/sesi/*` & Adapter):** Backend menyertakan header deteksi klien (`X-Client-App: BIDAN | RS`) dan route alias `/api/v1/public/sesi/list`, `/api/v1/sesi/list`, `/api/v1/sesi`, serta `PATCH /api/v1/sesi/{id}` yang memetakan payload lama (`sesi_id`, `item_id`, `override_kuota`) ke tabel `jadwal_praktik` dengan filter default `unit_id = UNIT_BIDAN`.
4. **Ekspansi Endpoint API dari 95 menjadi 121 Endpoint:** Menambahkan 22 endpoint baru untuk menutup seluruh kebutuhan operasi Rumah Sakit dan master referensi (DDL gabungan 95 tabel) (kepulangan rawat inap, pembuatan akun staf, tambah ambulans & aset, pelaporan & investigasi insiden, pemulasaran jenazah, serta 12 endpoint master referensi).
5. **Kelengkapan Specification Card (Bagian 3.3) & Kamus Data (Bagian 4.3):** Melengkapi Specification Card yang sempat terlewat pada TSD v2.0 serta mendokumentasikan kamus data lengkap 97 tabel (kolom, tipe, constraint, dan relasi) pada Bagian 4.3.
6. **Penambahan Stored Procedure `sp_pulang_rawat_inap` & Stok FEFO Terpadu:** Menambahkan stored procedure `sp_pulang_rawat_inap` untuk menutup episode rawat inap secara atomik, serta memperbarui `sp_simpan_kunjungan` agar memotong stok per batch (FEFO) pada `stok_batch` dan mencatat `mutasi_stok` untuk seluruh unit, termasuk Poli KIA/Bidan.
7. **Pembaruan Konfigurasi Keamanan CORS & Environment Variables (`.env`):** Menambahkan variabel lingkungan produksi baru untuk integrasi Vercel dan VPS, yaitu `ALLOWED_ORIGINS` dan `DEFAULT_UNIT_BIDAN_ID`.

---

## TSD Bagian 1 — System Architecture Specification

### 1.1 Arsitektur Dual-Frontend Hybrid (2 SPA Vercel + 1 Unified Backend VPS)

Untuk memenuhi kebutuhan akademik dan operasional secara bersamaan—di mana mata kuliah Rekayasa Sistem Informasi (RSI) mewajibkan tampilan dan alur Praktik Mandiri Bidan sesuai FSD/TSD v1.0, sedangkan mata kuliah Basis Data mewajibkan implementasi penuh skema Rumah Sakit (DDL gabungan 95 tabel)—sistem menerapkan pola **Single Unified Backend + Dual SPA Frontend** berbasis Hybrid Cloud-VPS:

- **Client A — Web Bidan di Vercel (MK RSI):** Aplikasi React SPA yang di-deploy pada Vercel (`https://bidan.[domain].id`). Mempertahankan seluruh antarmuka, terminologi (Sesi Praktik, Inventaris Bidan, Pemeriksaan KIA/ANC/KB/Imunisasi/Newborn Care), dan alur 19 fungsi FSD v1.0. Mengirim header `X-Client-App: BIDAN` secara otomatis melalui Axios interceptor.
- **Client B — Web Rumah Sakit di Vercel (MK Basis Data):** Aplikasi React SPA lengkap yang di-deploy pada Vercel (`https://rs.[domain].id`) untuk manajemen Rumah Sakit terintegrasi (Poliklinik Multi-Unit, Rawat Inap & Bed Management, IGD & Triase, Kamar Operasi, Penunjang Lab/Radiologi, Farmasi Multi-Gudang FEFO, Ambulans, Aset, Klaim BPJS/Asuransi, dan Insiden Keselamatan). Mengirim header `X-Client-App: RS`.
- **Unified Backend & Database di Server VPS:** Satu layanan Express.js yang di-deploy pada Server VPS (`https://api.[domain].id`) dan mengekspos 126 endpoint REST (`/api/v1/*`), termasuk route alias `/sesi/*` dari TSD v1.0 dan adapter payload sehingga baik `fe-bidan` maupun `fe-rs` beroperasi konsisten di atas satu database SQL Server 2025 tanpa duplikasi logika bisnis.

### 1.2 Definisi Role & Keselarasan Kebutuhan Bisnis (RBAC 5 Role)

Sistem membatasi hak akses hanya pada 5 Role utama (dengan 2 sub-role pada `STAFF`) agar sesuai dengan tata kelola klinik maupun rumah sakit serta prinsip pemisahan tugas (*Segregation of Duties*):

| Role / Sub-Role | Kode JWT / DB | Pemangku Kepentingan | Tanggung Jawab & Batasan Kebutuhan Bisnis |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `peran: 'SUPERADMIN'`<br>`sub_peran: NULL` | Pemilik Klinik / Direktur RS / Kepala IT Fasilitas | Otoritas tertinggi lintas seluruh unit (Bidan & RS). Berhak membentuk unit pelayanan baru, membuat akun pengguna & menetapkan role staf, mengaudit seluruh transaksi keuangan & `audit_log` lintas unit, serta bertindak sebagai pemegang kendali darurat (*override*) pada seluruh modul. |
| **Admin Lokal** | `peran: 'ADMIN_LOKAL'`<br>`sub_peran: NULL` | Kepala Tata Usaha / Admin Operasional Unit | Mengelola operasional non-medis di tingkat unit/fasilitas: mengatur jadwal/sesi praktik & kuota, mengelola master data (layanan, ruangan, obat, pemasok, aset, ambulans), melakukan restock inventaris/batch obat, memperbarui tarif/harga (*append-only*), mengelola konten publik, memantau rekap keuangan, dan menginvestigasi insiden. Dilarang mengubah diagnosis/rekam medis klinis dan dilarang membuat akun Superadmin. |
| **Dokter** | `peran: 'DOKTER'`<br>`sub_peran: NULL` | Dokter Umum, Dokter Spesialis, & Bidan Praktisi Klinis Utama | Pemegang otoritas klinis tertinggi: memeriksa pasien, membaca & mengisi Rekam Medis Elektronik (RME), menegakkan diagnosis ICD-10, menerbitkan resep obat, menangani kehamilan/ANC/persalinan/KB/bayi baru lahir (*newborn care*), menjadwalkan & memimpin tindakan kamar operasi, menerbitkan order penunjang lab/radiologi, menyetujui kepulangan (*discharge*) rawat inap, serta menindaklanjuti laporan insiden medis. |
| **Staff — Perawat** | `peran: 'STAFF'`<br>`sub_peran: 'PERAWAT'` | Perawat Poli/IGD/Bangsal & Bidan Pelaksana | Menjalankan asuhan keperawatan/kebidanan dan penunjang klinis: melakukan triase IGD (P1–P5), skrining alergi/tanda vital & konfirmasi *red-flag*, mencatat pemeriksaan ANC/imunisasi/KB/asuhan bayi baru lahir & kunjungan neonatal sesuai delegasi, mengatur penempatan/mutasi tempat tidur rawat inap, mencatat CPPT/visite keperawatan, menyiapkan & mengeluarkan obat resep berdasarkan FEFO, menginput hasil lab/radiologi, serta mencatat pemulasaran jenazah. |
| **Staff — Resepsionis** | `peran: 'STAFF'`<br>`sub_peran: 'RESEPSIONIS'` | Petugas Front-Office, Pendaftaran, & Kasir | Mengelola alur masuk-keluar pasien dan administrasi pembayaran: mendaftarkan pasien walk-in, menjadwalkan ulang atau membatalkan reservasi, memanggil antrean pendaftaran, memantau ketersediaan bed admisi, mencetak & menerima pembayaran tagihan (kasir), memverifikasi klaim BPJS/asuransi, serta mencatat penugasan ambulans. Dilarang keras mengakses rincian rekam medis/diagnosis pasien (kerahasiaan medis). |
| **Pasien** | `peran: 'PASIEN'`<br>`sub_peran: NULL` | Pasien Klinik/RS & Pengunjung Portal Publik | Akses mandiri (*self-service*) pada portal publik maupun akun pasien: melihat profil klinik/RS, katalog layanan & tarif publik, memantau jadwal/sesi praktik & sisa kuota secara real-time, mengecek status kepesertaan pasien baru/lama, serta melakukan reservasi antrean secara online. |

### 1.3 Technology Stack

| Layer | Teknologi | Versi & Keterangan |
| :--- | :--- | :--- |
| **Frontend 1 (FE Bidan)** | Vite + React JS (Vercel) | React 18.3.x, Vite 5.4.x, `react-router-dom` 6.x, `axios` 1.x, `recharts` 2.x; di-deploy ke Vercel CDN (`bidan.[domain].id`) |
| **Frontend 2 (FE RS)** | Vite + React JS (Vercel) | React 18.3.x, Vite 5.4.x, `react-router-dom` 6.x, `axios` 1.x, `recharts` 2.x; di-deploy ke Vercel CDN (`rs.[domain].id`) |
| **Backend API** | Express JS (Server VPS) | Node.js 22 LTS, Express 4.21.x; `zod` 3.x, `jsonwebtoken` 9.x, `bcrypt` 5.x, `helmet` 7.x, `express-rate-limit` 7.x, `cors` 2.8.x |
| **Database** | SQL Server 2025 (Server VPS) | 97 tabel (95 DDL gabungan + 2 ekstensi KIA); driver `mssql` 11.x; query terparametrisasi, 9 stored procedure atomik, 17 view, & 25 trigger audit |
| **Reverse Proxy VPS** | IIS 10 + ARR / Nginx / Caddy | Terminasi SSL/TLS 1.3 untuk subdomain `api.[domain].id` dan meneruskan trafik HTTPS `:443` ke Express `:3000` |
| **Proses Backend** | PM2 5.4.x | Manajer proses Node.js pada Server VPS (auto-restart, startup service, log rotation) |
| **Penjadwal** | `node-cron` 3.x | H-1 08:00 WIB (reservasi, kontrol KB & kunjungan neonatal/tumbuh kembang bayi); Senin 07:00 WIB (stok obat, KIR ambulans, kalibrasi aset); zona `Asia/Jakarta` |
| **Berkas Laporan** | `pdfkit` 0.15.x, `exceljs` 4.4.x | Ekspor PDF RME & laporan operasional/keuangan Excel (`.xlsx`) |
| **Notifikasi** | Layanan Email SMTP/API | SMTP/TLS (port 587) atau API email transaksional. SELURUH notifikasi dan OTP via email — tanpa WhatsApp/SMS. |
| **Autentikasi** | JWT + RBAC 5 Role + Client Context | HS256, exp 30 menit (sliding via `/auth/refresh`), Bearer token membawa `{ akun_id, peran, sub_peran, unit_id }` & header `X-Client-App` |

### 1.4 Deployment Architecture Diagram & Struktur Monorepo

```text
[Browser Pengguna]
  ├──► https://bidan.[domain].id ──► [Vercel Edge CDN: apps/fe-bidan] ──┐
  └──► https://rs.[domain].id    ──► [Vercel Edge CDN: apps/fe-rs]    ──┼──► HTTPS + JWT (5 Role) + X-Client-App
                                                                        ▼
                                                 [Server VPS: https://api.[domain].id]
                                                   └──► Reverse Proxy HTTPS (:443, TLS 1.3)
                                                          └──► Express API (:3000 via PM2)
                                                                 ├──► [SQL Server 2025 :1433 (Privat)]
                                                                 ├──► [node-cron Jobs (H-1 & Mingguan)]
                                                                 └──► [SMTP Email Server :587]
```

#### Struktur Direktori Monorepo Proyek

```text
sistem-kesehatan-terintegrasi/
├── package.json                  # npm workspaces: ["apps/*"]
├── ecosystem.config.cjs          # Konfigurasi PM2 produksi di Server VPS
├── database/
│   ├── 03_ddl_schema_gabungan.sql  # DDL gabungan 95 tabel (RSI + Mini World RS)
│   ├── 04_ddl_ekstensi_bidan_v3.sql  # Ekstensi: akun pasien, sub_peran, email, catatan_pulang, 2 tabel newborn care (jadi 97 tabel)
│   ├── 05_functions_views.sql    # 5 Scalar Functions + 18 Views
│   ├── 06_stored_procedures.sql  # 9 Stored Procedures atomik (termasuk sp_pulang_rawat_inap)
│   ├── 07_audit_triggers.sql     # 27 Audit Triggers + trg_audit_logs_immutable
│   └── 08_seed_bidan_rs.sql      # Master Unit Bidan (UNIT_BIDAN), Unit RS, & Akun Demo 5 Role, & Katalog Layanan KIA (ANC, Persalinan, KB, Newborn Care)
└── apps/
    ├── backend/                  # Express.js Unified REST API -> Deploy ke Server VPS (:3000)
    │   └── src/
    │       ├── app.js            # Helmet, CORS (whitelist 2 domain Vercel), Rate Limiter, ClientContext
    │       ├── middleware/       # auth.js, rbac.js (authorizeRoles), clientContext.js, sessionContext.js
    │       ├── routes/v1/
    │       │   ├── index.js      # Registrasi 126 endpoint v1 dengan guard RBAC 5 Role
    │       │   ├── legacy-bidan.routes.js  # Adapter /sesi/* -> jadwal_praktik & payload mapping
    │       │   └── ...           # auth, public, pendaftaran, rme, kia, rawat-inap, igd, operasi, dll.
    │       ├── controllers/      # Validasi Zod & pemanggilan Service
    │       ├── services/         # Logika bisnis & pemetaan kode hasil SP ke ERR-*
    │       ├── repositories/     # Eksekusi mssql parameterized query & SP
    │       └── jobs/             # cronReminderH1.js, cronInventoryWeekly.js, cronMaintenance.js, emailWorker.js
    ├── fe-bidan/                 # Vite + React SPA -> Deploy ke Vercel Project 1 (bidan.[domain].id)
    │   ├── vercel.json           # Aturan rewrite /* -> /index.html untuk React Router SPA
    │   └── src/lib/api.js        # Axios client dengan header 'X-Client-App': 'BIDAN'
    └── fe-rs/                    # Vite + React SPA -> Deploy ke Vercel Project 2 (rs.[domain].id)
        ├── vercel.json           # Aturan rewrite /* -> /index.html untuk React Router SPA
        └── src/lib/api.js        # Axios client dengan header 'X-Client-App': 'RS'
```

---

## TSD Bagian 2 — Environment & Panduan Deployment Opsi A (Vercel + Server VPS)

### 2.1 Environment Comparison (Dev / Staging / Production)

| Spesifikasi | Development | Staging | Production (Opsi A: Vercel + VPS) |
| :--- | :--- | :--- | :--- |
| **Hardware / Hosting** | Laptop anggota tim (min 8 GB RAM) | Vercel Preview + VPS Staging | Frontend: Vercel Edge Network<br>Backend & DB: VPS 2 vCPU / 4 GB RAM / 50 GB SSD |
| **OS Server** | Windows 10/11 | Windows Server 2022 / Linux | Windows Server 2022 (atau Ubuntu LTS) |
| **Web Server / CDN** | Vite dev server (`:5173` FE Bidan, `:5174` FE RS) | Vercel Preview + Reverse Proxy | Frontend: Vercel CDN otomatis<br>Backend: IIS 10 + ARR / Nginx / Caddy |
| **Backend** | Node.js 22 LTS (`npm run dev :3000`) | Node.js 22 LTS + PM2 | Node.js 22 LTS + PM2 (Windows Service / Systemd) |
| **Database** | SQL Server 2025 (lokal/Docker) | SQL Server 2025 | SQL Server 2025 (97 tabel, port 1433 privat) |
| **Notifikasi** | Simulasi (log konsol / Mailtrap) | Email SMTP sandbox | Email SMTP / API transaksional sungguhan |
| **URL Akses** | `localhost:5173` (Bidan), `localhost:5174` (RS), `localhost:3000` (API) | Preview URL Vercel + `staging-api.[domain].id` | FE Bidan: `https://bidan.[domain].id`<br>FE RS: `https://rs.[domain].id`<br>Backend API: `https://api.[domain].id` |
| **SSL / TLS** | HTTP lokal | TLS 1.3 otomatis | Vercel SSL otomatis (FE) + Let's Encrypt / Win-ACME (`api.[domain].id`) |

### 2.2 Panduan Teknis Deployment Produksi Opsi A (Vercel + Server VPS)

Opsi A memisahkan beban penyajian antarmuka statis ke jaringan CDN Vercel dan memusatkan komputasi API serta basis data SQL Server 2025 pada Server VPS melalui tiga subdomain terpisah:

#### Tahap 1 — Persiapan Kode Sebelum Deployment

- **1.1 Konfigurasi SPA Rewrite (`vercel.json`):** Karena `fe-bidan` dan `fe-rs` menggunakan `react-router-dom` (SPA), wajib ditambahkan file `vercel.json` di dalam masing-masing direktori aplikasi (`apps/fe-bidan/vercel.json` dan `apps/fe-rs/vercel.json`) agar refresh halaman pada sub-rute tidak menghasilkan error `404 NOT_FOUND` di Vercel:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **1.2 Konfigurasi CORS Whitelist Lintas Origin di Backend:** Middleware `cors()` pada `apps/backend/src/app.js` wajib membaca daftar origin Vercel dari variabel lingkungan `ALLOWED_ORIGINS` dan mengizinkan custom header `X-Client-App` serta `Authorization`:

```javascript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-App'],
  credentials: true,
}));
```

#### Tahap 2 — Deployment 2 Aplikasi Frontend ke Vercel (Monorepo)

Satu repositori GitHub monorepo di-import sebanyak 2 kali pada dashboard Vercel untuk membentuk dua proyek terpisah:

| Parameter Vercel | Project 1: Frontend Bidan (MK RSI) | Project 2: Frontend Rumah Sakit (MK Basis Data) |
| :--- | :--- | :--- |
| **Git Repository** | Repositori GitHub Monorepo yang sama | Repositori GitHub Monorepo yang sama |
| **Root Directory** | `apps/fe-bidan` | `apps/fe-rs` |
| **Framework Preset** | Vite | Vite |
| **Build Command** | `npm run build` | `npm run build` |
| **Output Directory** | `dist` | `dist` |
| **Environment Variable** | `VITE_API_URL = https://api.[domain].id/api/v1` | `VITE_API_URL = https://api.[domain].id/api/v1` |
| **Custom Domain** | `bidan.[domain].id` | `rs.[domain].id` |

#### Tahap 3 — Deployment Backend & SQL Server 2025 di Server VPS

- **3.1 Setup Database SQL Server 2025:** Instal SQL Server 2025 pada Server VPS dengan port 1433 hanya terbuka untuk localhost/privat (diblokir dari publik di firewall). Buat database `MiniWorldRS` dan jalankan 6 skrip SQL berurutan: `03_ddl_schema_gabungan.sql`, `04_ddl_ekstensi_bidan_v3.sql`, `05_functions_views.sql`, `06_stored_procedures.sql`, `07_audit_triggers.sql`, dan `08_seed_bidan_rs.sql` (yang sudah memuat akun demo untuk Superadmin, Admin Lokal, Dokter, Staff Perawat, Staff Resepsionis, dan Pasien).
- **3.2 Instalasi Backend & PM2 Process Manager:** Clone repositori ke VPS, jalankan `npm install`, buat file `apps/backend/.env` berisi koneksi DB, `JWT_SECRET`, konfigurasi SMTP, `DEFAULT_UNIT_BIDAN_ID`, dan `ALLOWED_ORIGINS=https://bidan.[domain].id,https://rs.[domain].id`. Jalankan proses backend via PM2 (`pm2 start ecosystem.config.cjs && pm2 save`).
- **3.3 Terminasi SSL/TLS Reverse Proxy (`https://api.[domain].id`):** Karena kedua frontend di Vercel otomatis berjalan di atas HTTPS, browser akan memblokir request ke backend HTTP (*Mixed Content Error*). Subdomain `api.[domain].id` wajib dipasang Reverse Proxy + SSL/TLS (port 443 -> `http://127.0.0.1:3000`) menggunakan IIS 10 + ARR + Win-ACME (Windows Server) atau Nginx + Certbot / Caddy (Linux).

#### Tahap 4 — Pengaturan DNS Domain & Verifikasi Produksi

| Type | Name / Host | Target / Value | Fungsi Routing |
| :--- | :--- | :--- | :--- |
| `CNAME` | `bidan` | `cname.vercel-dns.com` | Mengarahkan `https://bidan.[domain].id` ke Project 1 Vercel (`fe-bidan`) |
| `CNAME` | `rs` | `cname.vercel-dns.com` | Mengarahkan `https://rs.[domain].id` ke Project 2 Vercel (`fe-rs`) |
| `A` | `api` | `[IP_Publik_Server_VPS]` | Mengarahkan `https://api.[domain].id` ke Reverse Proxy Server VPS |

**Checklist Verifikasi Pasca-Deploy:**
1. Pastikan `https://api.[domain].id/api/v1/public/layanan/list` merespons JSON valid dengan sertifikat SSL aktif;
2. Uji login menggunakan seluruh 6 profil akun (Superadmin, Admin Lokal, Dokter, Staff Perawat, Staff Resepsionis, dan Pasien) untuk memastikan middleware RBAC mengizinkan endpoint yang berhak dan menolak (`403 Forbidden`) akses di luar wewenang bisnis masing-masing;
3. Tekan F5/refresh pada sub-rute React Router di kedua domain Vercel untuk memastikan aturan rewrite `vercel.json` bekerja tanpa 404.

---

## TSD Bagian 3 — API Architecture & Matriks Role per Endpoint (126 Endpoints)

### 3.1 RESTful Standards & Mekanisme Guard RBAC 5 Role

- **Prefix API:** Base URL: `/api/v1/` (seluruh 126 endpoint memakai prefix ini, diakses dari Vercel melalui `https://api.[domain].id/api/v1/*`).
- **Payload JWT RBAC:** Struktur Klaim JWT: Token JWT memuat `{ akun_id, staf_id, pasien_id, peran, sub_peran, unit_id }` di mana `peran` bernilai salah satu dari `['SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF', 'PASIEN']`, dan khusus `peran = 'STAFF'` disertai `sub_peran` bernilai `'PERAWAT'` atau `'RESEPSIONIS'`.
- **Validasi Middleware:** Middleware `authorizeRoles(...allowedProfiles)`: Mengevaluasi kombinasi `peran` dan `sub_peran`. Jika tidak cocok, server mengembalikan HTTP `403 Forbidden` dengan kode error `ERR-AUTH-03`.
- **Konteks Dual-FE:** Kompatibilitas v1.0 & Dual-FE: Header `X-Client-App` (`'BIDAN' | 'RS'`) menentukan filter default `unit_id`, dan route alias `/sesi/*` tetap aktif bagi FE Bidan.

### 3.2 Complete Endpoint Index & Penjelasan Bisnis per Role (126 Endpoints)

Tabel berikut memetakan seluruh 126 endpoint beserta role yang diizinkan dan alasan bisnis/klinis di balik pembatasan aksesnya:

| No | Method | URL Endpoint | Role yang Diizinkan | Penjelasan Kebutuhan Bisnis & Alasan Otorisasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/v1/auth/login` | Semua Role (Public) | Verifikasi kredensial & penerbitan JWT berisi `peran` & `sub_peran` untuk Superadmin, Admin Lokal, Dokter, Staff (Perawat/Resepsionis), maupun Pasien. |
| 2 | `POST` | `/api/v1/auth/logout` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT` & `RESEPSIONIS`), `PASIEN` | Mengakhiri sesi aktif pengguna yang sedang login dan mencatat aktivitas logout ke `audit_log`. |
| 3 | `POST` | `/api/v1/auth/refresh` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT` & `RESEPSIONIS`), `PASIEN` | Memperpanjang masa berlaku token JWT (*sliding window* 30 menit) selama pengguna masih aktif bekerja. |
| 4 | `POST` | `/api/v1/auth/reset/request` | Semua Role (Public) | Mengirim kode OTP 6 digit ke email terdaftar ketika staf atau pasien lupa kata sandi. |
| 5 | `POST` | `/api/v1/auth/reset/verify` | Semua Role (Public) | Memvalidasi OTP email dan memperbarui hash kata sandi baru secara aman. |
| 6 | `POST` | `/api/v1/public/konten/list` | `PASIEN` (Publik & Portal) | Menampilkan profil fasilitas, informasi dokter/bidan, galeri, dan testimoni bagi calon pasien dan masyarakat umum. |
| 7 | `POST` | `/api/v1/public/layanan/list` | `PASIEN` (Publik & Portal) | Menampilkan daftar layanan medis/kebidanan aktif beserta tarif dasar sebagai transparansi informasi sebelum reservasi. |
| 8 | `POST` | `/api/v1/public/jadwal/list` | `PASIEN` (Publik & Portal) | Menampilkan jadwal praktik dan sisa kuota harian (v2.0) agar pasien dapat memilih waktu kunjungan yang tersedia. |
| 8a | `POST` | `/api/v1/public/sesi/list` | `PASIEN` (Publik & Portal) | **[Alias TSD v1.0]** Menampilkan sesi praktik & sisa kuota bidan pada halaman pendaftaran publik FE Bidan. |
| 9 | `POST` | `/api/v1/public/pasien/cek` | `PASIEN` (Publik & Portal) | Mengecek apakah NIK/No. RM sudah terdaftar sebagai pasien lama atau baru sebelum membuat reservasi online. |
| 10 | `POST` | `/api/v1/public/reservasi` | `PASIEN` (Publik & Portal) | Memungkinkan pasien mendaftar antrean secara mandiri dari rumah dan menerima kode booking via email. |
| 11 | `POST` | `/api/v1/pasien/identitas/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Pencarian identitas demografis pasien (tanpa membuka riwayat diagnosis RME) untuk keperluan pendaftaran, layanan klinis, dan administrasi. |
| 12 | `POST` | `/api/v1/pasien/walk-in` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Pendaftaran pasien yang datang langsung ke meja pendaftaran (*front-office*) merupakan tugas utama Resepsionis. |
| 13 | `POST` | `/api/v1/reservasi/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Monitoring antrean harian lintas unit: Resepsionis mengatur alur kedatangan, Perawat & Dokter memantau pasien siap periksa. |
| 14 | `PATCH` | `/api/v1/reservasi/{id}/jadwal` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Penjadwalan ulang (*reschedule*) kunjungan pasien merupakan fungsi administrasi front-office oleh Resepsionis/Admin. |
| 15 | `PATCH` | `/api/v1/reservasi/{id}/batal` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Pembatalan reservasi dan penataan ulang nomor antrean dikelola meja pendaftaran agar kuota dapat dialihkan. |
| 16 | `POST` | `/api/v1/jadwal-praktik/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Melihat daftar jadwal praktik dokter/bidan untuk koordinasi layanan front-office maupun tim medis. |
| 16a | `POST` | `/api/v1/sesi/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | **[Alias TSD v1.0]** Melihat daftar sesi praktik pada FE Bidan. |
| 17 | `POST` | `/api/v1/jadwal-praktik` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembukaan jadwal praktik baru dan penetapan kuota pasien merupakan kewenangan tata usaha/Admin Lokal & Superadmin. |
| 17a | `POST` | `/api/v1/sesi` | `SUPERADMIN`, `ADMIN_LOKAL` | **[Alias TSD v1.0]** Pembuatan sesi praktik baru pada FE Bidan oleh Admin Lokal/Superadmin. |
| 18 | `PATCH` | `/api/v1/jadwal-praktik/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Perubahan jam praktik, kuota, atau penonaktifan jadwal dikendalikan Admin Lokal/Superadmin. |
| 18a | `PATCH` | `/api/v1/sesi/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | **[Alias TSD v1.0]** Pembaruan status/kuota sesi praktik pada FE Bidan oleh Admin Lokal/Superadmin. |
| 19 | `PATCH` | `/api/v1/reservasi/{id}/status` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Resepsionis memanggil pasien ke loket registrasi; Perawat & Dokter memanggil pasien masuk ruang periksa dan menandai selesai. |
| 20 | `POST` | `/api/v1/pasien/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencarian pasien disertai indikator peringatan medis (*red-flag*); dibatasi hanya untuk tenaga klinis demi kerahasiaan medis. |
| 21 | `POST` | `/api/v1/pasien/{id}/rme/detail` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Akses penuh profil klinis & riwayat RME pasien. Resepsionis & Admin Lokal diblokir untuk menjaga kerahasiaan rekam medis. |
| 22 | `POST` | `/api/v1/pasien/{id}/alergi` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Perawat mencatat temuan alergi obat saat skrining awal; Dokter memvalidasi dan menambahkan kondisi risiko tinggi. |
| 23 | `PATCH` | `/api/v1/alergi/{id}` | `SUPERADMIN`, `DOKTER` | Perubahan status klinis atau penonaktifan riwayat alergi/risiko tinggi memerlukan pertimbangan medis Dokter. |
| 24 | `POST` | `/api/v1/pasien/{id}/red-flag/konfirmasi` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Konfirmasi wajib sebelum tindakan medis bahwa tenaga klinis telah membaca peringatan alergi/risiko tinggi pasien. |
| 25 | `POST` | `/api/v1/pasien/{id}/kunjungan` | `SUPERADMIN`, `DOKTER` | Penetapan diagnosis akhir (ICD-10), tindakan medis, dan peresepan obat merupakan kewenangan eksklusif Dokter. |
| 26 | `PATCH` | `/api/v1/kunjungan/{id}/catatan` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Catatan perkembangan terintegrasi (CPPT *append-only*): Perawat mencatat asuhan keperawatan, Dokter mencatat evaluasi medis. |
| 27 | `POST` | `/api/v1/pasien/{id}/rme/export` | `SUPERADMIN`, `DOKTER` | Penerbitan dokumen resume medis PDF resmi untuk rujukan atau kebutuhan pasien disahkan oleh Dokter. |
| 28 | `POST` | `/api/v1/pasien/{id}/kehamilan/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Membaca riwayat obstetri/kehamilan ibu untuk pemantauan antenatal terpadu oleh Dokter & Perawat/Bidan pelaksana. |
| 29 | `POST` | `/api/v1/pasien/{id}/kehamilan` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Registrasi episode kehamilan baru dan kalkulasi HPL saat kunjungan pertama ibu hamil. |
| 30 | `POST` | `/api/v1/kehamilan/{id}/anc/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat grafik dan riwayat pemeriksaan Antenatal Care (ANC) pasien. |
| 31 | `POST` | `/api/v1/kehamilan/{id}/anc` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencatatan pemeriksaan kehamilan rutin (tinggi fundus, DJJ, tekanan darah, status gizi) oleh Dokter/Perawat KIA. |
| 32 | `POST` | `/api/v1/kehamilan/{id}/persalinan` | `SUPERADMIN`, `DOKTER` | Pencatatan tindakan persalinan dan komplikasi intrapartum dipimpin oleh penolong persalinan utama (Dokter/Bidan Koordinator). |
| 33 | `POST` | `/api/v1/persalinan/{id}/bayi` | `SUPERADMIN`, `DOKTER` | Pencatatan kelahiran bayi baru lahir (APGAR, berat/panjang lahir) sekaligus pembuatan No. RM bayi secara otomatis. |
| 34 | `POST` | `/api/v1/pasien/{id}/imunisasi/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat riwayat dan jadwal imunisasi anak/ibu. |
| 35 | `POST` | `/api/v1/pasien/{id}/imunisasi` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pemberian suntikan imunisasi dan pencatatan nomor batch vaksin merupakan tugas rutin Perawat/Bidan KIA & Dokter. |
| 36 | `POST` | `/api/v1/pasien/{id}/kb/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat riwayat penggunaan kontrasepsi dan tanggal jatuh tempo kontrol KB. |
| 37 | `POST` | `/api/v1/pasien/{id}/kb` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencatatan pelayanan KB (suntik, pil, IUD, implan) dan penjadwalan pengingat kontrol H-1 otomatis. |
| 38 | `POST` | `/api/v1/kunjungan/{id}/tagihan/detail` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Resepsionis (fungsi kasir) memeriksa rincian biaya tindakan dan obat untuk ditagihkan kepada pasien saat kepulangan. |
| 39 | `POST` | `/api/v1/tagihan/{id}/pembayaran` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Penerimaan pembayaran tunai/non-tunai dan penerbitan kwitansi lunas merupakan tugas utama Resepsionis sebagai kasir. |
| 40 | `POST` | `/api/v1/tagihan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Pemantauan daftar tagihan belum lunas dan riwayat transaksi kasir harian. |
| 41 | `POST` | `/api/v1/keuangan/rekap/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Resepsionis melakukan tutup kas (*closing shift* harian); Admin Lokal & Superadmin memantau rekapitulasi pendapatan bulanan. |
| 42 | `POST` | `/api/v1/inventaris/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat stok obat dan BHP praktik bidan agar dokter/perawat mengetahui ketersediaan sebelum meresepkan. |
| 43 | `POST` | `/api/v1/inventaris` | `SUPERADMIN`, `ADMIN_LOKAL` | Penambahan item inventaris baru ke katalog klinik merupakan tugas administrasi logistik oleh Admin Lokal/Superadmin. |
| 44 | `PATCH` | `/api/v1/inventaris/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembaruan satuan, batas stok minimum, atau status aktif item inventaris dikelola Admin Lokal. |
| 45 | `POST` | `/api/v1/inventaris/{id}/restock` | `SUPERADMIN`, `ADMIN_LOKAL` | Pencatatan barang masuk dari pemasok (*restock*) dikendalikan Admin Lokal agar terpisah dari pemakaian klinis. |
| 46 | `POST` | `/api/v1/inventaris/{id}/riwayat/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Audit kartu stok (masuk/keluar) untuk mencegah selisih fisik inventaris. |
| 47 | `POST` | `/api/v1/obat/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Katalog master obat & alkes RS; diakses Dokter saat meresepkan dan Perawat/Admin untuk pengelolaan farmasi. |
| 48 | `POST` | `/api/v1/obat` | `SUPERADMIN`, `ADMIN_LOKAL` | Registrasi master obat baru ke dalam formularium RS dikendalikan Admin Lokal & Superadmin. |
| 49 | `PATCH` | `/api/v1/obat/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembaruan spesifikasi master obat dan stok minimum RS. |
| 50 | `POST` | `/api/v1/obat/{id}/batch/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`) | Pemantauan tanggal kedaluwarsa dan urutan FEFO setiap batch obat. |
| 51 | `POST` | `/api/v1/obat/{id}/batch` | `SUPERADMIN`, `ADMIN_LOKAL` | Penerimaan batch obat baru dari distributor ke gudang utama RS merupakan wewenang logistik Admin Lokal. |
| 52 | `POST` | `/api/v1/gudang/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`) | Melihat daftar gudang utama dan depo farmasi rawat jalan/inap. |
| 53 | `POST` | `/api/v1/gudang/{id}/stok/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`) | Cek ketersediaan stok per depo farmasi sebelum penyiapan obat pasien. |
| 54 | `POST` | `/api/v1/resep/{id}/pengeluaran` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`) | Penyiapan dan penyerahan obat resep pasien berdasarkan metode FEFO dilaksanakan oleh staf klinis (Perawat) / Admin Farmasi. |
| 55 | `POST` | `/api/v1/rawat-inap/tempat-tidur/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Monitoring okupansi tempat tidur: Resepsionis perlu melihat bed kosong saat admisi, Perawat & Dokter memantau pasien bangsal. |
| 56 | `POST` | `/api/v1/kunjungan/{id}/rawat-inap` | `SUPERADMIN`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Registrasi masuk rawat inap (admisi) dan alokasi bed dilakukan oleh Resepsionis admisi atau Perawat jaga bangsal. |
| 57 | `PATCH` | `/api/v1/rawat-inap/{id}/pindah` | `SUPERADMIN`, `STAFF` (`PERAWAT`) | Mutasi/pindah kamar atau kelas perawatan pasien dilakukan oleh Perawat bangsal sesuai kondisi klinis. |
| 57a | `PATCH` | `/api/v1/rawat-inap/{id}/pulang` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Dokter memberikan persetujuan medis pulang (*discharge*), sedangkan Perawat menyelesaikan administrasi pelepasan bed. |
| 58 | `POST` | `/api/v1/kunjungan/{id}/visite` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencatatan visite dokter penanggung jawab (DPJP) dan observasi harian Perawat bangsal. |
| 59 | `POST` | `/api/v1/kunjungan/{id}/triase` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Penilaian kegawatdaruratan IGD (Level P1–P5) dilakukan segera oleh Perawat triase atau Dokter jaga IGD. |
| 60 | `POST` | `/api/v1/igd/antrean/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Daftar pasien IGD terurut tingkat kegawatan triase untuk prioritas penanganan medis. |
| 61 | `POST` | `/api/v1/operasi/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat jadwal penggunaan kamar operasi (OK) untuk koordinasi tim bedah dan persiapan ruangan. |
| 62 | `POST` | `/api/v1/kunjungan/{id}/operasi` | `SUPERADMIN`, `DOKTER` | Penjadwalan tindakan pembedahan dan validasi bentrok ruang OK ditetapkan oleh Dokter operator. |
| 63 | `PATCH` | `/api/v1/operasi/{id}` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Dokter mengisi laporan operasi & waktu aktual pembedahan; Perawat OK memperbarui status kesiapan/selesai tindakan. |
| 64 | `POST` | `/api/v1/kunjungan/{id}/order-penunjang` | `SUPERADMIN`, `DOKTER` | Permintaan pemeriksaan laboratorium atau radiologi wajib berdasarkan indikasi medis dari Dokter. |
| 65 | `POST` | `/api/v1/order/{id}/hasil-lab` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Penginputan nilai parameter hasil pemeriksaan laboratorium dilakukan oleh staf klinis/penunjang (Perawat/Dokter). |
| 66 | `POST` | `/api/v1/order/{id}/hasil-radiologi` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Penginputan berkas citra dan ekspertise/kesan radiologi oleh Dokter/staf klinis penunjang. |
| 67 | `POST` | `/api/v1/kunjungan/{id}/order/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat status pengerjaan dan hasil pemeriksaan penunjang pasien. |
| 68 | `POST` | `/api/v1/ambulans/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Melihat kesiapan armada ambulans dan status masa berlaku KIR untuk rujukan darurat maupun penjemputan. |
| 68a | `POST` | `/api/v1/ambulans` | `SUPERADMIN`, `ADMIN_LOKAL` | Pendaftaran armada ambulans baru milik fasilitas dikelola oleh Admin Lokal & Superadmin. |
| 69 | `POST` | `/api/v1/ambulans/{id}/perjalanan` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Pencatatan penugasan jalan ambulans (tujuan, jam berangkat/kembali, KM) dikelola meja informasi/Resepsionis & Admin. |
| 70 | `POST` | `/api/v1/ambulans/perjalanan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Monitoring log penggunaan armada ambulans dan perhitungan jarak tempuh operasional. |
| 71 | `POST` | `/api/v1/harga/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`RESEPSIONIS`) | Melihat daftar tarif layanan dan harga obat yang sedang berlaku untuk informasi pasien & penagihan kasir. |
| 72 | `PUT` | `/api/v1/harga/{ref_tipe}/{ref_id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Perubahan tarif layanan/obat (*append-only*) dibatasi hanya untuk pemegang otoritas manajemen (Admin Lokal & Superadmin). |
| 73 | `POST` | `/api/v1/harga/{ref_tipe}/{ref_id}/riwayat/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Audit historis perubahan tarif dari waktu ke waktu. |
| 74 | `POST` | `/api/v1/laporan/ringkasan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER` | Dashboard eksekutif (jumlah kunjungan, pendapatan, BOR rawat inap) untuk evaluasi pimpinan klinik/RS dan Dokter penanggung jawab. |
| 75 | `POST` | `/api/v1/laporan/tren-layanan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER` | Analisis 10 besar diagnosis dan layanan terbanyak untuk perencanaan kebutuhan medis & obat. |
| 76 | `POST` | `/api/v1/laporan/jam-tersibuk/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER` | Analisis distribusi jam kunjungan tersibuk 30 hari terakhir guna penjadwalan shift staf. |
| 77 | `POST` | `/api/v1/laporan/perbandingan/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Analisis dekomposisi kenaikan pendapatan (efek volume pasien vs efek kenaikan tarif) untuk evaluasi bisnis. |
| 78 | `POST` | `/api/v1/laporan/export` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER` | Ekspor laporan manajemen ke format PDF dan Excel (`.xlsx`) untuk pelaporan dinas kesehatan/direksi. |
| 79 | `POST` | `/api/v1/konten/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Mengelola seluruh konten halaman depan (termasuk yang masih berstatus draf). |
| 80 | `POST` | `/api/v1/konten` | `SUPERADMIN`, `ADMIN_LOKAL` | Menambahkan artikel profil, foto galeri, atau testimoni pasien baru. |
| 81 | `PATCH` | `/api/v1/konten/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Menyunting konten publik dan mengatur status publikasi. |
| 82 | `DELETE` | `/api/v1/konten/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Menonaktifkan konten publik (*soft delete*) yang sudah tidak relevan. |
| 83 | `POST` | `/api/v1/notifikasi/log/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Memantau status pengiriman email pengingat reservasi/kontrol KB/kunjungan neonatal kepada pasien. |
| 84 | `POST` | `/api/v1/notifikasi/{id}/kirim-ulang` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Resepsionis dapat memicu pengiriman ulang email bukti reservasi jika pasien melaporkan email belum masuk. |
| 85 | `POST` | `/api/v1/audit-logs/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Pengawasan keamanan & jejak audit (*immutable*). Superadmin melihat seluruh sistem; Admin Lokal memantau unitnya. |
| 86 | `POST` | `/api/v1/staf/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Monitoring direktori pegawai dan masa berlaku STR/SIP tenaga medis. |
| 87 | `POST` | `/api/v1/staf` | `SUPERADMIN`, `ADMIN_LOKAL` | Pencatatan data kepegawaian staf baru oleh bagian administrasi/HR unit. |
| 88 | `PATCH` | `/api/v1/staf/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembaruan data profil staf, unit penugasan, dan perpanjangan STR/SIP. |
| 88a | `POST` | `/api/v1/staf/{id}/akun` | `SUPERADMIN` | Pembuatan akun login dan penetapan role RBAC hanya dilakukan oleh Superadmin untuk mencegah penyalahgunaan hak akses. |
| 89 | `POST` | `/api/v1/unit-pelayanan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Referensi daftar poli/unit pelayanan aktif untuk routing pasien dan jadwal. |
| 90 | `POST` | `/api/v1/unit-pelayanan` | `SUPERADMIN` | Pembentukan unit pelayanan baru tingkat fasilitas/RS merupakan kebijakan strategis Superadmin. |
| 91 | `POST` | `/api/v1/aset/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Pemantauan daftar alat medis/fasilitas dan jadwal jatuh tempo kalibrasi. |
| 91a | `POST` | `/api/v1/aset` | `SUPERADMIN`, `ADMIN_LOKAL` | Inventarisasi aset peralatan baru milik klinik/RS. |
| 92 | `POST` | `/api/v1/aset/{id}/pemeliharaan` | `SUPERADMIN`, `ADMIN_LOKAL` | Pencatatan riwayat servis dan sertifikasi kalibrasi alat medis. |
| 93 | `POST` | `/api/v1/klaim-penjamin/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Monitoring berkas pengajuan klaim BPJS (SEP/INA-CBG) dan asuransi swasta. |
| 94 | `PATCH` | `/api/v1/klaim-penjamin/{id}` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`RESEPSIONIS`) | Pembaruan status verifikasi berkas klaim dan pencairan piutang penjamin. |
| 95 | `POST` | `/api/v1/insiden/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Transparansi daftar insiden keselamatan pasien untuk pembelajaran mutu internal. |
| 95a | `POST` | `/api/v1/insiden` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Budaya keselamatan pasien: seluruh pegawai tanpa terkecuali berhak melaporkan KTD, KNC, KPC, maupun Sentinel. |
| 95b | `PATCH` | `/api/v1/insiden/{id}` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER` | Investigasi akar masalah (RCA) dan penetapan tindak lanjut insiden oleh Dokter/Komite Mutu & Manajemen. |
| 96 | `POST` | `/api/v1/ruangan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Referensi daftar ruangan (Poli, OK, IGD, Kamar Rawat) untuk penjadwalan dan penempatan pasien. |
| 97 | `POST` | `/api/v1/ruangan` | `SUPERADMIN`, `ADMIN_LOKAL` | Penambahan ruangan fisik baru pada struktur fasilitas. |
| 98 | `POST` | `/api/v1/kelas-perawatan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Referensi kelas perawatan (VVIP, VIP, I, II, III) dan tarif harian kamar saat admisi. |
| 99 | `POST` | `/api/v1/layanan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Referensi katalog tindakan medis & kebidanan untuk input kunjungan dan penagihan. |
| 100 | `POST` | `/api/v1/layanan` | `SUPERADMIN`, `ADMIN_LOKAL` | Penambahan jenis tindakan/layanan medis baru ke master katalog. |
| 101 | `PATCH` | `/api/v1/layanan/{id}` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembaruan nama, kategori, atau status aktif layanan medis. |
| 102 | `POST` | `/api/v1/paket-layanan/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`RESEPSIONIS`) | Referensi paket bundling (seperti paket persalinan atau MCU) saat pendaftaran & kasir. |
| 103 | `POST` | `/api/v1/paket-layanan` | `SUPERADMIN`, `ADMIN_LOKAL` | Pembuatan paket bundling layanan baru beserta rincian komponennya. |
| 104 | `POST` | `/api/v1/penjamin/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Referensi daftar penjamin (Mandiri, BPJS Kesehatan, Asuransi) saat registrasi kunjungan. |
| 105 | `POST` | `/api/v1/pemasok/list` | `SUPERADMIN`, `ADMIN_LOKAL` | Referensi distributor/PBF resmi untuk proses pengadaan dan restock obat. |
| 106 | `POST` | `/api/v1/pemasok` | `SUPERADMIN`, `ADMIN_LOKAL` | Pendaftaran mitra pemasok farmasi baru. |
| 107 | `POST` | `/api/v1/master/vaksin/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Referensi jenis vaksin dan usia anjuran pada form pencatatan imunisasi. |
| 108 | `POST` | `/api/v1/master/metode-kb/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Referensi metode kontrasepsi dan interval kontrol pada form pelayanan KB. |
| 109 | `POST` | `/api/v1/master/parameter-lab/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF` (`PERAWAT`) | Referensi parameter pemeriksaan laboratorium, satuan, dan nilai rujukan normal. |
| 110 | `POST` | `/api/v1/pemulasaran/list` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Monitoring catatan pemulasaran jenazah dan status serah terima kepada keluarga. |
| 111 | `POST` | `/api/v1/pemulasaran` | `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`, `RESEPSIONIS`) | Pencatatan masuk ruang jenazah dan berita acara serah terima kepada pihak keluarga. |
| 112 | `POST` | `/api/v1/bayi/{id}/asuhan-bbl` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencatatan asuhan bayi baru lahir 0–6 jam (IMD, vitamin K1, salep mata, imunisasi HB0, pemeriksaan fisik awal) oleh Dokter/Bidan atau Perawat pelaksana persalinan; satu catatan per bayi. |
| 113 | `POST` | `/api/v1/bayi/{id}/asuhan-bbl/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat catatan asuhan bayi baru lahir sebagai dasar jadwal kunjungan neonatal dan imunisasi lanjutan. |
| 114 | `POST` | `/api/v1/bayi/{id}/pemeriksaan` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Pencatatan kunjungan neonatal (KN1: 6–48 jam, KN2: 3–7 hari, KN3: 8–28 hari) dan kontrol tumbuh kembang bayi (berat, panjang, lingkar kepala, tanda bahaya); pengingat kunjungan berikutnya dikirim email H-1 secara otomatis. |
| 115 | `POST` | `/api/v1/bayi/{id}/pemeriksaan/list` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Melihat riwayat kunjungan neonatal dan kontrol bayi secara kronologis. |
| 116 | `POST` | `/api/v1/bayi/{id}/tumbuh-kembang/grafik` | `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) | Menampilkan grafik pertumbuhan bayi (berat, panjang, lingkar kepala terhadap usia) dari view `v_grafik_tumbuh_kembang_bayi` untuk deteksi dini gangguan tumbuh kembang. |

### 3.3 Specification Card Endpoint Pelengkap & Pembaruan RBAC TSD v2.1

Seluruh Specification Card 1–95 pada TSD v2.0 tetap berlaku dengan pembaruan header Authentication mengikuti matriks 5 Role pada Bagian 3.2. Berikut adalah Specification Card untuk endpoint baru & alias v1.0:

#### Alias Endpoint TSD v1.0: `POST /api/v1/public/sesi/list`, `POST /api/v1/sesi/list`, `POST /api/v1/sesi`, `PATCH /api/v1/sesi/{id}`

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `POST /public/sesi/list` \| `POST /sesi/list` \| `POST /sesi` \| `PATCH /sesi/{id}` |
| **Authentication & Role** | `PASIEN` / Public (`/public/sesi/list`) \| `SUPERADMIN`, `ADMIN_LOKAL` (`/sesi`, `PATCH /sesi/{id}`) \| Semua Staf Internal (`/sesi/list`) |
| **Fungsi / FSD** | FSD-2.5 & FSD-2.7 — *Backward-compatible* alias untuk FE Bidan di Vercel (MK RSI) |
| **Mekanisme Adapter** | Middleware `legacyBidanAdapter` memetakan `sesi_id <-> jadwal_id`, `is_active <-> aktif`, dan otomatis menyisipkan `staf_id`, `unit_id` (`UNIT_BIDAN`), serta `ruangan_id` default praktik bidan saat FE Bidan memanggil `POST /sesi`. |
| **DB Tables & View** | `jadwal_praktik` (C,R,U) \| `reservasi` (R) \| View: `v_sesi_sisa_kuota` \| Trigger: `trg_audit_jadwal_praktik` |

#### `POST /api/v1/obat` & `PATCH /api/v1/obat/{id}`

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `POST /api/v1/obat` \| `PATCH /api/v1/obat/{id}` |
| **Authentication & Role** | JWT: `SUPERADMIN`, `ADMIN_LOKAL` |
| **Fungsi / FSD** | RS-05 Manajemen Master Obat & Alat Kesehatan RS |
| **Request Body** | `POST`: `{ kode, nama_generik, nama_dagang?, kategori, bentuk, satuan, kekuatan?, golongan?, stok_minimum }` \| `PATCH`: `{ nama_dagang?, stok_minimum?, aktif? }` |
| **DB Tables & Trigger** | `obat` (C,U) \| `audit_log` (C) \| Trigger: `trg_audit_obat` |

#### `POST /api/v1/gudang/{id}/stok/list` & `POST /api/v1/resep/{id}/pengeluaran`

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `POST /api/v1/gudang/{id}/stok/list` \| `POST /api/v1/resep/{id}/pengeluaran` |
| **Authentication & Role** | JWT: `SUPERADMIN`, `ADMIN_LOKAL`, `STAFF` (`PERAWAT`) |
| **Fungsi / FSD** | RS-05 Monitoring Stok Batch per Gudang/Depo & Pengeluaran Obat Resep FEFO |
| **DB Tables & SP** | `stok_batch`, `batch_obat`, `obat`, `gudang`, `resep_detail`, `mutasi_stok` \| SP: `sp_pengeluaran_resep_fefo` |

#### `PATCH /api/v1/rawat-inap/{id}/pulang`

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `PATCH /api/v1/rawat-inap/{id}/pulang` |
| **Authentication & Role** | JWT: `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) |
| **Fungsi / FSD** | RS-01 Kepulangan (*Discharge*) Pasien Rawat Inap |
| **Request Body** | `{ cara_keluar: enum('SEMBUH'\|'DIRUJUK'\|'APS'\|'MENINGGAL'), catatan_pulang?: string }` |
| **DB Tables & SP** | `rawat_inap` (U) \| `tempat_tidur` (U -> `PEMBERSIHAN`) \| `kunjungan` (U) \| SP: `sp_pulang_rawat_inap` |

#### `POST /api/v1/staf/{id}/akun` & `POST /api/v1/unit-pelayanan`

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `POST /api/v1/staf/{id}/akun` \| `POST /api/v1/unit-pelayanan` |
| **Authentication & Role** | JWT: `SUPERADMIN` (Eksklusif) |
| **Fungsi / FSD** | Pembuatan Akun Login & Penetapan Role RBAC (`peran` + `sub_peran`) serta Pembentukan Unit Pelayanan Baru |
| **Request Body** | `POST /akun`: `{ username, password, peran: enum('SUPERADMIN'\|'ADMIN_LOKAL'\|'DOKTER'\|'STAFF'), sub_peran?: enum('PERAWAT'\|'RESEPSIONIS') }` |
| **DB Tables & Trigger** | `akun_pengguna` (C) \| `unit_pelayanan` (C) \| Trigger: `trg_audit_akun_pengguna` |

#### Endpoint Layanan Newborn Care / Baby Care (No. 112–116)

| Atribut | Spesifikasi |
| :--- | :--- |
| **Method & URL** | `POST /bayi/{id}/asuhan-bbl` \| `POST /bayi/{id}/asuhan-bbl/list` \| `POST /bayi/{id}/pemeriksaan` \| `POST /bayi/{id}/pemeriksaan/list` \| `POST /bayi/{id}/tumbuh-kembang/grafik` |
| **Authentication & Role** | JWT: `SUPERADMIN`, `DOKTER`, `STAFF` (`PERAWAT`) |
| **Fungsi / FSD** | Layanan Baby Care / Newborn Care: asuhan bayi baru lahir, kunjungan neonatal KN1–KN3, dan pemantauan tumbuh kembang. Ekstensi baru yang belum tercakup di FSD v1.0, sehingga FSD perlu ditambahkan. Parameter `{id}` pada seluruh endpoint ini adalah `bayi_id` (tabel `bayi_lahir`). |
| **Request Body** | `POST /asuhan-bbl`: `{ imd: bool, vit_k1: bool, salep_mata: bool, hb0: bool, keadaan_umum: string, catatan?: string }` \| `POST /pemeriksaan`: `{ jenis: enum('KN1'\|'KN2'\|'KN3'\|'TUMBUH_KEMBANG'), tgl_pemeriksaan, berat_gram, panjang_cm, lingkar_kepala_cm, suhu_c, kondisi_tali_pusat: enum('KERING'\|'BASAH'\|'INFEKSI'), menyusu: enum('ASI_EKSKLUSIF'\|'CAMPURAN'\|'FORMULA'), ikterus: bool, tanda_bahaya: bool, tgl_kontrol_berikutnya?: date, catatan?: string }` |
| **DB Tables & Trigger** | `asuhan_bbl` (C,R) \| `pemeriksaan_bayi` (C,R) \| `bayi_lahir` (R) \| `pasien` (R) \| View: `v_grafik_tumbuh_kembang_bayi` \| Trigger: `trg_audit_asuhan_bbl`, `trg_audit_pemeriksaan_bayi` |

#### Endpoint Master Referensi RS & Pemulasaran (No. 96–111)

| Atribut | Spesifikasi |
| :--- | :--- |
| **Endpoints** | `POST /ruangan/list` & `POST /ruangan`; `POST /kelas-perawatan/list`; `POST /layanan/list`, `POST /layanan`, `PATCH /layanan/{id}`; `POST /paket-layanan/list` & `POST /paket-layanan`; `POST /penjamin/list`; `POST /pemasok/list` & `POST /pemasok`; `POST /master/vaksin/list`; `POST /master/metode-kb/list`; `POST /master/parameter-lab/list`; `POST /pemulasaran/list` & `POST /pemulasaran` |
| **Authentication & Role** | Write (`POST`/`PATCH`): `SUPERADMIN`, `ADMIN_LOKAL` \| Read (`/list`): Sesuai matriks Bagian 3.2 |
| **DB Tables** | `ruangan`, `kelas_perawatan`, `layanan_medis`, `paket_layanan`, `paket_detail`, `penjamin`, `pemasok`, `vaksin`, `metode_kb`, `parameter_lab`, `pemulasaran_jenazah` |

---

## TSD Bagian 4 — Database Schema Specification (97 Tabel: 95 DDL Gabungan + 2 Ekstensi KIA Bidan)

### 4.1 Gambaran Umum & Pemetaan Tabel RSI ke Skema Gabungan

Database `MiniWorldRS` (SQL Server 2025) memuat **97 tabel**: 95 tabel DDL gabungan (`03_ddl_schema_gabungan.sql`, yaitu skema Mini World Rumah Sakit yang sudah menyerap kebutuhan RSI/Bidan) ditambah 2 tabel ekstensi newborn care (`04_ddl_ekstensi_bidan_v3.sql`). Tidak ada tabel ganda: tabel RSI lama dipetakan ke tabel RS pada tabel berikut, dan endpoint legacy tetap memakai nama lama melalui adapter (Bagian 3). Seluruh primary key bertipe `UNIQUEIDENTIFIER` dengan `DEFAULT NEWSEQUENTIALID()`, kecuali `Audit_Log.log_id` (`BIGINT IDENTITY`) dan 7 tabel asosiatif berkunci komposit (`Kunjungan_Diagnosa`, `Paket_Detail`, `Tim_Operasi`, `PO_Detail`, `Stok_Batch`, `Resep_Detail`, `Opname_Detail`).

| Tabel RSI (lama) | Tabel pada skema final | Pemetaan kolom / catatan |
| :--- | :--- | :--- |
| `users` | `Akun_Pengguna` + `Staf` + `Peran` | Peran via `Peran.kode`; `sub_peran` dan akun portal pasien ditambahkan pada v3.0 |
| `otp_reset` | `Otp_Reset` | `user_id = akun_id`; `is_used = dipakai` |
| `pasien` | `Pasien` | nama sama; kolom `email` ditambahkan pada v3.0 |
| `sesi_praktik` | `Jadwal_Praktik` | `sesi_id = jadwal_id`; `is_active = aktif` |
| `layanan` | `Layanan_Medis` | kategori `KEBIDANAN`/`UMUM` = `Unit_Pelayanan.jenis` |
| `reservasi` | `Reservasi` | nama sama; `sesi_id = jadwal_id` |
| `kunjungan` | `Kunjungan` + `Pemeriksaan` + `Kunjungan_Diagnosa` + `Tindakan_Kunjungan` | `bidan_id = dpjp_staf_id`; `tanggal_kunjungan = tgl_masuk`; `keluhan`, `pemeriksaan_fisik`, `catatan_bebas` ke `Pemeriksaan`; diagnosis ke `Diagnosa`; tindakan ke `Tindakan_Kunjungan` |
| `resep_item` | `Resep` + `Resep_Detail` | satu resep per kunjungan, detail per obat |
| `alergi_kondisi` | `Alergi_Kondisi` | `is_active = aktif`; `item_id = obat_id` |
| `item_inventaris` | `Obat` + `Batch_Obat` + `Stok_Batch` | stok per batch per gudang; tabel `item_inventaris` tidak ada lagi |
| `riwayat_stok` | `Mutasi_Stok` | seluruh mutasi stok (`MASUK`, `PAKAI`, `KOREKSI`, `KEDALUWARSA`, `TRANSFER`) |
| `riwayat_harga` | `Harga_Obat` + `Harga_Layanan` | dipecah agar FK bersih; paket memakai `Harga_Paket` |
| `tagihan` | `Tagihan` | `created_at = tgl_terbit` |
| `tagihan_rincian` | `Tagihan_Rincian` | `item_id = obat_id` |
| `pembayaran` | `Pembayaran` | `jalur = penjamin_id`; `dicatat_oleh = kasir_staf_id` |
| `konten_publik` | `Konten_Publik` | `is_published = terbit` |
| `log_notifikasi` | `Notifikasi_Log` | `tujuan` berisi alamat email |
| `audit_logs` | `Audit_Log` | `entitas = tabel`; `entitas_id = id_baris`; `created_at = waktu` |

### 4.2 Perubahan Skema v3.0 terhadap DDL Gabungan

Perubahan berikut diterapkan melalui `04_ddl_ekstensi_bidan_v3.sql` (kecuali baris sinkronisasi nama yang hanya merapikan isi TSD agar sama dengan DDL).

| Objek | Perubahan | Alasan |
| :--- | :--- | :--- |
| `pasien.email`, `staf.email` | Kolom `email VARCHAR(254) NULL` dengan `CHECK` format email; unique index berfilter pada `staf.email`. | Seluruh notifikasi dan OTP dikirim melalui email, sedangkan DDL gabungan hanya menyimpan `no_telepon`. |
| `akun_pengguna` | `staf_id` menjadi `NULL`; ditambah `pasien_id` (FK, UNIQUE), `sub_peran CHECK ('PERAWAT','RESEPSIONIS')`, dan `CHECK` pemilik (tepat satu dari `staf_id`/`pasien_id` terisi). UQ `staf_id` diganti unique index berfilter. | Mendukung akun portal `PASIEN` dan sub-role `STAFF` pada RBAC 5 role. |
| `peran.kode` | `CHECK` 5 nilai: `SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF`, `PASIEN`. | Membatasi role sesuai matriks RBAC. |
| `rawat_inap.catatan_pulang` | Kolom `NVARCHAR(MAX) NULL`. | Menampung `catatan_pulang` pada `PATCH /rawat-inap/{id}/pulang`. |
| `asuhan_bbl` (baru) | Tabel asuhan bayi baru lahir 0-6 jam (IMD, vitamin K1, salep mata, HB0); satu catatan per bayi. | Layanan Baby Care / Newborn Care. |
| `pemeriksaan_bayi` (baru) | Tabel kunjungan neonatal KN1-KN3 dan kontrol tumbuh kembang; KN1-KN3 unik per bayi (unique index berfilter). | Layanan Baby Care / Newborn Care. |
| `v_grafik_tumbuh_kembang_bayi` (baru) | View usia (hari/bulan), berat, panjang, dan lingkar kepala per pemeriksaan bayi. | Sumber grafik tumbuh kembang (endpoint 116). |
| Nilai status `tempat_tidur` | Mengikuti `CHECK` DDL: `KOSONG`, `TERISI`, `PEMBERSIHAN`. Nilai `TERSEDIA` dan `RUSAK` pada draf sebelumnya dihapus. | Sinkron dengan DDL. |
| Stok obat | `item_inventaris` dan `riwayat_stok` tidak ada. Seluruh unit memakai `obat`, `batch_obat`, `stok_batch`, dan `mutasi_stok` (FEFO). | Sinkron dengan DDL. |
| Penamaan objek | `audit_logs` menjadi `audit_log`; `paket_layanan_detail` menjadi `paket_detail`; `rs_id` dan `kode_faskes` menjadi `rumah_sakit_id` dan `kode_rs`; `tarif_harian` pada `kelas_perawatan` diganti `harga_layanan` (`kelas_id`); `dokter_staf_id` pada `order_penunjang` menjadi `staf_pemesan_id`; `nilai_rujukan` menjadi `nilai_rujukan_min` dan `nilai_rujukan_maks`. | Sinkron dengan DDL. |

### 4.3 Kamus Data Lengkap (97 Tabel)

Kamus data dihasilkan dari DDL gabungan (`03_ddl_schema_gabungan.sql`) dan skrip ekstensi (`04_ddl_ekstensi_bidan_v3.sql`). Setiap tabel diawali baris judul; kolom **Keterangan** memuat `PK`, `FK`, `UNIQUE`, `CHECK`, dan `DEFAULT` (`DEFAULT NEWSEQUENTIALID()` pada `PK` tidak ditulis ulang). Tabel dan kolom bertanda `(baru)` atau tercantum pada 4.2 merupakan hasil ekstensi v3.0.

#### 4.3.1 Fasilitas & Organisasi

##### 1. `Rumah_Sakit` — Profil fasilitas (satu baris per RS/klinik).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `rumah_sakit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode_rs` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `kelas` | `VARCHAR(20)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `no_izin` | `VARCHAR(20)` | `NOT NULL` | |
| `alamat` | `NVARCHAR(255)` | `NOT NULL` | |
| `telepon` | `VARCHAR(16)` | `NOT NULL` | |
| `direktur_staf_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Staf.staf_id` |

##### 2. `Gedung` — Gedung dalam fasilitas.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `gedung_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `rumah_sakit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Rumah_Sakit.rumah_sakit_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jumlah_lantai` | `SMALLINT` | `NOT NULL` | |

##### 3. `Unit_Pelayanan` — Unit layanan (Poli Umum, Poli KIA/Bidan, IGD, Rawat Inap, dll.), hierarkis.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `rumah_sakit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Rumah_Sakit.rumah_sakit_id` |
| `induk_unit_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Unit_Pelayanan.unit_id` |
| `kepala_staf_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Staf.staf_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 4. `Ruangan` — Ruangan fisik per unit dan gedung.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `gedung_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Gedung.gedung_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `lantai` | `SMALLINT` | `NOT NULL` | |
| `kapasitas` | `SMALLINT` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 5. `Kelas_Perawatan` — Master kelas perawatan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kelas_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `urutan` | `SMALLINT` | `NOT NULL` | |

##### 6. `Tempat_Tidur` — Master bed beserta statusnya.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `bed_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Ruangan.ruangan_id` |
| `kelas_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kelas_Perawatan.kelas_id` |
| `no_bed` | `VARCHAR(30)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | `CHECK: status IN ('KOSONG','TERISI','PEMBERSIHAN')` |

#### 4.3.2 SDM & Akses

##### 7. `Profesi` — Master profesi staf.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `profesi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `kategori` | `VARCHAR(20)` | `NOT NULL` | |

##### 8. `Spesialisasi` — Master spesialisasi medis.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `spesialisasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |

##### 9. `Staf` — Data induk seluruh staf.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `nip` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis_kelamin` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_lahir` | `DATE` | `NOT NULL` | |
| `no_telepon` | `VARCHAR(16)` | `NOT NULL` | |
| `alamat` | `NVARCHAR(255)` | `NOT NULL` | |
| `profesi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Profesi.profesi_id` |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `jabatan` | `NVARCHAR(100)` | `NOT NULL` | |
| `status_kepegawaian` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_masuk` | `DATE` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |
| `email` | `VARCHAR(254)` | `NULL` | UNIQUE bila `email IS NOT NULL`; `CHECK: email IS NULL OR email LIKE '_%@_%._%'` |

##### 10. `Staf_Medis` — Lisensi klinis (STR, SIP) staf medis.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK; FK → `Staf.staf_id` |
| `no_str` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `masa_berlaku_str` | `DATE` | `NOT NULL` | |
| `no_sip` | `VARCHAR(30)` | `NOT NULL` | |
| `spesialisasi_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Spesialisasi.spesialisasi_id` |

##### 11. `Shift` — Master shift kerja.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `shift_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jam_mulai` | `TIME(0)` | `NOT NULL` | |
| `jam_selesai` | `TIME(0)` | `NOT NULL` | |

##### 12. `Penugasan_Shift` — Penugasan staf ke shift dan unit.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `penugasan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `shift_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Shift.shift_id` |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `tanggal` | `DATE` | `NOT NULL` | |

##### 13. `Cuti_Staf` — Pengajuan cuti staf.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `cuti_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_mulai` | `DATE` | `NOT NULL` | |
| `tgl_selesai` | `DATE` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 14. `Peran` — Master role RBAC.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `peran_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE; `CHECK: kode IN ('SUPERADMIN','ADMIN_LOKAL','DOKTER','STAFF','PASIEN')` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |

##### 15. `Akun_Pengguna` — Kredensial login staf dan portal pasien.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `akun_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `staf_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Staf.staf_id`; UNIQUE bila `staf_id IS NOT NULL`; `CHECK: (CASE WHEN staf_id IS NULL THEN 0 ELSE 1 END) + (CASE WHEN pasien_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `peran_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Peran.peran_id` |
| `username` | `NVARCHAR(50)` | `NOT NULL` | UNIQUE |
| `password_hash` | `VARCHAR(100)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |
| `percobaan_gagal` | `SMALLINT` | `NOT NULL` | |
| `terkunci_sampai` | `DATETIME2` | `NULL` | |
| `last_login_at` | `DATETIME2` | `NULL` | |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Pasien.pasien_id`; UNIQUE bila `pasien_id IS NOT NULL`; `CHECK: (CASE WHEN staf_id IS NULL THEN 0 ELSE 1 END) + (CASE WHEN pasien_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `sub_peran` | `VARCHAR(20)` | `NULL` | `CHECK: sub_peran IS NULL OR sub_peran IN ('PERAWAT','RESEPSIONIS')` |

##### 16. `Otp_Reset` — Kode OTP reset kata sandi (hash).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `otp_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `akun_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Akun_Pengguna.akun_id` |
| `kode_hash` | `VARCHAR(100)` | `NOT NULL` | |
| `expired_at` | `DATETIME2` | `NOT NULL` | |
| `dipakai` | `BIT` | `NOT NULL` | |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

#### 4.3.3 Pasien & Penjamin

##### 17. `Pasien` — Data induk pasien (termasuk bayi, via `ibu_pasien_id`).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `no_rm` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nik` | `CHAR(16)` | `NOT NULL` | UNIQUE; `CHECK: LEN(nik) = 16` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis_kelamin` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_lahir` | `DATE` | `NOT NULL` | |
| `tempat_lahir` | `NVARCHAR(100)` | `NOT NULL` | |
| `alamat` | `NVARCHAR(255)` | `NOT NULL` | |
| `no_telepon` | `VARCHAR(16)` | `NOT NULL` | |
| `gol_darah` | `VARCHAR(20)` | `NOT NULL` | |
| `status_pernikahan` | `VARCHAR(20)` | `NOT NULL` | |
| `pekerjaan` | `NVARCHAR(100)` | `NOT NULL` | |
| `ibu_pasien_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Pasien.pasien_id` |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |
| `email` | `VARCHAR(254)` | `NULL` | `CHECK: email IS NULL OR email LIKE '_%@_%._%'` |

##### 18. `Kontak_Darurat` — Kontak darurat pasien.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kontak_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `hubungan` | `VARCHAR(20)` | `NOT NULL` | |
| `no_telepon` | `VARCHAR(16)` | `NOT NULL` | |

##### 19. `Penjamin` — Master penjamin (mandiri, BPJS, asuransi).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | `CHECK: jenis IN ('MANDIRI','BPJS','ASURANSI')` |
| `no_kontrak` | `VARCHAR(30)` | `NOT NULL` | |
| `kontak` | `VARCHAR(16)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 20. `Kepesertaan_Pasien` — Kepesertaan pasien pada penjamin.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kepesertaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Penjamin.penjamin_id` |
| `no_kartu` | `VARCHAR(30)` | `NOT NULL` | |
| `kelas_hak` | `VARCHAR(20)` | `NOT NULL` | |
| `berlaku_dari` | `DATE` | `NOT NULL` | |
| `berlaku_sampai` | `DATE` | `NULL` | |

#### 4.3.4 Reservasi & Kunjungan

##### 21. `Jadwal_Praktik` — Sesi praktik dan kuota per staf.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `jadwal_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Ruangan.ruangan_id` |
| `tanggal` | `DATE` | `NOT NULL` | |
| `jam_mulai` | `TIME(0)` | `NOT NULL` | |
| `jam_selesai` | `TIME(0)` | `NOT NULL` | |
| `kuota_maks` | `SMALLINT` | `NOT NULL` | `CHECK: kuota_maks > 0` |
| `durasi_per_pasien` | `SMALLINT` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 22. `Reservasi` — Reservasi dan nomor antrean.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `reservasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `jadwal_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Jadwal_Praktik.jadwal_id`; `UNIQUE (jadwal_id, nomor_antrean)` bila `status <> 'DIBATALKAN'` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `dibuat_oleh` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Akun_Pengguna.akun_id` |
| `nomor_antrean` | `SMALLINT` | `NOT NULL` | `UNIQUE (jadwal_id, nomor_antrean)` bila `status <> 'DIBATALKAN'` |
| `estimasi_jam` | `TIME(0)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | `CHECK: status IN ('MENUNGGU','DIPANGGIL','SELESAI','DIBATALKAN')` |
| `metode_daftar` | `VARCHAR(20)` | `NOT NULL` | `CHECK: metode_daftar IN ('ONLINE','MANUAL_ADMIN')` |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 23. `Kunjungan` — Episode kunjungan pasien.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `reservasi_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Reservasi.reservasi_id`; UNIQUE bila `reservasi_id IS NOT NULL` |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `dpjp_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Penjamin.penjamin_id` |
| `koreksi_dari_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kunjungan.kunjungan_id` |
| `jenis_kunjungan` | `VARCHAR(20)` | `NOT NULL` | `CHECK: jenis_kunjungan IN ('RAWAT_JALAN','IGD','RAWAT_INAP','PERSALINAN','KONTROL')` |
| `tgl_masuk` | `DATE` | `NOT NULL` | |
| `tgl_keluar` | `DATE` | `NULL` | |
| `cara_keluar` | `VARCHAR(20)` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 24. `Rujukan` — Rujukan masuk dan keluar.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `rujukan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `diagnosa_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Diagnosa.diagnosa_id` |
| `arah` | `VARCHAR(20)` | `NOT NULL` | |
| `faskes_asal_tujuan` | `NVARCHAR(100)` | `NOT NULL` | |
| `alasan` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `no_surat` | `VARCHAR(30)` | `NOT NULL` | |
| `tanggal` | `DATE` | `NOT NULL` | |

##### 25. `Triase` — Penilaian triase IGD.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `triase_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id`; UNIQUE |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `level` | `VARCHAR(20)` | `NOT NULL` | |
| `keluhan_utama` | `VARCHAR(20)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `keputusan` | `VARCHAR(20)` | `NOT NULL` | |

##### 26. `Rawat_Inap` — Episode rawat inap per bed.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `rawat_inap_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `bed_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Tempat_Tidur.bed_id` |
| `tgl_masuk` | `DATE` | `NOT NULL` | |
| `tgl_keluar` | `DATE` | `NULL` | |
| `alasan_pindah` | `NVARCHAR(MAX)` | `NULL` | |
| `catatan_pulang` | `NVARCHAR(MAX)` | `NULL` | |

##### 27. `Visite` — Visite dokter pada rawat inap.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `visite_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `catatan` | `NVARCHAR(MAX)` | `NULL` | |

#### 4.3.5 Rekam Medis

##### 28. `Pemeriksaan` — Anamnesis, pemeriksaan fisik, asesmen, rencana.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pemeriksaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `keluhan` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `pemeriksaan_fisik` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `asesmen` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `rencana` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `catatan_bebas` | `NVARCHAR(MAX)` | `NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 29. `Tanda_Vital` — Tanda vital per pemeriksaan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `vital_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pemeriksaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pemeriksaan.pemeriksaan_id` |
| `sistolik` | `SMALLINT` | `NOT NULL` | |
| `diastolik` | `SMALLINT` | `NOT NULL` | |
| `nadi` | `SMALLINT` | `NOT NULL` | |
| `suhu` | `DECIMAL(4,1)` | `NOT NULL` | |
| `frekuensi_napas` | `SMALLINT` | `NOT NULL` | |
| `spo2` | `SMALLINT` | `NOT NULL` | |
| `berat_badan` | `DECIMAL(5,1)` | `NOT NULL` | |
| `tinggi_badan` | `DECIMAL(5,1)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 30. `Diagnosa` — Master diagnosis (ICD).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `diagnosa_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode_icd` | `VARCHAR(30)` | `NULL` | UNIQUE bila `kode_icd IS NOT NULL` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |

##### 31. `Kunjungan_Diagnosa` — Diagnosis pada kunjungan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Kunjungan.kunjungan_id` |
| `diagnosa_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Diagnosa.diagnosa_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `keterangan` | `NVARCHAR(MAX)` | `NULL` | |

##### 32. `Alergi_Kondisi` — Alergi obat dan kondisi khusus pasien (red-flag).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `alergi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `obat_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Obat.obat_id` |
| `dicatat_oleh` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `kategori` | `VARCHAR(20)` | `NOT NULL` | `CHECK: kategori IN ('ALERGI_OBAT','KEHAMILAN_RISTI','PENYAKIT_BAWAAN')` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `keterangan` | `NVARCHAR(MAX)` | `NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 33. `Catatan_Keperawatan` — Catatan asuhan keperawatan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `catatan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `isi` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 34. `Konsultasi` — Konsultasi antar dokter.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `konsultasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `dokter_peminta_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `dokter_tujuan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `pertanyaan` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `jawaban` | `NVARCHAR(MAX)` | `NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 35. `Persetujuan_Tindakan` — Informed consent tindakan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `persetujuan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `pemberi_persetujuan` | `NVARCHAR(100)` | `NOT NULL` | |
| `hubungan` | `VARCHAR(20)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 36. `Dokumen_Medis` — Dokumen medis terlampir.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `dokumen_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `no_dokumen` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `isi` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `tgl_terbit` | `DATE` | `NOT NULL` | |

#### 4.3.6 KIA / Bidan (ANC, Persalinan, KB, Newborn Care)

##### 37. `Kehamilan` — Episode kehamilan pasien.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kehamilan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `hpht` | `DATE` | `NOT NULL` | |
| `hpl` | `DATE` | `NOT NULL` | |
| `gravida` | `SMALLINT` | `NOT NULL` | |
| `paritas` | `SMALLINT` | `NOT NULL` | |
| `abortus` | `SMALLINT` | `NOT NULL` | |
| `status_risiko` | `VARCHAR(20)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 38. `Pemeriksaan_ANC` — Pemeriksaan kehamilan (*antenatal care*).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `anc_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kehamilan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kehamilan.kehamilan_id` |
| `pemeriksaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pemeriksaan.pemeriksaan_id` |
| `kunjungan_ke` | `SMALLINT` | `NOT NULL` | |
| `usia_kehamilan_minggu` | `SMALLINT` | `NOT NULL` | |
| `tinggi_fundus` | `DECIMAL(4,1)` | `NOT NULL` | |
| `djj` | `SMALLINT` | `NOT NULL` | |
| `letak_janin` | `VARCHAR(20)` | `NOT NULL` | |
| `tablet_fe_diberikan` | `VARCHAR(20)` | `NOT NULL` | |

##### 39. `Persalinan` — Pencatatan persalinan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `persalinan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kehamilan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kehamilan.kehamilan_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `penolong_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `waktu_persalinan` | `DATETIME2` | `NOT NULL` | |
| `jenis_persalinan` | `VARCHAR(20)` | `NOT NULL` | |
| `komplikasi` | `NVARCHAR(MAX)` | `NULL` | |
| `kondisi_ibu` | `VARCHAR(20)` | `NOT NULL` | |

##### 40. `Bayi_Lahir` — Bayi yang lahir (memiliki `pasien_id` sendiri).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `bayi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `persalinan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Persalinan.persalinan_id` |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id`; UNIQUE |
| `berat_lahir_gram` | `INT` | `NOT NULL` | |
| `panjang_lahir_cm` | `DECIMAL(4,1)` | `NOT NULL` | |
| `apgar_1` | `SMALLINT` | `NOT NULL` | |
| `apgar_5` | `SMALLINT` | `NOT NULL` | |
| `kondisi` | `VARCHAR(20)` | `NOT NULL` | |

##### 41. `Vaksin` — Master vaksin.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `vaksin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Obat.obat_id` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jumlah_dosis_standar` | `SMALLINT` | `NOT NULL` | |
| `usia_anjuran` | `VARCHAR(20)` | `NOT NULL` | |

##### 42. `Imunisasi_Pasien` — Riwayat imunisasi pasien.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `imunisasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `vaksin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Vaksin.vaksin_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `batch_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Batch_Obat.batch_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `dosis_ke` | `SMALLINT` | `NOT NULL` | |
| `tanggal` | `DATE` | `NOT NULL` | |

##### 43. `Metode_KB` — Master metode KB.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `metode_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `obat_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Obat.obat_id` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |

##### 44. `Pelayanan_KB` — Pelayanan KB dan jadwal kontrol.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kb_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `metode_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Metode_KB.metode_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `tanggal` | `DATE` | `NOT NULL` | |
| `kontrol_berikutnya` | `DATE` | `NULL` | |
| `efek_samping` | `NVARCHAR(MAX)` | `NULL` | |

##### 45. `Asuhan_BBL` — Asuhan bayi baru lahir 0-6 jam (baru v3.0).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `asuhan_bbl_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `bayi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Bayi_Lahir.bayi_id`; UNIQUE |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `imd` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `vit_k1` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `salep_mata` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `hb0` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `keadaan_umum` | `VARCHAR(20)` | `NOT NULL` | `CHECK: keadaan_umum IN ('BAIK','PERLU_PEMANTAUAN','RUJUK')` |
| `catatan` | `NVARCHAR(500)` | `NULL` | |
| `dicatat_pada` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 46. `Pemeriksaan_Bayi` — Kunjungan neonatal dan tumbuh kembang (baru v3.0).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pemeriksaan_bayi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `bayi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Bayi_Lahir.bayi_id`; `UNIQUE (bayi_id, jenis)` bila `jenis IN ('KN1','KN2','KN3')` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | `UNIQUE (bayi_id, jenis)` bila `jenis IN ('KN1','KN2','KN3')`; `CHECK: jenis IN ('KN1','KN2','KN3','TUMBUH_KEMBANG')` |
| `tgl_pemeriksaan` | `DATE` | `NOT NULL` | |
| `berat_gram` | `INT` | `NOT NULL` | `CHECK: berat_gram > 0` |
| `panjang_cm` | `DECIMAL(4,1)` | `NOT NULL` | |
| `lingkar_kepala_cm` | `DECIMAL(4,1)` | `NULL` | |
| `suhu_c` | `DECIMAL(3,1)` | `NULL` | |
| `kondisi_tali_pusat` | `VARCHAR(20)` | `NULL` | `CHECK: kondisi_tali_pusat IS NULL OR kondisi_tali_pusat IN ('KERING','BASAH','INFEKSI')` |
| `menyusu` | `VARCHAR(20)` | `NULL` | `CHECK: menyusu IS NULL OR menyusu IN ('ASI_EKSKLUSIF','CAMPURAN','FORMULA')` |
| `ikterus` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `tanda_bahaya` | `BIT` | `NOT NULL` | `DEFAULT 0` |
| `tgl_kontrol_berikutnya` | `DATE` | `NULL` | |
| `catatan` | `NVARCHAR(500)` | `NULL` | |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

#### 4.3.7 Layanan, Tindakan & Harga

##### 47. `Layanan_Medis` — Katalog layanan dan tindakan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `kategori` | `VARCHAR(20)` | `NOT NULL` | |
| `satuan` | `VARCHAR(20)` | `NOT NULL` | |
| `kode_icd9` | `VARCHAR(30)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 48. `Tindakan_Kunjungan` — Tindakan yang dilakukan pada kunjungan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `tindakan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `qty` | `DECIMAL(10,2)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 49. `Paket_Layanan` — Paket bundling layanan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `paket_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 50. `Paket_Detail` — Isi paket layanan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `paket_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Paket_Layanan.paket_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Layanan_Medis.layanan_id` |
| `qty` | `DECIMAL(10,2)` | `NOT NULL` | |

##### 51. `Harga_Layanan` — Riwayat harga layanan (per kelas dan penjamin).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `harga_layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `kelas_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kelas_Perawatan.kelas_id` |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Penjamin.penjamin_id` |
| `diubah_oleh` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `harga` | `DECIMAL(14,2)` | `NOT NULL` | `CHECK: harga > 0` |
| `berlaku_dari` | `DATE` | `NOT NULL` | |
| `berlaku_sampai` | `DATE` | `NULL` | |
| `alasan` | `NVARCHAR(MAX)` | `NOT NULL` | |

##### 52. `Harga_Paket` — Riwayat harga paket.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `harga_paket_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `paket_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Paket_Layanan.paket_id` |
| `diubah_oleh` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `harga` | `DECIMAL(14,2)` | `NOT NULL` | `CHECK: harga > 0` |
| `berlaku_dari` | `DATE` | `NOT NULL` | |
| `berlaku_sampai` | `DATE` | `NULL` | |
| `alasan` | `NVARCHAR(MAX)` | `NOT NULL` | |

#### 4.3.8 Penunjang Medis, Bedah & Darah

##### 53. `Operasi` — Jadwal dan laporan operasi.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `operasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Ruangan.ruangan_id` |
| `jenis_anestesi` | `VARCHAR(20)` | `NOT NULL` | |
| `jadwal_mulai` | `DATETIME2` | `NOT NULL` | |
| `waktu_mulai` | `DATETIME2` | `NOT NULL` | |
| `waktu_selesai` | `DATETIME2` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `laporan` | `NVARCHAR(MAX)` | `NULL` | |

##### 54. `Tim_Operasi` — Tim kamar operasi.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `operasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Operasi.operasi_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Staf.staf_id` |
| `peran_operasi` | `VARCHAR(20)` | `NOT NULL` | |

##### 55. `Order_Penunjang` — Order laboratorium dan radiologi.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `order_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_pemesan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `waktu_order` | `DATETIME2` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 56. `Order_Penunjang_Detail` — Rincian order penunjang.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `order_detail_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `order_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Order_Penunjang.order_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 57. `Parameter_Lab` — Parameter dan nilai rujukan lab.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `parameter_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `satuan` | `VARCHAR(20)` | `NOT NULL` | |
| `nilai_rujukan_min` | `DECIMAL(12,3)` | `NOT NULL` | |
| `nilai_rujukan_maks` | `DECIMAL(12,3)` | `NOT NULL` | |

##### 58. `Hasil_Lab` — Hasil laboratorium.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `hasil_lab_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `order_detail_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Order_Penunjang_Detail.order_detail_id` |
| `parameter_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Parameter_Lab.parameter_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `nilai` | `VARCHAR(50)` | `NOT NULL` | |
| `flag` | `VARCHAR(20)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 59. `Hasil_Radiologi` — Hasil radiologi.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `hasil_rad_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `order_detail_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Order_Penunjang_Detail.order_detail_id`; UNIQUE |
| `radiolog_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `temuan` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `kesan` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `berkas_gambar` | `VARCHAR(255)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 60. `Pendonor` — Data pendonor darah.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pendonor_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `gol_darah` | `VARCHAR(20)` | `NOT NULL` | |
| `rhesus` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_lahir` | `DATE` | `NOT NULL` | |
| `no_telepon` | `VARCHAR(16)` | `NOT NULL` | |

##### 61. `Kantong_Darah` — Stok kantong darah.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `kantong_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pendonor_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Pendonor.pendonor_id` |
| `no_kantong` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `komponen` | `VARCHAR(20)` | `NOT NULL` | |
| `gol_darah` | `VARCHAR(20)` | `NOT NULL` | |
| `rhesus` | `VARCHAR(20)` | `NOT NULL` | |
| `volume_ml` | `INT` | `NOT NULL` | |
| `tgl_ambil` | `DATE` | `NOT NULL` | |
| `tgl_kedaluwarsa` | `DATE` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 62. `Transfusi` — Transfusi darah.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `transfusi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `kantong_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kantong_Darah.kantong_id`; UNIQUE |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `waktu_mulai` | `DATETIME2` | `NOT NULL` | |
| `waktu_selesai` | `DATETIME2` | `NULL` | |
| `reaksi` | `VARCHAR(20)` | `NULL` | |

#### 4.3.9 Farmasi & Inventaris

##### 63. `Obat` — Master obat, alkes, dan produk kesehatan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama_generik` | `NVARCHAR(100)` | `NOT NULL` | |
| `nama_dagang` | `NVARCHAR(100)` | `NOT NULL` | |
| `kategori` | `VARCHAR(20)` | `NOT NULL` | `CHECK: kategori IN ('OBAT','ALKES','PRODUK_KESEHATAN')` |
| `bentuk` | `VARCHAR(20)` | `NOT NULL` | |
| `satuan` | `VARCHAR(20)` | `NOT NULL` | |
| `kekuatan` | `VARCHAR(50)` | `NOT NULL` | |
| `golongan` | `VARCHAR(20)` | `NOT NULL` | |
| `stok_minimum` | `DECIMAL(10,2)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 64. `Pemasok` — Master pemasok.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pemasok_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `alamat` | `NVARCHAR(255)` | `NOT NULL` | |
| `kontak` | `VARCHAR(16)` | `NOT NULL` | |
| `npwp` | `VARCHAR(30)` | `NOT NULL` | |
| `aktif` | `BIT` | `NOT NULL` | `DEFAULT 1` |

##### 65. `Gudang` — Master gudang dan depo.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `gudang_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |

##### 66. `Purchase_Order` — Pesanan pembelian.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `po_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pemasok_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pemasok.pemasok_id` |
| `dibuat_oleh` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `no_po` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `tgl` | `DATE` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 67. `PO_Detail` — Rincian pesanan pembelian.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `po_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Purchase_Order.po_id` |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Obat.obat_id` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | |
| `harga_satuan` | `DECIMAL(14,2)` | `NOT NULL` | |

##### 68. `Penerimaan_Barang` — Penerimaan barang dari pemasok.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `penerimaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `po_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Purchase_Order.po_id` |
| `pemasok_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pemasok.pemasok_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `no_faktur` | `VARCHAR(30)` | `NOT NULL` | |
| `tgl` | `DATE` | `NOT NULL` | |

##### 69. `Batch_Obat` — Batch obat beserta kedaluwarsa.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `batch_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Obat.obat_id` |
| `penerimaan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Penerimaan_Barang.penerimaan_id` |
| `no_batch` | `VARCHAR(30)` | `NOT NULL` | |
| `tgl_kedaluwarsa` | `DATE` | `NOT NULL` | |
| `harga_beli` | `DECIMAL(14,2)` | `NOT NULL` | |
| `tgl_masuk` | `DATE` | `NOT NULL` | |

##### 70. `Stok_Batch` — Stok per batch per gudang.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `batch_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Batch_Obat.batch_id` |
| `gudang_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Gudang.gudang_id` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | `CHECK: jumlah >= 0` |

##### 71. `Mutasi_Stok` — Riwayat seluruh mutasi stok.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `mutasi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `batch_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Batch_Obat.batch_id` |
| `gudang_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Gudang.gudang_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | `CHECK: jenis IN ('MASUK','PAKAI','KOREKSI','KEDALUWARSA','TRANSFER')` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `keterangan` | `NVARCHAR(MAX)` | `NULL` | |

##### 72. `Resep` — Resep per kunjungan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `resep_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `tanggal` | `DATE` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `override_alergi` | `BIT` | `NOT NULL` | |
| `alasan_override` | `NVARCHAR(MAX)` | `NULL` | |

##### 73. `Resep_Detail` — Rincian obat pada resep.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `resep_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Resep.resep_id` |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Obat.obat_id` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | |
| `aturan_pakai` | `NVARCHAR(MAX)` | `NOT NULL` | |

##### 74. `Pengeluaran_Obat` — Pengeluaran obat per resep (FEFO).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pengeluaran_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `resep_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Resep.resep_id` |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Obat.obat_id` |
| `batch_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Batch_Obat.batch_id` |
| `gudang_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Gudang.gudang_id` |
| `apoteker_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |

##### 75. `Stok_Opname` — Stok opname gudang.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `opname_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `gudang_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Gudang.gudang_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `tanggal` | `DATE` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 76. `Opname_Detail` — Rincian stok opname.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `opname_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Stok_Opname.opname_id` |
| `batch_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK (komposit); FK → `Batch_Obat.batch_id` |
| `stok_sistem` | `DECIMAL(10,2)` | `NOT NULL` | |
| `stok_fisik` | `DECIMAL(10,2)` | `NOT NULL` | |

##### 77. `Harga_Obat` — Riwayat harga obat.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `harga_obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `obat_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Obat.obat_id` |
| `diubah_oleh` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `harga_jual` | `DECIMAL(14,2)` | `NOT NULL` | `CHECK: harga_jual > 0` |
| `berlaku_dari` | `DATE` | `NOT NULL` | |
| `berlaku_sampai` | `DATE` | `NULL` | |
| `alasan` | `NVARCHAR(MAX)` | `NOT NULL` | |

#### 4.3.10 Penunjang Operasional & Aset

##### 78. `Jenis_Diet` — Master jenis diet.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `diet_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `keterangan` | `NVARCHAR(MAX)` | `NULL` | |

##### 79. `Order_Gizi` — Order diet rawat inap.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `order_gizi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `rawat_inap_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Rawat_Inap.rawat_inap_id` |
| `diet_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Jenis_Diet.diet_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `tanggal` | `DATE` | `NOT NULL` | |
| `waktu_makan` | `DATETIME2` | `NOT NULL` | |
| `catatan` | `NVARCHAR(MAX)` | `NULL` | |

##### 80. `Sesi_Terapi` — Sesi terapi/rehabilitasi.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `sesi_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `aset_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Aset.aset_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `mulai` | `DATETIME2` | `NOT NULL` | |
| `selesai` | `DATETIME2` | `NULL` | |
| `catatan` | `NVARCHAR(MAX)` | `NULL` | |

##### 81. `Ambulans` — Master ambulans.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `ambulans_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `aset_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Aset.aset_id`; UNIQUE bila `aset_id IS NOT NULL` |
| `plat_nomor` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `tahun` | `SMALLINT` | `NOT NULL` | |
| `kapasitas` | `SMALLINT` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_kir_berikutnya` | `DATE` | `NOT NULL` | |

##### 82. `Perjalanan_Ambulans` — Perjalanan ambulans.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `perjalanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `ambulans_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Ambulans.ambulans_id` |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kunjungan.kunjungan_id` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Layanan_Medis.layanan_id` |
| `sopir_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `pendamping_staf_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Staf.staf_id` |
| `asal` | `NVARCHAR(255)` | `NOT NULL` | |
| `tujuan` | `NVARCHAR(255)` | `NOT NULL` | |
| `waktu_berangkat` | `DATETIME2` | `NOT NULL` | |
| `waktu_tiba` | `DATETIME2` | `NULL` | |
| `jarak_km` | `DECIMAL(7,1)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 83. `Set_Instrumen` — Set instrumen steril.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `set_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `jumlah_item` | `SMALLINT` | `NOT NULL` | |

##### 84. `Siklus_Sterilisasi` — Siklus sterilisasi instrumen.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `siklus_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `set_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Set_Instrumen.set_id` |
| `aset_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Aset.aset_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `metode` | `VARCHAR(20)` | `NOT NULL` | |
| `mulai` | `DATETIME2` | `NOT NULL` | |
| `selesai` | `DATETIME2` | `NULL` | |
| `hasil_indikator` | `NVARCHAR(MAX)` | `NOT NULL` | |

##### 85. `Transaksi_Laundry` — Transaksi laundry linen.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `laundry_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis_linen` | `VARCHAR(20)` | `NOT NULL` | |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | |
| `tgl_kirim` | `DATE` | `NOT NULL` | |
| `tgl_selesai` | `DATE` | `NULL` | |

##### 86. `Limbah` — Pencatatan limbah medis.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `limbah_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `berat_kg` | `DECIMAL(8,2)` | `NOT NULL` | |
| `tgl` | `DATE` | `NOT NULL` | |
| `vendor_pengangkut` | `NVARCHAR(100)` | `NOT NULL` | |

##### 87. `Pemulasaran_Jenazah` — Pemulasaran jenazah.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pemulasaran_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `pasien_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Pasien.pasien_id` |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kunjungan.kunjungan_id` |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Ruangan.ruangan_id` |
| `staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `waktu_meninggal` | `DATETIME2` | `NOT NULL` | |
| `penyebab` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `waktu_masuk` | `DATETIME2` | `NOT NULL` | |
| `waktu_diserahkan` | `DATETIME2` | `NULL` | |
| `penerima` | `NVARCHAR(100)` | `NOT NULL` | |

##### 88. `Aset` — Master aset dan alat.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `aset_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `ruangan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Ruangan.ruangan_id` |
| `kode` | `VARCHAR(30)` | `NOT NULL` | UNIQUE |
| `nama` | `NVARCHAR(100)` | `NOT NULL` | |
| `kategori` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_perolehan` | `DATE` | `NOT NULL` | |
| `harga_perolehan` | `DECIMAL(14,2)` | `NOT NULL` | |
| `kondisi` | `VARCHAR(20)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |

##### 89. `Pemeliharaan_Aset` — Pemeliharaan dan kalibrasi aset.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pemeliharaan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `aset_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Aset.aset_id` |
| `teknisi_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `tanggal` | `DATE` | `NOT NULL` | |
| `biaya` | `DECIMAL(14,2)` | `NOT NULL` | |
| `hasil` | `NVARCHAR(MAX)` | `NULL` | |
| `jadwal_berikutnya` | `DATE` | `NULL` | |

#### 4.3.11 Keuangan & Penagihan

##### 90. `Tagihan` — Tagihan per kunjungan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `tagihan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Kunjungan.kunjungan_id`; UNIQUE |
| `total_tagihan` | `DECIMAL(14,2)` | `NOT NULL` | `CHECK: total_dibayar <= total_tagihan` |
| `total_dibayar` | `DECIMAL(14,2)` | `NOT NULL` | `CHECK: total_dibayar <= total_tagihan` |
| `status` | `VARCHAR(20)` | `NOT NULL` | `CHECK: status IN ('BELUM_LUNAS','LUNAS')` |
| `tgl_terbit` | `DATE` | `NOT NULL` | |

##### 91. `Tagihan_Rincian` — Rincian tagihan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `rincian_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `tagihan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Tagihan.tagihan_id` |
| `obat_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Obat.obat_id`; `CHECK: (CASE WHEN obat_id IS NULL THEN 0 ELSE 1 END + CASE WHEN layanan_id IS NULL THEN 0 ELSE 1 END + CASE WHEN paket_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `layanan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Layanan_Medis.layanan_id`; `CHECK: (CASE WHEN obat_id IS NULL THEN 0 ELSE 1 END + CASE WHEN layanan_id IS NULL THEN 0 ELSE 1 END + CASE WHEN paket_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `paket_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Paket_Layanan.paket_id`; `CHECK: (CASE WHEN obat_id IS NULL THEN 0 ELSE 1 END + CASE WHEN layanan_id IS NULL THEN 0 ELSE 1 END + CASE WHEN paket_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `qty` | `DECIMAL(10,2)` | `NOT NULL` | `CHECK: qty > 0` |
| `harga_satuan` | `DECIMAL(14,2)` | `NOT NULL` | |
| `subtotal` | `DECIMAL(14,2)` | `NOT NULL` | |

##### 92. `Pembayaran` — Pembayaran (pelunasan, uang muka, cicilan).
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `pembayaran_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `tagihan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Tagihan.tagihan_id` |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Penjamin.penjamin_id` |
| `kasir_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jumlah` | `DECIMAL(10,2)` | `NOT NULL` | `CHECK: jumlah > 0` |
| `metode` | `VARCHAR(20)` | `NOT NULL` | `CHECK: metode IN ('TUNAI','TRANSFER','QRIS','KARTU')` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | `CHECK: jenis IN ('PELUNASAN','UANG_MUKA','CICILAN')` |
| `waktu_bayar` | `DATETIME2` | `NOT NULL` | |

##### 93. `Klaim_Penjamin` — Klaim ke penjamin.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `klaim_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `tagihan_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Tagihan.tagihan_id` |
| `penjamin_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Penjamin.penjamin_id` |
| `no_sep` | `VARCHAR(30)` | `NOT NULL` | |
| `kode_grup_tarif` | `VARCHAR(30)` | `NOT NULL` | |
| `tarif_klaim` | `DECIMAL(14,2)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl_ajuan` | `DATE` | `NOT NULL` | |
| `tgl_dibayar` | `DATE` | `NULL` | |

#### 4.3.12 Sistem (Notifikasi, Konten, Audit, Insiden)

##### 94. `Notifikasi_Log` — Log notifikasi email.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `notif_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `reservasi_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Reservasi.reservasi_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `tujuan` | `NVARCHAR(255)` | `NOT NULL` | |
| `pesan` | `NVARCHAR(500)` | `NOT NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | `CHECK: status IN ('ANTRE','TERKIRIM','GAGAL')` |
| `retry_count` | `SMALLINT` | `NOT NULL` | |
| `waktu_kirim` | `DATETIME2` | `NOT NULL` | |
| `created_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 95. `Konten_Publik` — Konten halaman publik.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `konten_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `tipe` | `VARCHAR(20)` | `NOT NULL` | `CHECK: tipe IN ('PROFIL','LAYANAN','KONTAK','GALERI','TESTIMONI')` |
| `judul` | `NVARCHAR(100)` | `NOT NULL` | |
| `isi` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `media_url` | `VARCHAR(255)` | `NOT NULL` | |
| `urutan` | `SMALLINT` | `NOT NULL` | |
| `terbit` | `BIT` | `NOT NULL` | `DEFAULT 1` |
| `updated_at` | `DATETIME2` | `NOT NULL` | `DEFAULT SYSDATETIME()` |

##### 96. `Audit_Log` — Jejak audit *append-only*.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `log_id` | `BIGINT` | `NOT NULL` | PK; `IDENTITY` |
| `akun_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Akun_Pengguna.akun_id` |
| `aksi` | `VARCHAR(40)` | `NOT NULL` | |
| `tabel` | `VARCHAR(40)` | `NOT NULL` | |
| `id_baris` | `VARCHAR(40)` | `NOT NULL` | |
| `nilai_lama` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `nilai_baru` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `ip_address` | `VARCHAR(45)` | `NOT NULL` | |
| `waktu` | `DATETIME2` | `NOT NULL` | |
| `user_ref` | `NVARCHAR(50)` | `NULL` | |
| `keterangan` | `NVARCHAR(200)` | `NULL` | Deskripsi manusiawi aksi, mis. `Login`, `Mendaftar Antrian` |

##### 97. `Laporan_Insiden` — Laporan insiden keselamatan.
| Kolom | Tipe | Nullability | Keterangan |
| :--- | :--- | :--- | :--- |
| `insiden_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | PK |
| `kunjungan_id` | `UNIQUEIDENTIFIER` | `NULL` | FK → `Kunjungan.kunjungan_id` |
| `unit_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Unit_Pelayanan.unit_id` |
| `pelapor_staf_id` | `UNIQUEIDENTIFIER` | `NOT NULL` | FK → `Staf.staf_id` |
| `jenis` | `VARCHAR(20)` | `NOT NULL` | |
| `tingkat_keparahan` | `VARCHAR(20)` | `NOT NULL` | |
| `deskripsi` | `NVARCHAR(MAX)` | `NOT NULL` | |
| `tindak_lanjut` | `NVARCHAR(MAX)` | `NULL` | |
| `status` | `VARCHAR(20)` | `NOT NULL` | |
| `tgl` | `DATE` | `NOT NULL` | |

### 4.4 CHECK Constraint, Unique Index & Index Pendukung

Terdapat 33 `CHECK` constraint dan 13 index (termasuk unique index berfilter) di luar `PK`, `UNIQUE`, dan `FK` yang sudah tercantum pada kamus data. Total FK: 193.

| Jenis | Nama | Tabel | Aturan |
| :--- | :--- | :--- | :--- |
| `CHECK` | `CK_Tempat_Tidur_status` | `Tempat_Tidur` | `status IN ('KOSONG','TERISI','PEMBERSIHAN')` |
| `CHECK` | `CK_Staf_email` | `Staf` | `email IS NULL OR email LIKE '_%@_%._%'` |
| `CHECK` | `CK_Peran_kode` | `Peran` | `kode IN ('SUPERADMIN','ADMIN_LOKAL','DOKTER','STAFF','PASIEN')` |
| `CHECK` | `CK_Akun_Pengguna_pemilik` | `Akun_Pengguna` | `(CASE WHEN staf_id IS NULL THEN 0 ELSE 1 END) + (CASE WHEN pasien_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `CHECK` | `CK_Akun_Pengguna_sub_peran` | `Akun_Pengguna` | `sub_peran IS NULL OR sub_peran IN ('PERAWAT','RESEPSIONIS')` |
| `CHECK` | `CK_Pasien_1` | `Pasien` | `LEN(nik) = 16` |
| `CHECK` | `CK_Pasien_email` | `Pasien` | `email IS NULL OR email LIKE '_%@_%._%'` |
| `CHECK` | `CK_Penjamin_jenis` | `Penjamin` | `jenis IN ('MANDIRI','BPJS','ASURANSI')` |
| `CHECK` | `CK_Jadwal_Praktik_1` | `Jadwal_Praktik` | `kuota_maks > 0` |
| `CHECK` | `CK_Reservasi_status` | `Reservasi` | `status IN ('MENUNGGU','DIPANGGIL','SELESAI','DIBATALKAN')` |
| `CHECK` | `CK_Reservasi_metode` | `Reservasi` | `metode_daftar IN ('ONLINE','MANUAL_ADMIN')` |
| `CHECK` | `CK_Kunjungan_jenis` | `Kunjungan` | `jenis_kunjungan IN ('RAWAT_JALAN','IGD','RAWAT_INAP','PERSALINAN','KONTROL')` |
| `CHECK` | `CK_Alergi_kategori` | `Alergi_Kondisi` | `kategori IN ('ALERGI_OBAT','KEHAMILAN_RISTI','PENYAKIT_BAWAAN')` |
| `CHECK` | `CK_Asuhan_BBL_keadaan` | `Asuhan_BBL` | `keadaan_umum IN ('BAIK','PERLU_PEMANTAUAN','RUJUK')` |
| `CHECK` | `CK_Pemeriksaan_Bayi_jenis` | `Pemeriksaan_Bayi` | `jenis IN ('KN1','KN2','KN3','TUMBUH_KEMBANG')` |
| `CHECK` | `CK_Pemeriksaan_Bayi_berat` | `Pemeriksaan_Bayi` | `berat_gram > 0` |
| `CHECK` | `CK_Pemeriksaan_Bayi_tali_pusat` | `Pemeriksaan_Bayi` | `kondisi_tali_pusat IS NULL OR kondisi_tali_pusat IN ('KERING','BASAH','INFEKSI')` |
| `CHECK` | `CK_Pemeriksaan_Bayi_menyusu` | `Pemeriksaan_Bayi` | `menyusu IS NULL OR menyusu IN ('ASI_EKSKLUSIF','CAMPURAN','FORMULA')` |
| `CHECK` | `CK_Harga_Layanan_1` | `Harga_Layanan` | `harga > 0` |
| `CHECK` | `CK_Harga_Paket_1` | `Harga_Paket` | `harga > 0` |
| `CHECK` | `CK_Obat_kategori` | `Obat` | `kategori IN ('OBAT','ALKES','PRODUK_KESEHATAN')` |
| `CHECK` | `CK_Stok_Batch_1` | `Stok_Batch` | `jumlah >= 0` |
| `CHECK` | `CK_Mutasi_jenis` | `Mutasi_Stok` | `jenis IN ('MASUK','PAKAI','KOREKSI','KEDALUWARSA','TRANSFER')` |
| `CHECK` | `CK_Harga_Obat_1` | `Harga_Obat` | `harga_jual > 0` |
| `CHECK` | `CK_Tagihan_1` | `Tagihan` | `total_dibayar <= total_tagihan` |
| `CHECK` | `CK_Tagihan_status` | `Tagihan` | `status IN ('BELUM_LUNAS','LUNAS')` |
| `CHECK` | `CK_Tagihan_Rincian_1` | `Tagihan_Rincian` | `qty > 0` |
| `CHECK` | `CK_Tagihan_Rincian_2` | `Tagihan_Rincian` | `(CASE WHEN obat_id IS NULL THEN 0 ELSE 1 END + CASE WHEN layanan_id IS NULL THEN 0 ELSE 1 END + CASE WHEN paket_id IS NULL THEN 0 ELSE 1 END) = 1` |
| `CHECK` | `CK_Pembayaran_1` | `Pembayaran` | `jumlah > 0` |
| `CHECK` | `CK_Pembayaran_metode` | `Pembayaran` | `metode IN ('TUNAI','TRANSFER','QRIS','KARTU')` |
| `CHECK` | `CK_Pembayaran_jenis` | `Pembayaran` | `jenis IN ('PELUNASAN','UANG_MUKA','CICILAN')` |
| `CHECK` | `CK_Notifikasi_status` | `Notifikasi_Log` | `status IN ('ANTRE','TERKIRIM','GAGAL')` |
| `CHECK` | `CK_Konten_tipe` | `Konten_Publik` | `tipe IN ('PROFIL','LAYANAN','KONTAK','GALERI','TESTIMONI')` |
| `UNIQUE INDEX` | `UX_Staf_email` | `Staf` | `(email) WHERE email IS NOT NULL` |
| `UNIQUE INDEX` | `UX_Akun_Pengguna_staf_id` | `Akun_Pengguna` | `(staf_id) WHERE staf_id IS NOT NULL` |
| `UNIQUE INDEX` | `UX_Akun_Pengguna_pasien_id` | `Akun_Pengguna` | `(pasien_id) WHERE pasien_id IS NOT NULL` |
| `INDEX` | `IX_Pasien_nama` | `Pasien` | `(nama)` |
| `UNIQUE INDEX` | `UX_Reservasi_antrean_per_jadwal` | `Reservasi` | `(jadwal_id, nomor_antrean) WHERE status <> 'DIBATALKAN'` |
| `INDEX` | `IX_Reservasi_jadwal_status` | `Reservasi` | `(jadwal_id, status)` |
| `UNIQUE INDEX` | `UX_Kunjungan_reservasi_id` | `Kunjungan` | `(reservasi_id) WHERE reservasi_id IS NOT NULL` |
| `INDEX` | `IX_Kunjungan_pasien_tgl` | `Kunjungan` | `(pasien_id, tgl_masuk)` |
| `UNIQUE INDEX` | `UX_Diagnosa_kode_icd` | `Diagnosa` | `(kode_icd) WHERE kode_icd IS NOT NULL` |
| `UNIQUE INDEX` | `UX_Pemeriksaan_Bayi_KN` | `Pemeriksaan_Bayi` | `(bayi_id, jenis) WHERE jenis IN ('KN1','KN2','KN3')` |
| `INDEX` | `IX_Pemeriksaan_Bayi_bayi_tgl` | `Pemeriksaan_Bayi` | `(bayi_id, tgl_pemeriksaan)` |
| `UNIQUE INDEX` | `UX_Ambulans_aset_id` | `Ambulans` | `(aset_id) WHERE aset_id IS NOT NULL` |
| `INDEX` | `IX_Audit_waktu` | `Audit_Log` | `(waktu)` |

---

## TSD Bagian 5 — Pembaruan Stored Procedures & DB Objects

| Objek DB | Tipe | Pembaruan (v2.1 sampai v3.0) |
| :--- | :--- | :--- |
| `sp_pulang_rawat_inap` | Stored Procedure (Baru) | Menutup `rawat_inap` (`tgl_keluar = SYSDATETIME()`), mengubah `tempat_tidur.status` menjadi `'PEMBERSIHAN'`, serta menutup `kunjungan` (`tgl_keluar`, `cara_keluar`, `status = 'SELESAI'`) secara atomik dalam 1 transaksi. |
| `sp_simpan_kunjungan` | Stored Procedure (Revisi) | Memotong stok per batch dengan urutan FEFO dari `stok_batch` dan mencatat `mutasi_stok` (jenis `'PAKAI'`) untuk seluruh unit; modul Bidan memakai tabel yang sama sehingga tidak ada lagi tabel `item_inventaris` maupun `riwayat_stok` terpisah. |
| `v_sesi_sisa_kuota` | View (Kompatibel v1.0) | Menyertakan alias kolom `sesi_id = jadwal_id` dan `is_active = aktif` agar query dari FE Bidan maupun FE RS berjalan identik. |
| `v_grafik_tumbuh_kembang_bayi` | View (Baru) | Menggabungkan `pemeriksaan_bayi`, `bayi_lahir`, dan `pasien` (`tgl_lahir`) untuk menghasilkan usia (hari/bulan), berat, panjang, dan lingkar kepala per pemeriksaan sebagai sumber grafik tumbuh kembang. |
| `trg_audit_asuhan_bbl` & `trg_audit_pemeriksaan_bayi` | Trigger (Baru) | Mencatat perubahan data asuhan bayi baru lahir dan pemeriksaan bayi ke `audit_log` (*append-only*). |
| `cronReminderH1.js` | Job Terjadwal (Revisi) | Selain reservasi dan kontrol KB, pengingat email H-1 mencakup `tgl_kontrol_berikutnya` pada `pemeriksaan_bayi` (kunjungan neonatal dan kontrol tumbuh kembang). |
| `08_seed_bidan_rs.sql` | Seed Data (Revisi) | Menambah katalog `layanan_medis` kategori KIA: Pemeriksaan Kehamilan (ANC), Persalinan Normal, Pelayanan KB (suntik, pil, IUD, implan), Asuhan Bayi Baru Lahir, Kunjungan Neonatal (KN1–KN3), Pemantauan Tumbuh Kembang Bayi, dan Imunisasi Bayi, agar seluruh layanan kebidanan dapat dipilih pada reservasi dan penagihan, serta master `peran` (`SUPERADMIN`, `ADMIN_LOKAL`, `DOKTER`, `STAFF`, `PASIEN`) sesuai `CK_Peran_kode`. |
| `04_ddl_ekstensi_bidan_v3.sql` | Skrip Migrasi (Baru) | Dijalankan setelah `03_ddl_schema_gabungan.sql`: menambah `pasien.email` dan `staf.email`, akun portal `PASIEN` dan `sub_peran` pada `akun_pengguna`, `CK_Peran_kode`, `rawat_inap.catatan_pulang`, tabel `asuhan_bbl` dan `pemeriksaan_bayi`, serta view `v_grafik_tumbuh_kembang_bayi`. Hasil akhir 97 tabel. |

---

## TSD Bagian 6 — Security, CORS Whitelist & Implementasi RBAC 5 Role

### 6.1 Contoh Implementasi Middleware RBAC pada Backend Express

```javascript
// apps/backend/src/middleware/rbac.js
export const authorizeRoles = (...allowedProfiles) => {
  return (req, res, next) => {
    const user = req.user; // Dari JWT: { akun_id, peran, sub_peran, unit_id }
    if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Bentuk profil efektif: 'STAFF:PERAWAT', 'STAFF:RESEPSIONIS', atau 'DOKTER', 'ADMIN_LOKAL', 'SUPERADMIN', 'PASIEN'
    const effectiveProfile = user.peran === 'STAFF' && user.sub_peran
      ? `STAFF:${user.sub_peran}`
      : user.peran;

    if (!allowedProfiles.includes(effectiveProfile)) {
      return res.status(403).json({
        status: 'error',
        message: `Akses ditolak untuk peran ${effectiveProfile}`,
        errors: [{ code: 'ERR-AUTH-03' }]
      });
    }
    return next();
  };
};
```

| Aspek Keamanan | Implementasi Teknis pada Arsitektur Vercel + Server VPS |
| :--- | :--- |
| **Segregation of Duties (RBAC)** | Pemisahan ketat antara wewenang klinis (`DOKTER`, `STAFF:PERAWAT`), front-office & kasir (`STAFF:RESEPSIONIS`), logistik & tarif (`ADMIN_LOKAL`), tata kelola sistem & pembuatan akun (`SUPERADMIN`), dan layanan mandiri (`PASIEN`). |
| **CORS Whitelist Lintas Domain** | Express middleware `cors()` hanya mengizinkan origin FE Bidan (`https://bidan.[domain].id`) dan FE RS (`https://rs.[domain].id`) di Vercel, dengan `allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-App']`. |
| **Enkripsi End-to-End HTTPS** | Vercel menyediakan sertifikat TLS otomatis untuk kedua domain frontend, sementara subdomain `api.[domain].id` di Server VPS wajib menggunakan sertifikat SSL/TLS 1.3 (Let's Encrypt / Win-ACME). |
| **Audit Trail Terpadu** | Setiap aksi dari seluruh role mencatat `akun_id`, `peran`, `sub_peran`, `ip_address`, dan sumber klien ke tabel `audit_log` yang bersifat *append-only* (`trg_audit_logs_immutable`). |

---

## Lampiran — Konfigurasi Environment Variables Produksi (VPS & Vercel)

| Lokasi | Variabel | Nilai Produksi (Opsi A) | Keterangan |
| :--- | :--- | :--- | :--- |
| **VPS (`.env`)** | `NODE_ENV` | `production` | Mode aplikasi backend Express |
| **VPS (`.env`)** | `PORT` | `3000` | Port internal Express API di balik Reverse Proxy |
| **VPS (`.env`)** | `ALLOWED_ORIGINS` | `https://bidan.[domain].id,https://rs.[domain].id` | Whitelist origin kedua project Vercel untuk CORS |
| **VPS (`.env`)** | `DEFAULT_UNIT_BIDAN_ID` | `[UUID Unit Poli KIA/Bidan]` | Unit default otomatis saat header `X-Client-App: BIDAN` |
| **VPS (`.env`)** | `DB_HOST` / `DB_NAME` | `localhost` / `MiniWorldRS` | Koneksi lokal SQL Server 2025 (97 tabel) |
| **VPS (`.env`)** | `JWT_SECRET` | `[acak >= 64 karakter]` | Kunci penandatangan token JWT |
| **VPS (`.env`)** | `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` | Konfigurasi email transaksional untuk OTP & notifikasi |
| **Vercel (Project 1 & 2)** | `VITE_API_URL` | `https://api.[domain].id/api/v1` | URL endpoint HTTPS Backend VPS untuk `fe-bidan` & `fe-rs` |