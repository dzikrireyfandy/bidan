# FUNCTIONAL SPECIFICATION DOCUMENT (FSD)
## Sistem Digitalisasi Praktik Mandiri Bidan
**Versi 1.0**

* **Disusun oleh:** Tanpa Ampun - Kelompok 01 - Sains Data B
* **Daftar anggota:**
  1. Muhammad Dzikri Reyfandy
  2. Muhamamd Ghazy Hikmatiar
  3. Muhammad Naufal Hafizh Fauzia Putra
  4. Rasya Pradipta Effendi
* **Dosen Pengampu:** Bambang Widoyono, S.T., M.T.I.
* **Tanggal:** 24 Oktober 2026

---

## Riwayat Revisi Dokumen

| Versi | Tanggal | Disusun Oleh | Status | Deskripsi Perubahan |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 | 26/10/2026 | Tanpa Ampun - Kelompok 01 | Draft | Versi awal dokumen FSD v1.0, diturunkan dari SRS v1.0, DRD v1.0, dan System Modelling v1.0 |

---

## Lembar Persetujuan

| Peran | Nama | Tanggung Jawab Dokumen | Tanda Tangan | Tanggal |
| :--- | :--- | :--- | :--- | :--- |
| Project Leader & UI/UX | Muhammad Dzikri Reyfandy | FSD Bagian 1, 2, 3 | | 24/9/2026 |
| Frontend Developer | Muhamamd Ghazy Hikmatiar | FSD Bagian 2, 3, 4 | | 24/9/2026 |
| Frontend Developer | Muhammad Naufal Hafizh Fauzia Putra | FSD Bagian 4, 5, 6 | | 24/9/2026 |
| Backend Developer | Rasya Pradipta Effendi | FSD Bagian 5, 6 | | 24/9/2026 |
| Pemilik Klinik | Ria Indrasti J. S.keb | | | 24/9/2026 |
| Dosen | Bambang Widoyono S.T., M.I.T. | | | 24/9/2026 |

---

## FSD Bagian 1: System Overview & Scope

### 1.1 Tujuan Sistem (System Purpose Statement)
Sistem Digitalisasi Praktik Mandiri Bidan adalah sistem berbasis web yang dirancang untuk mengelola seluruh proses operasional harian Praktik Mandiri Bdn. Ria Indrasti J., S.Keb, mulai dari pendaftaran pasien, antrean, pemeriksaan dan rekam medis elektronik, penagihan, inventaris obat dan produk kesehatan, hingga laporan operasional.

Sistem ini menjawab permasalahan rekam medis yang masih manual dan terpisah, pendaftaran yang belum terjadwal sehingga pasien menumpuk pada jam tertentu, risiko riwayat alergi atau kehamilan berisiko yang terlewat, pencatatan keuangan manual, serta stok obat yang berisiko habis atau kedaluwarsa tanpa disadari. Sistem juga mencatat riwayat perubahan harga obat, produk, dan layanan agar kenaikan pendapatan akibat kenaikan harga dapat dibedakan dari kenaikan jumlah layanan.

Pengguna yang dilayani adalah Bidan/Pemilik Praktik, Admin/Staf Pendaftaran, dan Pasien atau calon pasien. Seluruh perubahan data penting dicatat dalam audit log untuk akuntabilitas dan kepatuhan terhadap UU PDP.

### 1.2 Scope - IN SCOPE (Fungsi yang Dicakup)

| No | Modul | Deskripsi Singkat | Referensi SRS | FSD Seksi 2 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Autentikasi & Otorisasi | Login, logout/auto-logout, reset kata sandi, kontrol akses berbasis peran | FR-045 s.d. FR-049 | 2.1–2.3 |
| 2 | Halaman Publik & Branding | Profil praktik, layanan, kontak, galeri/testimoni | FR-042 s.d. FR-044 | 2.4, 2.17 |
| 3 | Pendaftaran & Antrean | Reservasi online, pendaftaran walk-in, kelola antrean dan kuota sesi | FR-001 s.d. FR-010 | 2.5–2.7 |
| 4 | Rekam Medis Elektronik | Pencarian riwayat, pemeriksaan digital, cetak ringkasan RME | FR-011 s.d. FR-019 | 2.8, 2.9, 2.11 |
| 5 | Keselamatan Pasien (Red-Flag) | Alergi/kondisi khusus, peringatan, validasi resep | FR-020 s.d. FR-024 | 2.10 |
| 6 | Keuangan & Penagihan | Tagihan otomatis, pembayaran, rekap pendapatan | FR-025 s.d. FR-030 | 2.12, 2.13 |
| 7 | Manajemen Inventaris | Stok, kedaluwarsa, restock, riwayat penggunaan | FR-031 s.d. FR-037 | 2.14 |
| 8 | Harga & Riwayat Harga | Kelola harga obat/produk/layanan dan log perubahan harga (UC-08) | FR-054 s.d. FR-056 (usulan) | 2.15 |
| 9 | Dashboard & Laporan | Kunjungan, tren, jam tersibuk, ekspor, analisis efek harga | FR-038 s.d. FR-041 | 2.16 |
| 10 | Notifikasi & Pengingat | Konfirmasi reservasi, pengingat H-1, notifikasi inventaris, log pengiriman | FR-050 s.d. FR-053 | 2.18 |
| 11 | Audit Log | Jejak akses dan perubahan data (append-only) | DR-008, NFR-007 | 2.19 |

### 1.3 Scope - OUT OF SCOPE
1. Integrasi BPJS Kesehatan (klaim dan verifikasi), jalur pembayaran BPJS hanya dicatat sebagai label.
2. Integrasi perangkat medis (Doppler digital, alat laboratorium).
3. Manajemen rantai pasok ke distributor obat.
4. Manajemen aset non-medis (meja, kursi, peralatan kantor).
5. Integrasi SIMRS / sistem apotek eksternal.
6. Verifikasi silang NIK dengan basis data kependudukan resmi, data diasumsikan benar (SRS 2.5).

### 1.4 Referensi Dokumen

| Nama Dokumen | Versi | Tanggal | Keterangan |
| :--- | :--- | :--- | :--- |
| Business Requirements Document (BRD) | v1.0 | 11/09/2026 | Sumber kebutuhan bisnis (BR-001 s.d. BR-008, BO-001 s.d. BO-006) |
| Software Requirements Specification (SRS) | v1.0 | 24/09/2026 | Sumber requirement utama (FR, NFR, DR) |
| Design Requirements Diagram (DFD Level 0-2) | v1.0 | 30/09/2026 | Aliran data, ditambah proses riwayat harga |
| System Modelling - Object Oriented (Use Case, Sequence, Activity) | v1.0 | 06/10/2026 | Dasar elaborasi FSD Seksi 2 (UC-01 s.d. UC-08) |

---

## FSD Bagian 2: Functional Requirements Elaboration

### FSD-2.1 Login & Verifikasi Kredensial

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.1 |
| **Nama Fungsi** | Login & Verifikasi Kredensial |
| **Referensi SRS** | FR-045, FR-046, FR-048 |
| **Actor(s)** | Bidan, Admin |
| **Preconditions** | Akun aktif terdaftar, pengguna belum memiliki sesi aktif. |
| **Trigger** | Pengguna menekan tombol MASUK pada SCR-01. |
| **Postconditions** | JWT terbit, `last_login_at` diperbarui, `failed_attempts` = 0, event `LOGIN_SUCCESS` tercatat di `audit_logs`. |
| **Business Rules** | BR-01, BR-02, BR-03 (detail pada Seksi 4.1) |
| **Data Elements** | `username` (string, maks 50), `password` (string, min 8), `token` (string), `role` (enum `BIDAN` \| `ADMIN`) |
| **Tabel Terlibat (CRUD)** | `users` (R,U), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Pengguna membuka `/login` (SCR-01) dan mengisi username serta kata sandi.
  2. Frontend memvalidasi field wajib tidak kosong.
  3. Frontend mengirim `POST /auth/login`.
  4. Backend mencari akun berdasarkan username dan memeriksa `locked_until`.
  5. Backend memverifikasi kata sandi dengan bcrypt.
  6. Backend mereset `failed_attempts`, memperbarui `last_login_at`, dan menerbitkan JWT (exp 30 menit) berisi `user_id` dan `role`.
  7. Frontend menyimpan token dan mengarahkan pengguna ke SCR-05 sesuai perannya.
* **Alternative Flows (AF):**
  1. **AF-1:** Pengguna menekan "Lupa kata sandi" $\rightarrow$ diarahkan ke FSD-2.3.
  2. **AF-2:** Pengguna masih memiliki token yang valid $\rightarrow$ langsung diarahkan ke SCR-05 tanpa login ulang.
  3. **AF-3:** Masa kunci 15 menit telah lewat $\rightarrow$ `locked_until` dikosongkan otomatis dan login diproses normal.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Username atau kata sandi kosong $\rightarrow$ `ERR-VAL-01`.
  2. **EF-2:** Username/kata sandi salah (percobaan 1–4) $\rightarrow$ `ERR-AUTH-02` (pesan generik), `failed_attempts + 1`.
  3. **EF-3:** Gagal ke-5 berturut-turut $\rightarrow$ `ERR-LOCK-01`, `locked_until = sekarang + 15 menit`.
  4. **EF-4:** Login saat akun masih terkunci atau nonaktif $\rightarrow$ `ERR-LOCK-01`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.2 Logout & Auto-Logout Sesi

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.2 |
| **Nama Fungsi** | Logout & Auto-Logout Sesi |
| **Referensi SRS** | FR-047 |
| **Actor(s)** | Bidan, Admin |
| **Preconditions** | Pengguna memiliki sesi aktif. |
| **Trigger** | Pengguna menekan tombol Keluar, atau 30 menit berlalu tanpa aktivitas. |
| **Postconditions** | Token dihapus dari sisi klien, pengguna diarahkan ke SCR-01, event `LOGOUT` atau `SESSION_TIMEOUT` tercatat. |
| **Business Rules** | BR-04, BR-05, BR-06 (detail pada Seksi 4.1) |
| **Data Elements** | `token` (string), `last_activity` (datetime) |
| **Tabel Terlibat (CRUD)** | `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Pengguna menekan tombol Keluar.
  2. Frontend mengirim `POST /auth/logout`.
  3. Backend mencatat event `LOGOUT` di `audit_logs`.
  4. Frontend menghapus token dari memori.
  5. Frontend mengarahkan pengguna ke `/login` (SCR-01).
* **Alternative Flows (AF):**
  1. **AF-1:** 30 menit tanpa aktivitas $\rightarrow$ timer frontend memanggil logout otomatis dan menampilkan pesan "Sesi berakhir".
  2. **AF-2:** Ada aktivitas sebelum menit ke-30 $\rightarrow$ frontend memanggil `POST /auth/refresh` dan menerima token baru (sliding session).
  3. **AF-3:** Tab ditutup tanpa logout $\rightarrow$ token kedaluwarsa sendiri setelah 30 menit.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Token kedaluwarsa saat request $\rightarrow$ `ERR-AUTH-04`, redirect ke login dan simpan return URL.
  2. **EF-2:** Token tidak valid atau dimanipulasi $\rightarrow$ `ERR-AUTH-01`.
  3. **EF-3:** Gagal menulis audit saat logout $\rightarrow$ logout tetap diproses, kesalahan dicatat di log server (non-blocking).

---

### FSD-2.3 Reset Kata Sandi via Nomor Telepon

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.3 |
| **Nama Fungsi** | Reset Kata Sandi via Nomor Telepon |
| **Referensi SRS** | FR-049 |
| **Actor(s)** | Bidan, Admin (belum login) |
| **Preconditions** | Akun aktif memiliki nomor telepon terdaftar. |
| **Trigger** | Pengguna menekan "Lupa kata sandi" pada SCR-01. |
| **Postconditions** | `password_hash` baru tersimpan, OTP ditandai terpakai, `failed_attempts` = 0 dan `locked_until` dikosongkan. |
| **Business Rules** | BR-07, BR-08, BR-09 (detail pada Seksi 4.1) |
| **Data Elements** | `username` (string), `no_telepon` (string), `kode_otp` (string, 6 digit), `password_baru` (string, min 8) |
| **Tabel Terlibat (CRUD)** | `users` (R,U), `otp_reset` (C,R,U), `log_notifikasi` (C), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Pengguna mengisi username dan nomor telepon terdaftar pada SCR-02.
  2. Frontend mengirim `POST /auth/reset/request`.
  3. Backend mencocokkan data, membuat OTP 6 digit, menyimpan hash OTP dengan masa berlaku 10 menit.
  4. Backend mengirim OTP lewat layanan pesan.
  5. Pengguna memasukkan OTP dan kata sandi baru.
  6. Frontend mengirim `POST /auth/reset/verify`.
  7. Backend memvalidasi OTP, meng-hash kata sandi baru (bcrypt), memperbarui akun, dan menandai OTP terpakai.
  8. Frontend mengarahkan pengguna ke SCR-01.
* **Alternative Flows (AF):**
  1. **AF-1:** OTP kedaluwarsa $\rightarrow$ pengguna menekan "Kirim ulang kode" (maks 3 kali per jam) dan menerima OTP baru.
  2. **AF-2:** Akun sedang terkunci karena gagal login $\rightarrow$ reset berhasil sekaligus membuka kunci akun.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Username/telepon tidak cocok $\rightarrow$ respons generik "Jika data sesuai, kode telah dikirim" (tidak membocorkan akun).
  2. **EF-2:** OTP salah atau kedaluwarsa $\rightarrow$ `ERR-AUTH-05`.
  3. **EF-3:** Kata sandi baru tidak memenuhi aturan $\rightarrow$ `ERR-VAL-01`.
  4. **EF-4:** Pengiriman OTP gagal $\rightarrow$ `ERR-NTF-01`, pengguna diminta mencoba lagi.
  5. **EF-5:** Batas 3 permintaan per jam terlampaui $\rightarrow$ `ERR-AUTH-05`.

---

### FSD-2.4 Lihat Halaman Publik (Profil & Branding)

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.4 |
| **Nama Fungsi** | Lihat Halaman Publik (Profil & Branding) |
| **Referensi SRS** | FR-042, FR-043, BR-007 |
| **Actor(s)** | Pengunjung / Calon Pasien |
| **Preconditions** | Halaman publik dapat diakses melalui internet. |
| **Trigger** | Pengunjung membuka URL halaman utama praktik. |
| **Postconditions** | Konten profil, layanan, kontak, dan galeri tampil, tidak ada data yang berubah. |
| **Business Rules** | BR-10, BR-11, BR-12 (detail pada Seksi 4.1) |
| **Data Elements** | `konten` (`tipe` enum, `judul` string, `isi` text, `media_url` string), `layanan` (`nama` string, `deskripsi` string) |
| **Tabel Terlibat (CRUD)** | `konten_publik` (R), `layanan` (R) |

* **Main Flow (Happy Path):**
  1. Pengunjung membuka halaman utama (SCR-03).
  2. Frontend memanggil `POST /public/konten/list` dan `POST /public/layanan/list`.
  3. Backend mengambil konten berstatus terbit dan layanan aktif.
  4. Frontend menampilkan profil, daftar layanan, kontak, galeri/testimoni.
  5. Pengunjung menekan tombol "Reservasi Sekarang" dan diarahkan ke SCR-04 (FSD-2.5).
* **Alternative Flows (AF):**
  1. **AF-1:** Diakses lewat smartphone lebar $\ge$ 360 px $\rightarrow$ tata letak responsif.
  2. **AF-2:** Pengunjung memperbesar huruf lewat pengaturan browser $\rightarrow$ tata letak tidak rusak (NFR-010).
  3. **AF-3:** Galeri atau testimoni kosong $\rightarrow$ bagian tersebut disembunyikan.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Gagal memuat konten dari server $\rightarrow$ tampil profil statis cadangan dan `ERR-SYS-01`.
  2. **EF-2:** Gambar gagal dimuat $\rightarrow$ tampil placeholder dan teks alternatif.
  3. **EF-3:** Terlalu banyak request dari satu IP $\rightarrow$ `ERR-SYS-03` (HTTP 429).

---

### FSD-2.5 Reservasi Kunjungan Online

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.5 |
| **Nama Fungsi** | Reservasi Kunjungan Online |
| **Referensi SRS** | FR-004, FR-005, FR-006, FR-008, FR-009, FR-010, FR-050, UC-01 |
| **Actor(s)** | Pasien / Calon Pasien |
| **Preconditions** | Sesi praktik pada tanggal yang dituju tersedia dan kuota belum penuh. |
| **Trigger** | Pasien menekan "Reservasi Sekarang" lalu mengirim formulir pada SCR-04. |
| **Postconditions** | Reservasi berstatus `MENUNGGU` tersimpan dengan nomor antrean unik dan estimasi jam, pasien baru tersimpan, notifikasi konfirmasi diantrekan. |
| **Business Rules** | BR-13, BR-14, BR-15, BR-16, BR-17 (detail pada Seksi 4.1) |
| **Data Elements** | `nik` (string, 16 digit), `no_telepon` (string), `nama` (string, maks 100), `tgl_lahir` (date), `alamat` (string, maks 255), `layanan_id` (guid), `sesi_id` (guid) |
| **Tabel Terlibat (CRUD)** | `pasien` (C,R), `reservasi` (C,R), `sesi_praktik` (R), `layanan` (R), `log_notifikasi` (C), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Pasien membuka SCR-04 dan memasukkan NIK atau nomor telepon.
  2. Frontend memanggil `POST /public/pasien/cek` untuk menentukan pasien baru atau lama.
  3. Pasien lama: formulir terisi otomatis, pasien baru: mengisi nama, NIK, tanggal lahir, alamat, telepon.
  4. Pasien memilih layanan, tanggal, dan sesi (`POST /public/sesi/list` menampilkan sisa kuota).
  5. Pasien menekan Kirim dan frontend memanggil `POST /public/reservasi`.
  6. Backend memvalidasi format lalu menjalankan `sp_buat_reservasi`: cek kuota, simpan pasien baru bila perlu, buat reservasi, terbitkan nomor antrean dan estimasi jam (*include: Cek Kuota & Terbitkan Nomor Antrean*).
  7. Backend membalas 201 berisi nomor antrean dan estimasi jam, lalu mengantrekan pesan konfirmasi (*include: Kirim Notifikasi*, FSD-2.18).
  8. Frontend menampilkan konfirmasi reservasi.
* **Alternative Flows (AF):**
  1. **AF-1:** Kuota sesi penuh $\rightarrow$ sistem menampilkan "Kuota penuh" beserta pilihan sesi berikutnya yang masih tersedia (FR-009).
  2. **AF-2:** NIK sudah terdaftar dengan data berbeda $\rightarrow$ sistem menampilkan data lama dan meminta konfirmasi sebelum lanjut (FR-003).
  3. **AF-3:** Pengiriman pesan konfirmasi gagal $\rightarrow$ reservasi tetap sah, nomor antrean tampil di layar, log notifikasi berstatus `GAGAL` masuk antrean kirim ulang.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Field wajib kosong atau NIK bukan 16 digit $\rightarrow$ `ERR-VAL-01` / `ERR-VAL-03`, isian tidak hilang.
  2. **EF-2:** Format telepon tidak valid $\rightarrow$ `ERR-VAL-02`.
  3. **EF-3:** Dua pasien berebut kuota terakhir $\rightarrow$ `sp_buat_reservasi` atomik, pasien yang kalah menerima `ERR-RSV-01`.
  4. **EF-4:** Pasien sudah memiliki reservasi aktif pada sesi yang sama $\rightarrow$ `ERR-RSV-04`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`, transaksi di-rollback.

---

### FSD-2.6 Pendaftaran Pasien Walk-in oleh Admin

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.6 |
| **Nama Fungsi** | Pendaftaran Pasien Walk-in oleh Admin |
| **Referensi SRS** | FR-001, FR-002, FR-003, FR-005, FR-008, FR-010, UC-02 |
| **Actor(s)** | Admin |
| **Preconditions** | Admin telah login, sesi praktik hari ini tersedia. |
| **Trigger** | Admin menekan "Pasien Baru" pada SCR-06. |
| **Postconditions** | Data pasien tersimpan, nomor antrean hari ini terbit, `metode_daftar = MANUAL_ADMIN`. |
| **Business Rules** | BR-18, BR-19, BR-20, BR-21 (detail pada Seksi 4.1) |
| **Data Elements** | `nama` (string), `nik` (string, 16 digit), `tgl_lahir` (date), `alamat` (string), `no_telepon` (string), `layanan_id` (guid) |
| **Tabel Terlibat (CRUD)** | `pasien` (C,R), `reservasi` (C), `sesi_praktik` (R), `layanan` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin membuka SCR-06 dan memilih "Pasien Baru".
  2. Admin mengisi nama, NIK, tanggal lahir, alamat, telepon, dan layanan.
  3. Frontend memvalidasi field wajib dan format.
  4. Frontend mengirim `POST /pasien/walk-in`.
  5. Backend memvalidasi kelengkapan dan format serta keunikan NIK (*include: Validasi Data Pasien*).
  6. Backend menjalankan `sp_buat_reservasi`: simpan pasien dan terbitkan nomor antrean untuk sesi berjalan.
  7. Backend membalas 201 berisi nomor antrean.
  8. Admin menyerahkan nomor antrean kepada pasien.
* **Alternative Flows (AF):**
  1. **AF-1:** Pasien lama datang tanpa reservasi $\rightarrow$ Admin mencari identitas (`POST /pasien/identitas/list`) lalu menekan "Daftarkan kunjungan" tanpa mengisi ulang data.
  2. **AF-2:** Kuota sesi penuh $\rightarrow$ sistem menawarkan sesi berikutnya atau Admin melakukan override kuota dengan alasan wajib yang tercatat di audit.
  3. **AF-3:** Admin menekan "Simpan & Daftar Lagi" $\rightarrow$ formulir dikosongkan untuk pasien berikutnya.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Field wajib (nama, NIK, telepon) kosong $\rightarrow$ `ERR-VAL-01`, data yang sudah diketik tetap tampil.
  2. **EF-2:** NIK sudah terdaftar $\rightarrow$ `ERR-RSV-02` dan data pasien lama ditampilkan sebagai konfirmasi (FR-003).
  3. **EF-3:** Format telepon tidak valid $\rightarrow$ `ERR-VAL-02`.
  4. **EF-4:** NIK bukan 16 digit numerik $\rightarrow$ `ERR-VAL-03`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.7 Kelola Reservasi, Antrean & Kuota Sesi

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.7 |
| **Nama Fungsi** | Kelola Reservasi, Antrean & Kuota Sesi |
| **Referensi SRS** | FR-007, FR-009 |
| **Actor(s)** | Admin |
| **Preconditions** | Admin telah login, terdapat reservasi atau sesi praktik. |
| **Trigger** | Admin membuka SCR-07. |
| **Postconditions** | Status/jadwal reservasi diperbarui, nomor antrean sesi terdampak disusun ulang, kuota sesi tersimpan. |
| **Business Rules** | BR-22, BR-23, BR-24, BR-25 (detail pada Seksi 4.1) |
| **Data Elements** | `reservasi_id` (guid), `sesi_id` (guid), `status` (enum), `tanggal` (date), `jam_mulai` (time), `kuota_maks` (int), `durasi_per_pasien` (int) |
| **Tabel Terlibat (CRUD)** | `reservasi` (R,U), `sesi_praktik` (C,R,U), `log_notifikasi` (C), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin membuka SCR-07 dan memilih tanggal.
  2. Frontend memanggil `POST /reservasi/list` (body: `tanggal`).
  3. Backend menampilkan daftar antrean beserta status.
  4. Admin memilih reservasi lalu memilih Batalkan atau Jadwalkan Ulang.
  5. Frontend memanggil `PATCH /reservasi/{id}/jadwal` atau `/batal`.
  6. Backend menjalankan `sp_reschedule_reservasi`: mengubah status/sesi dan menyusun ulang nomor antrean serta estimasi jam pada sesi terdampak.
  7. Backend mengantrekan notifikasi perubahan ke pasien (FSD-2.18).
  8. Frontend menampilkan daftar terbaru.
* **Alternative Flows (AF):**
  1. **AF-1:** Admin membuat atau mengubah sesi dan `kuota_maks` (`POST /sesi`, `PATCH /sesi/{id}`).
  2. **AF-2:** Reservasi dibatalkan $\rightarrow$ status `DIBATALKAN` dan slot kuota kembali tersedia.
  3. **AF-3:** Jadwal ulang ke tanggal lain yang masih memiliki kuota $\rightarrow$ pasien menerima nomor antrean baru.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Sesi tujuan sudah penuh $\rightarrow$ `ERR-RSV-01`.
  2. **EF-2:** Reservasi sudah berstatus `DIPANGGIL`/`SELESAI` $\rightarrow$ `ERR-RSV-03`.
  3. **EF-3:** Kuota baru lebih kecil dari jumlah reservasi aktif $\rightarrow$ `ERR-RSV-05`.
  4. **EF-4:** Peran tidak berwenang $\rightarrow$ `ERR-AUTH-03`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.8 Cari Riwayat & Buka Profil Pasien

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.8 |
| **Nama Fungsi** | Cari Riwayat & Buka Profil Pasien |
| **Referensi SRS** | FR-015, FR-016, BR-001 |
| **Actor(s)** | Bidan |
| **Preconditions** | Bidan telah login. |
| **Trigger** | Bidan mengetik kata kunci pada SCR-08 atau memilih pasien dari antrean. |
| **Postconditions** | Hasil pencarian tampil, pembukaan profil tercatat sebagai `VIEW_RME` di audit trail. |
| **Business Rules** | BR-26, BR-27, BR-28 (detail pada Seksi 4.1) |
| **Data Elements** | `q` (string, min 3), `tgl_lahir` (date), `pasien_id` (guid), `page` (int) |
| **Tabel Terlibat (CRUD)** | `pasien` (R), `kunjungan` (R), `alergi_kondisi` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Bidan membuka SCR-08 dan mengetik nama, NIK, atau tanggal lahir.
  2. Frontend memanggil `POST /pasien/list` (body: `q`).
  3. Backend mencari pasien (terindeks) dan mengembalikan maks 15 hasil per halaman.
  4. Bidan memilih pasien dari hasil.
  5. Frontend memanggil `POST /pasien/{id}/rme/detail`.
  6. Backend mencatat audit `VIEW_RME` lalu mengembalikan profil, alergi/kondisi, dan riwayat kunjungan (terbaru lebih dulu).
  7. Frontend menampilkan SCR-09.
* **Alternative Flows (AF):**
  1. **AF-1:** Pencarian menggunakan tanggal lahir $\rightarrow$ filter eksak pada `tgl_lahir`.
  2. **AF-2:** Hasil lebih dari 15 $\rightarrow$ ditampilkan dengan paginasi.
  3. **AF-3:** Pasien dibuka langsung dari antrean berjalan (SCR-07) tanpa pencarian.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Kata kunci kurang dari 3 karakter $\rightarrow$ `ERR-VAL-01`.
  2. **EF-2:** Tidak ada hasil $\rightarrow$ pesan "Pasien tidak ditemukan" dengan tautan ke pendaftaran baru (bukan error sistem).
  3. **EF-3:** Admin mencoba membuka data RME $\rightarrow$ `ERR-AUTH-03` dan percobaan dicatat.
  4. **EF-4:** Pasien tidak ditemukan saat membuka profil $\rightarrow$ `ERR-RME-04`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.9 Pemeriksaan & Pencatatan Rekam Medis

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.9 |
| **Nama Fungsi** | Pemeriksaan & Pencatatan Rekam Medis |
| **Referensi SRS** | FR-011, FR-012, FR-013, FR-014, FR-017, FR-018, FR-032, UC-03 |
| **Actor(s)** | Bidan |
| **Preconditions** | Pasien berstatus `MENUNGGU`/`DIPANGGIL` pada antrean (atau dibuka lewat pencarian), Bidan telah login, konfirmasi red-flag selesai bila ada (FSD-2.10). |
| **Trigger** | Bidan menekan "Mulai Periksa" pada SCR-09. |
| **Postconditions** | Entri kunjungan baru tersimpan (append-only), resep tersimpan, stok berkurang, tagihan otomatis dibuat, reservasi berstatus `SELESAI`. |
| **Business Rules** | BR-29, BR-30, BR-31, BR-32 (detail pada Seksi 4.1) |
| **Data Elements** | `keluhan` (text), `pemeriksaan_fisik` (text), `diagnosis` (string, maks 255), `tindakan` (string), `resep` `[{item_id guid, jumlah decimal, aturan_pakai string}]`, `catatan_bebas` (text) |
| **Tabel Terlibat (CRUD)** | `kunjungan` (C,R), `resep_item` (C), `item_inventaris` (R,U), `riwayat_stok` (C), `tagihan` (C), `tagihan_rincian` (C), `reservasi` (U), `alergi_kondisi` (R), `riwayat_harga` (R), `layanan` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Bidan memilih pasien dari antrean sehingga status reservasi menjadi `DIPANGGIL`.
  2. Sistem menampilkan riwayat terbaru dan red-flag (FSD-2.10).
  3. Bidan mengisi formulir pada SCR-10: keluhan, pemeriksaan fisik, diagnosis, tindakan, resep.
  4. Bidan menekan Simpan dan frontend memanggil `POST /pasien/{id}/kunjungan`.
  5. Backend memvalidasi data dan mencocokkan resep dengan alergi pasien (`fn_cek_alergi`).
  6. Backend menjalankan `sp_simpan_kunjungan` secara atomik: simpan kunjungan dan resep, kurangi stok dan catat `riwayat_stok` (*include: Kurangi Stok Otomatis*), buat tagihan dengan harga berlaku.
  7. Backend membalas 201 dan mengubah status reservasi menjadi `SELESAI`.
  8. Frontend menampilkan konfirmasi data tersimpan.
* **Alternative Flows (AF):**
  1. **AF-1:** Pemeriksaan tanpa resep $\rightarrow$ kunjungan tersimpan tanpa pengurangan stok dan tagihan hanya berisi jasa layanan.
  2. **AF-2:** Bidan menambah catatan bebas setelah simpan (`PATCH /kunjungan/{id}/catatan`) tanpa mengubah diagnosis maupun resep (FR-017).
  3. **AF-3:** Pasien walk-in tanpa reservasi aktif $\rightarrow$ Bidan membuka dari pencarian dan sistem membuat kunjungan tanpa reservasi.
  4. **AF-4:** Koreksi diagnosis atau resep $\rightarrow$ Bidan membuat entri kunjungan koreksi yang tertaut ke entri asal (`koreksi_dari_id`), entri asal tidak diubah.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Keluhan atau diagnosis kosong $\rightarrow$ `ERR-VAL-01`, isian formulir tetap tampil.
  2. **EF-2:** Resep memuat obat yang tercatat alergi $\rightarrow$ `ERR-RME-01` (lihat FSD-2.10).
  3. **EF-3:** Stok item tidak cukup $\rightarrow$ `ERR-INV-01`, seluruh transaksi di-rollback dan formulir tetap terisi.
  4. **EF-4:** Admin mencoba mengubah diagnosis/resep $\rightarrow$ `ERR-RME-03`.
  5. **EF-5:** Red-flag belum dikonfirmasi $\rightarrow$ `ERR-RME-02`.
  6. **EF-6:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`, rollback.

---

### FSD-2.10 Penanganan Peringatan Keselamatan Pasien (Red-Flag)

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.10 |
| **Nama Fungsi** | Penanganan Peringatan Keselamatan Pasien (Red-Flag) |
| **Referensi SRS** | FR-020, FR-021, FR-022, FR-023, FR-024, UC-04 |
| **Actor(s)** | Bidan, Sistem |
| **Preconditions** | Bidan telah login, profil pasien memiliki data alergi atau kondisi khusus aktif. |
| **Trigger** | Bidan membuka profil pasien (SCR-09). |
| **Postconditions** | Banner red-flag tampil, konfirmasi baca tercatat, resep yang memuat obat alergi tidak tersimpan tanpa konfirmasi override. |
| **Business Rules** | BR-33, BR-34, BR-35, BR-36 (detail pada Seksi 4.1) |
| **Data Elements** | `kategori` (enum `ALERGI_OBAT` \| `KEHAMILAN_RISTI` \| `PENYAKIT_BAWAAN`), `nama` (string, maks 100), `item_id` (guid, opsional), `keterangan` (string) |
| **Tabel Terlibat (CRUD)** | `alergi_kondisi` (C,R,U), `resep_item` (R), `item_inventaris` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Bidan membuka profil pasien.
  2. Backend mengambil data `alergi_kondisi` aktif dan menyertakan penanda red-flag.
  3. Frontend menampilkan banner merah mencolok di bagian atas profil.
  4. Bidan mencentang "sudah membaca peringatan" dan frontend memanggil `POST /pasien/{id}/red-flag/konfirmasi`.
  5. Backend mencatat konfirmasi di `audit_logs` dan formulir pemeriksaan terbuka.
  6. Saat resep disimpan, backend mencocokkan setiap item resep dengan data alergi (`fn_cek_alergi`).
  7. Tidak ada kecocokan $\rightarrow$ proses simpan dilanjutkan (FSD-2.9).
* **Alternative Flows (AF):**
  1. **AF-1:** Bidan menambah atau menonaktifkan data alergi/kondisi (`POST /pasien/{id}/alergi`, `PATCH /alergi/{id}`) $\rightarrow$ tampil pada kunjungan berikutnya (FR-020).
  2. **AF-2:** Kehamilan berisiko dicatat sebagai kategori terpisah sehingga dapat difilter (FR-024).
  3. **AF-3:** Resep cocok dengan alergi tetapi Bidan memilih override dengan alasan $\rightarrow$ resep tersimpan dan override dicatat di audit.
  4. **AF-4:** Pasien tanpa catatan alergi/kondisi $\rightarrow$ banner tidak muncul dan formulir langsung dapat diisi.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Bidan membuka formulir tanpa mencentang konfirmasi $\rightarrow$ `ERR-RME-02`, formulir terkunci.
  2. **EF-2:** Resep memuat obat alergi tanpa override/perubahan $\rightarrow$ `ERR-RME-01`, penyimpanan dicegah.
  3. **EF-3:** Nama atau kategori alergi kosong/tidak valid $\rightarrow$ `ERR-VAL-01`.
  4. **EF-4:** Peran Admin mencoba mengakses $\rightarrow$ `ERR-AUTH-03`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.11 Cetak / Unduh Ringkasan Rekam Medis (PDF)

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.11 |
| **Nama Fungsi** | Cetak / Unduh Ringkasan Rekam Medis (PDF) |
| **Referensi SRS** | FR-019 |
| **Actor(s)** | Bidan |
| **Preconditions** | Profil pasien terbuka dan Bidan telah login. |
| **Trigger** | Bidan menekan "Cetak Ringkasan PDF" pada SCR-09. |
| **Postconditions** | Berkas PDF terunduh, event `DATA_EXPORTED` tercatat. |
| **Business Rules** | BR-37, BR-38 (detail pada Seksi 4.1) |
| **Data Elements** | `pasien_id` (guid), `dari` (date), `sampai` (date) |
| **Tabel Terlibat (CRUD)** | `pasien` (R), `kunjungan` (R), `alergi_kondisi` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Bidan menekan "Cetak Ringkasan PDF".
  2. Frontend memanggil `POST /pasien/{id}/rme/export`.
  3. Backend mengambil profil, alergi/kondisi, dan riwayat kunjungan.
  4. Backend membuat berkas PDF.
  5. Backend mencatat event `DATA_EXPORTED`.
  6. Browser mengunduh berkas.
* **Alternative Flows (AF):**
  1. **AF-1:** Bidan memilih rentang tanggal kunjungan sebelum mencetak.
  2. **AF-2:** Pasien belum memiliki kunjungan $\rightarrow$ PDF hanya memuat identitas dan catatan "belum ada kunjungan".
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Gagal membuat PDF $\rightarrow$ `ERR-SYS-02`.
  2. **EF-2:** Peran Admin mencoba mengakses $\rightarrow$ `ERR-AUTH-03`.
  3. **EF-3:** Pasien tidak ditemukan $\rightarrow$ `ERR-RME-04`.
  4. **EF-4:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.12 Catat Pembayaran Kunjungan & Tagihan

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.12 |
| **Nama Fungsi** | Catat Pembayaran Kunjungan & Tagihan |
| **Referensi SRS** | FR-025, FR-026, FR-029, FR-030, UC-05 |
| **Actor(s)** | Admin |
| **Preconditions** | Kunjungan telah tersimpan dan tagihan otomatis telah dibuat. |
| **Trigger** | Admin memilih kunjungan pada SCR-11. |
| **Postconditions** | Pembayaran tersimpan, status tagihan `LUNAS` atau `BELUM_LUNAS`, rekap pendapatan harian diperbarui. |
| **Business Rules** | BR-39, BR-40, BR-41, BR-42 (detail pada Seksi 4.1) |
| **Data Elements** | `tagihan_id` (guid), `jumlah` (decimal), `jalur` (enum `MANDIRI` \| `BPJS` \| `ASURANSI`) |
| **Tabel Terlibat (CRUD)** | `tagihan` (R,U), `tagihan_rincian` (R), `pembayaran` (C,R), `kunjungan` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin membuka SCR-11 dan memilih kunjungan.
  2. Frontend memanggil `POST /kunjungan/{id}/tagihan/detail`.
  3. Backend menampilkan rincian jasa dan obat/produk beserta total (*include: Hitung Tagihan Otomatis*).
  4. Admin mengisi jumlah dibayar dan jalur pembayaran.
  5. Frontend memanggil `POST /tagihan/{id}/pembayaran`.
  6. Backend menjalankan `sp_catat_pembayaran`: simpan pembayaran, perbarui `total_dibayar`, set `LUNAS` bila sama dengan total.
  7. Backend membalas 200 berisi status dan sisa tagihan.
  8. Frontend menampilkan status pembayaran.
* **Alternative Flows (AF):**
  1. **AF-1:** Pembayaran sebagian (uang muka) $\rightarrow$ status `BELUM_LUNAS`, sisa tagihan dihitung otomatis dan masuk daftar belum lunas (FR-029).
  2. **AF-2:** Pelunasan susulan $\rightarrow$ pembayaran berikutnya menutup sisa dan status berubah `LUNAS`.
  3. **AF-3:** Daftar kunjungan `BELUM_LUNAS` ditampilkan di dashboard Admin sebagai pengingat (FR-030).
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Jumlah dibayar kosong, nol, atau bukan angka $\rightarrow$ `ERR-VAL-01`.
  2. **EF-2:** Jumlah melebihi sisa tagihan $\rightarrow$ `ERR-FIN-01`.
  3. **EF-3:** Tagihan tidak ditemukan $\rightarrow$ `ERR-FIN-02`.
  4. **EF-4:** Jalur pembayaran tidak valid $\rightarrow$ `ERR-VAL-01`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`, rollback.

---

### FSD-2.13 Rekap Pendapatan Harian & Bulanan

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.13 |
| **Nama Fungsi** | Rekap Pendapatan Harian & Bulanan |
| **Referensi SRS** | FR-027, FR-028, BR-008 |
| **Actor(s)** | Admin, Bidan |
| **Preconditions** | Pengguna telah login, terdapat transaksi pembayaran. |
| **Trigger** | Pengguna membuka SCR-12. |
| **Postconditions** | Rekap pendapatan periode terpilih tampil, tidak ada data berubah. |
| **Business Rules** | BR-43, BR-44 (detail pada Seksi 4.1) |
| **Data Elements** | `jenis` (enum `HARIAN` \| `BULANAN`), `dari` (date), `sampai` (date) |
| **Tabel Terlibat (CRUD)** | `pembayaran` (R), `tagihan` (R) |

* **Main Flow (Happy Path):**
  1. Pengguna membuka SCR-12.
  2. Pengguna memilih jenis periode dan tanggal/bulan.
  3. Frontend memanggil `POST /keuangan/rekap/list`.
  4. Backend mengagregasi pembayaran sesuai periode.
  5. Frontend menampilkan total pendapatan dan rincian per jalur pembayaran.
* **Alternative Flows (AF):**
  1. **AF-1:** Pengguna memilih rentang tanggal kustom.
  2. **AF-2:** Periode tanpa transaksi $\rightarrow$ tampil Rp 0 dengan pesan informasi.
  3. **AF-3:** Bidan membuka halaman yang sama dalam mode baca saja.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Tanggal awal lebih besar dari tanggal akhir $\rightarrow$ `ERR-VAL-01`.
  2. **EF-2:** Rentang melebihi 366 hari $\rightarrow$ `ERR-VAL-01`.
  3. **EF-3:** Peran tidak berwenang $\rightarrow$ `ERR-AUTH-03`.
  4. **EF-4:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.14 Kelola Stok Obat & Produk Kesehatan

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.14 |
| **Nama Fungsi** | Kelola Stok Obat & Produk Kesehatan |
| **Referensi SRS** | FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, UC-06 |
| **Actor(s)** | Admin, Bidan |
| **Preconditions** | Pengguna telah login, item terdaftar pada inventaris (untuk restock). |
| **Trigger** | Pengguna membuka SCR-13. |
| **Postconditions** | Stok dan riwayat stok diperbarui, status peringatan dihitung ulang. |
| **Business Rules** | BR-45, BR-46, BR-47, BR-48 (detail pada Seksi 4.1) |
| **Data Elements** | `nama` (string, maks 100), `kategori` (enum `OBAT` \| `PRODUK_KESEHATAN`), `stok` (decimal), `stok_minimum` (decimal), `tgl_kedaluwarsa` (date), `jumlah_restock` (decimal), `harga_beli` (decimal) |
| **Tabel Terlibat (CRUD)** | `item_inventaris` (C,R,U), `riwayat_stok` (C,R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin atau Bidan membuka SCR-13.
  2. Frontend memanggil `POST /inventaris/list`.
  3. Backend menghitung status tiap item dengan `fn_status_stok` (`AMAN`, `MENIPIS`, `MENDEKATI_KEDALUWARSA`, `KEDALUWARSA`).
  4. Frontend menampilkan daftar item dan peringatan.
  5. Admin memilih item dan mengisi jumlah restock, tanggal, dan harga beli.
  6. Frontend memanggil `POST /inventaris/{id}/restock`.
  7. Backend menjalankan `sp_restock_item`: tambah stok dan catat `riwayat_stok`.
  8. Frontend menampilkan stok terbaru.
* **Alternative Flows (AF):**
  1. **AF-1:** Admin menambah item baru (`POST /inventaris`) berisi nama, kategori, stok awal, stok minimum, kedaluwarsa.
  2. **AF-2:** Admin mengubah ambang stok minimum atau tanggal kedaluwarsa (`PATCH /inventaris/{id}`).
  3. **AF-3:** Pengguna melihat riwayat penggunaan item (`POST /inventaris/{id}/riwayat/list`) (FR-036).
  4. **AF-4:** Bidan mengakses halaman dalam mode baca saja.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Jumlah restock nol, negatif, atau bukan angka $\rightarrow$ `ERR-VAL-01`.
  2. **EF-2:** Pemakaian dari kunjungan melebihi stok $\rightarrow$ `ERR-INV-01`, stok tidak berubah.
  3. **EF-3:** Item tidak ditemukan $\rightarrow$ `ERR-INV-02`.
  4. **EF-4:** Nama dan kategori item sudah ada $\rightarrow$ `ERR-INV-03`.
  5. **EF-5:** Tanggal kedaluwarsa item baru sudah lewat $\rightarrow$ `ERR-VAL-01`.
  6. **EF-6:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.15 Kelola Harga & Riwayat Harga Obat, Produk, Layanan

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.15 |
| **Nama Fungsi** | Kelola Harga & Riwayat Harga Obat, Produk, Layanan |
| **Referensi SRS** | FR-054, FR-055, FR-056 (usulan, turunan UC-08, BR-004, BR-005) |
| **Actor(s)** | Admin (Bidan: baca saja) |
| **Preconditions** | Item inventaris atau layanan telah terdaftar. |
| **Trigger** | Admin membuka SCR-14. |
| **Postconditions** | Harga lama ditutup (`berlaku_sampai` terisi), harga baru aktif, riwayat perubahan tersimpan. |
| **Business Rules** | BR-49, BR-50, BR-51, BR-52 (detail pada Seksi 4.1) |
| **Data Elements** | `ref_tipe` (enum `ITEM` \| `LAYANAN`), `ref_id` (guid), `harga` (decimal), `berlaku_dari` (date), `alasan` (string, maks 255) |
| **Tabel Terlibat (CRUD)** | `riwayat_harga` (C,R,U), `item_inventaris` (R), `layanan` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin membuka SCR-14.
  2. Frontend memanggil `POST /harga/list`.
  3. Backend menampilkan daftar item dan layanan beserta harga berlaku.
  4. Admin memilih item/layanan lalu mengisi harga baru, tanggal berlaku, dan alasan.
  5. Frontend memanggil `PUT /harga/{tipe}/{id}`.
  6. Backend memvalidasi lalu menjalankan `sp_ubah_harga`: menutup harga lama dan membuat baris harga baru (*include: Catat Riwayat Harga Otomatis*).
  7. Frontend menampilkan harga terbaru.
* **Alternative Flows (AF):**
  1. **AF-1:** Admin melihat riwayat harga suatu item (`POST /harga/{tipe}/{id}/riwayat/list`) berisi harga lama, harga baru, tanggal, alasan, pengubah.
  2. **AF-2:** Harga dijadwalkan pada tanggal berlaku di masa depan $\rightarrow$ otomatis aktif saat tanggal tiba.
  3. **AF-3:** Bidan melihat daftar dan riwayat harga dalam mode baca saja.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Harga nol, negatif, atau bukan angka $\rightarrow$ `ERR-PRC-01`.
  2. **EF-2:** Tanggal berlaku lebih awal dari hari ini atau dari harga aktif $\rightarrow$ `ERR-PRC-01`.
  3. **EF-3:** Alasan perubahan kosong $\rightarrow$ `ERR-VAL-01`.
  4. **EF-4:** Item/layanan tidak ditemukan $\rightarrow$ `ERR-INV-02`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.16 Tinjau Laporan Operasional & Analisis Efek Harga

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.16 |
| **Nama Fungsi** | Tinjau Laporan Operasional & Analisis Efek Harga |
| **Referensi SRS** | FR-038, FR-039, FR-040, FR-041, FR-056, UC-07 |
| **Actor(s)** | Bidan / Pemilik Praktik |
| **Preconditions** | Terdapat data kunjungan dan transaksi pada periode yang ditinjau. |
| **Trigger** | Bidan membuka SCR-15. |
| **Postconditions** | Ringkasan, grafik, dan perbandingan periode tampil, berkas PDF/Excel terunduh bila diminta. |
| **Business Rules** | BR-53, BR-54, BR-55 (detail pada Seksi 4.1) |
| **Data Elements** | `dari` (date), `sampai` (date), `pembanding_dari` (date), `pembanding_sampai` (date), `format` (enum `PDF` \| `EXCEL`) |
| **Tabel Terlibat (CRUD)** | `kunjungan` (R), `reservasi` (R), `pembayaran` (R), `tagihan_rincian` (R), `riwayat_harga` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Bidan membuka SCR-15 dan memilih periode (harian/bulanan).
  2. Frontend memanggil `POST /laporan/ringkasan/list`.
  3. Backend mengagregasi jumlah kunjungan dan pendapatan.
  4. Frontend memanggil `POST /laporan/tren-layanan/list` dan `POST /laporan/jam-tersibuk/list`.
  5. Frontend menampilkan jumlah kunjungan, tren layanan/diagnosis terbanyak, jam tersibuk, dan ringkasan pendapatan.
  6. Bidan menekan Unduh dan memilih PDF atau Excel (*extend: Unduh Laporan*).
  7. Backend membuat berkas dan frontend mengunduhnya.
* **Alternative Flows (AF):**
  1. **AF-1:** Bidan memilih periode pembanding $\rightarrow$ `POST /laporan/perbandingan/list` memecah selisih pendapatan menjadi efek volume dan efek harga per item (*extend: Bandingkan Periode & Analisis Efek Harga*).
  2. **AF-2:** Periode tidak dipilih $\rightarrow$ default bulan berjalan.
  3. **AF-3:** Bidan mengekspor laporan pendapatan bulanan ke PDF atau Excel (FR-041).
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Tidak ada data pada periode $\rightarrow$ `ERR-RPT-01` dengan pesan "Data belum tersedia".
  2. **EF-2:** Rentang tanggal tidak valid $\rightarrow$ `ERR-VAL-01`.
  3. **EF-3:** Gagal membuat berkas $\rightarrow$ `ERR-SYS-02`.
  4. **EF-4:** Peran tidak berwenang $\rightarrow$ `ERR-AUTH-03`.
  5. **EF-5:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.17 Kelola Galeri & Testimoni Halaman Publik

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.17 |
| **Nama Fungsi** | Kelola Galeri & Testimoni Halaman Publik |
| **Referensi SRS** | FR-044 |
| **Actor(s)** | Admin |
| **Preconditions** | Admin telah login. |
| **Trigger** | Admin membuka SCR-16. |
| **Postconditions** | Konten tersimpan dan tampil di halaman publik bila diterbitkan. |
| **Business Rules** | BR-56, BR-57, BR-58 (detail pada Seksi 4.1) |
| **Data Elements** | `tipe` (enum), `judul` (string, maks 150), `isi` (text), `media` (file `jpg` \| `png` \| `webp`, maks 2 MB), `is_published` (boolean) |
| **Tabel Terlibat (CRUD)** | `konten_publik` (C,R,U), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Admin membuka SCR-16.
  2. Frontend memanggil `POST /konten/list`.
  3. Admin menambah konten: memilih tipe, mengisi judul, isi, dan mengunggah gambar.
  4. Frontend memanggil `POST /konten`.
  5. Backend memvalidasi dan menyimpan konten.
  6. Konten tampil di halaman publik (FSD-2.4).
* **Alternative Flows (AF):**
  1. **AF-1:** Admin mengubah teks atau urutan konten (`PATCH /konten/{id}`).
  2. **AF-2:** Admin menghapus konten (`DELETE /konten/{id}`) $\rightarrow$ soft delete dengan `is_published = 0`.
  3. **AF-3:** Admin menyimpan sebagai draf (`is_published = 0`).
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Berkas bukan jpg/png/webp atau lebih dari 2 MB $\rightarrow$ `ERR-VAL-04`.
  2. **EF-2:** Judul kosong $\rightarrow$ `ERR-VAL-01`.
  3. **EF-3:** Konten tidak ditemukan $\rightarrow$ `ERR-CNT-01`.
  4. **EF-4:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

### FSD-2.18 Notifikasi & Pengingat Otomatis

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.18 |
| **Nama Fungsi** | Notifikasi & Pengingat Otomatis |
| **Referensi SRS** | FR-050, FR-051, FR-052, FR-053, BR-006 |
| **Actor(s)** | Sistem (penjadwal), Admin (pemantau) |
| **Preconditions** | Layanan pengirim pesan pihak ketiga tersedia, penjadwal (cron) berjalan. |
| **Trigger** | Reservasi dibuat/diubah, penjadwal H-1 pukul 08:00 WIB, penjadwal mingguan Senin pukul 07:00 WIB. |
| **Postconditions** | Pesan terkirim atau berstatus `GAGAL` dengan waktu tercatat di `log_notifikasi`. |
| **Business Rules** | BR-59, BR-60, BR-61 (detail pada Seksi 4.1) |
| **Data Elements** | `jenis` (enum), `tujuan` (string), `pesan` (string, maks 500), `status` (enum `ANTRE` \| `TERKIRIM` \| `GAGAL`), `retry_count` (int) |
| **Tabel Terlibat (CRUD)** | `log_notifikasi` (C,R,U), `reservasi` (R), `item_inventaris` (R), `users` (R), `audit_logs` (C) |

* **Main Flow (Happy Path):**
  1. Pemicu terjadi: reservasi dibuat/diubah, jadwal H-1, atau jadwal mingguan inventaris.
  2. Sistem menyusun pesan dari template dan data variabel (nama, nomor antrean, estimasi jam).
  3. Sistem mengirim pesan lewat API layanan pesan pihak ketiga.
  4. Sistem menerima status pengiriman.
  5. Sistem mencatat status dan waktu di `log_notifikasi`.
  6. Untuk inventaris, sistem mengirim ringkasan item `MENIPIS`/`MENDEKATI_KEDALUWARSA` kepada Admin dan Bidan.
* **Alternative Flows (AF):**
  1. **AF-1:** Admin membuka SCR-17 untuk memantau log (`POST /notifikasi/log/list`).
  2. **AF-2:** Admin mengirim ulang notifikasi berstatus `GAGAL` (`POST /notifikasi/{id}/kirim-ulang`).
  3. **AF-3:** Reservasi dibatalkan atau dijadwalkan ulang $\rightarrow$ sistem mengirim pesan perubahan kepada pasien.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Layanan pesan tidak dapat dihubungi $\rightarrow$ `ERR-NTF-01`, status `GAGAL`, percobaan ulang 3 kali dengan jeda 5 menit, proses utama tidak terganggu.
  2. **EF-2:** Nomor tujuan tidak valid $\rightarrow$ status `GAGAL` tanpa percobaan ulang.
  3. **EF-3:** Percobaan ulang habis $\rightarrow$ status tetap `GAGAL` dan tampil pada SCR-17.
  4. **EF-4:** Penjadwal gagal berjalan $\rightarrow$ kesalahan dicatat di log server.
  5. **EF-5:** Peran tidak berwenang membuka log $\rightarrow$ `ERR-AUTH-03`.

---

### FSD-2.19 Lihat Audit Log Perubahan & Akses Data

| Atribut | Spesifikasi |
| :--- | :--- |
| **Function ID** | FSD-2.19 |
| **Nama Fungsi** | Lihat Audit Log Perubahan & Akses Data |
| **Referensi SRS** | DR-008, NFR-007, SRS 3.6.3 |
| **Actor(s)** | Bidan |
| **Preconditions** | Bidan telah login. |
| **Trigger** | Bidan membuka SCR-18. |
| **Postconditions** | Daftar log tampil sesuai filter, tidak ada data berubah. |
| **Business Rules** | BR-62, BR-63, BR-64 (detail pada Seksi 4.1) |
| **Data Elements** | `user_id` (guid), `aksi` (string), `entitas` (string), `dari` (datetime), `sampai` (datetime), `page` (int) |
| **Tabel Terlibat (CRUD)** | `audit_logs` (R) |

* **Main Flow (Happy Path):**
  1. Bidan membuka SCR-18.
  2. Bidan mengatur filter pengguna, aksi, tabel, dan rentang waktu.
  3. Frontend memanggil `POST /audit-logs/list`.
  4. Backend mengambil data dari `v_audit_log_detail` dengan paginasi.
  5. Frontend menampilkan waktu, pengguna, aksi, entitas, dan IP.
  6. Bidan menekan baris untuk melihat perbandingan nilai lama dan nilai baru.
* **Alternative Flows (AF):**
  1. **AF-1:** Filter hanya aksi perubahan data (`INSERT`, `UPDATE`, `DELETE`).
  2. **AF-2:** Filter hanya akses rekam medis (`VIEW_RME`, `DATA_EXPORTED`).
  3. **AF-3:** Bidan membuka detail baris $\rightarrow$ modal menampilkan nilai lama vs nilai baru berdampingan.
* **Exception Flows (EF) Error Conditions:**
  1. **EF-1:** Peran Admin mencoba mengakses $\rightarrow$ `ERR-AUTH-03` dan percobaan dicatat sebagai `ACCESS_DENIED`.
  2. **EF-2:** Rentang waktu tidak valid $\rightarrow$ `ERR-VAL-01`.
  3. **EF-3:** Tidak ada hasil $\rightarrow$ pesan "Tidak ada log pada filter ini".
  4. **EF-4:** Koneksi database gagal $\rightarrow$ `ERR-SYS-01`.

---

## FSD Bagian 3: UI/UX Specification

### 3.1 Screen Inventory

| Screen ID | Nama Layar | URL/Route | Fungsi Terkait (FSD) |
| :--- | :--- | :--- | :--- |
| SCR-01 | Login | `/login` | FSD-2.1, FSD-2.2 |
| SCR-02 | Reset Kata Sandi | `/reset-password` | FSD-2.3 |
| SCR-03 | Beranda Publik | `/` | FSD-2.4 |
| SCR-04 | Form Reservasi Online | `/reservasi` | FSD-2.5 |
| SCR-05 | Dashboard Internal | `/app/dashboard` | FSD-2.12, FSD-2.14, FSD-2.16 |
| SCR-06 | Pendaftaran Walk-in | `/app/pendaftaran/baru` | FSD-2.6 |
| SCR-07 | Antrean & Kuota Sesi | `/app/antrean` | FSD-2.7 |
| SCR-08 | Pencarian Pasien | `/app/pasien` | FSD-2.8 |
| SCR-09 | Profil Pasien & Riwayat | `/app/pasien/:id` | FSD-2.8, FSD-2.10, FSD-2.11 |
| SCR-10 | Formulir Pemeriksaan | `/app/pasien/:id/periksa` | FSD-2.9, FSD-2.10 |
| SCR-11 | Penagihan | `/app/keuangan/tagihan` | FSD-2.12 |
| SCR-12 | Rekap Pendapatan | `/app/keuangan/rekap` | FSD-2.13 |
| SCR-13 | Inventaris Obat & Produk | `/app/inventaris` | FSD-2.14 |
| SCR-14 | Kelola Harga | `/app/harga` | FSD-2.15 |
| SCR-15 | Laporan Operasional | `/app/laporan` | FSD-2.16 |
| SCR-16 | Kelola Konten Publik | `/app/konten` | FSD-2.17 |
| SCR-17 | Log Notifikasi | `/app/notifikasi` | FSD-2.18 |
| SCR-18 | Audit Log | `/app/audit` | FSD-2.19 |

---

### 3.2 Field Specification

#### 3.2.1 SCR-01: Login
* **a. Wireframe:** Kartu form terpusat (`/login - FSD-2.1, FSD-2.2`) berisi input `1 Username * (text)` dan `2 Kata sandi * (password)` sejajar horizontal, diikuti tombol `3 Tombol MASUK` dan tautan `4 Lupa kata sandi?`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Username | text | Ya | Maks 50 karakter — `ERR-VAL-01` |
| 2 | Kata sandi | password | Ya | Min 8 karakter — `ERR-VAL-01` |
| 3 | Tombol MASUK | submit | Tidak | Memicu Main Flow FSD-2.1 |
| 4 | Lupa kata sandi? | hyperlink | Tidak | Navigasi ke SCR-02 |

#### 3.2.2 SCR-02: Reset Kata Sandi
* **a. Wireframe:** Kartu form terpusat (`/reset-password - FSD-2.3`) dengan grid 2x2: `1 Username * (text)`, `2 No. telepon terdaftar * (tel)`, `3 Kode OTP * (text)`, dan `4 Kata sandi baru * (password)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Username | text | Ya | Maks 50 karakter |
| 2 | No. telepon terdaftar | tel | Ya | 0/+62, min 10 digit — `ERR-VAL-02` |
| 3 | Kode OTP | text | Ya | 6 digit numerik — `ERR-AUTH-05` |
| 4 | Kata sandi baru | password | Ya | Min 8 karakter, $\ge$ 1 huruf besar, $\ge$ 1 angka |

#### 3.2.3 SCR-03: Beranda Publik
* **a. Wireframe:** Halaman publik (`/ - FSD-2.4`) disusun vertikal: blok `1 Profil praktik (teks)`, `2 Daftar layanan (list)`, `3 Galeri / testimoni (carousel)`, dan tombol CTA `4 Tombol Reservasi Sekarang`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Profil praktik | teks | Tidak | Dari `konten_publik` tipe `PROFIL` |
| 2 | Daftar layanan | list | Tidak | Layanan aktif saja |
| 3 | Galeri / testimoni | carousel | Tidak | Hanya `is_published = 1` |
| 4 | Tombol Reservasi Sekarang | button | Tidak | Navigasi ke SCR-04 |

#### 3.2.4 SCR-04: Form Reservasi Online
* **a. Wireframe:** Form responsif (`/reservasi - FSD-2.5`) berisi `1 NIK atau No. telepon * (text)`, `2 Nama * (text)`, `3 Tanggal lahir (date)`, `4 Alamat (textarea)`, `5 Layanan * (select)`, `6 Tanggal & sesi * (select)`, dan `7 Tombol Kirim`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | NIK atau No. telepon | text | Ya | NIK 16 digit atau telepon valid — `ERR-VAL-03/02` |
| 2 | Nama | text | Ya (pasien baru) | Maks 100 karakter |
| 3 | Tanggal lahir | date | Tidak | Tidak boleh di masa depan |
| 4 | Alamat | textarea | Tidak | Maks 255 karakter |
| 5 | Layanan | select | Ya | Layanan aktif |
| 6 | Tanggal & sesi | select | Ya | Hanya sesi dengan kuota > 0 — `ERR-RSV-01` |
| 7 | Tombol Kirim | submit | Tidak | Memicu FSD-2.5 |

#### 3.2.5 SCR-05: Dashboard Internal
* **a. Wireframe:** Layout dengan sidebar kiri (`Dashboard`, `Antrean`, `Pasien`, `Keuangan`, `Inventaris`, `Harga`, `Laporan`, `Konten`, `Notifikasi`, `Audit`) dan konten utama (`/app/dashboard - FSD-2.12, FSD-2.14, FSD-2.16`) berisi `1 Ringkasan kunjungan hari ini (card)`, `2 Peringatan stok (list)`, `3 Tagihan belum lunas (list)`, dan `4 Menu navigasi (sidebar)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Ringkasan kunjungan hari ini | card | Tidak | Baca saja |
| 2 | Peringatan stok | list | Tidak | `MENIPIS` / `MENDEKATI_KEDALUWARSA` (FR-033, FR-034) |
| 3 | Tagihan belum lunas | list | Tidak | Hanya Admin (FR-030) |
| 4 | Menu navigasi | sidebar | Tidak | Tampil sesuai peran (RBAC 4.3) |

#### 3.2.6 SCR-06: Pendaftaran Walk-in
* **a. Wireframe:** Layout internal (`/app/pendaftaran/baru - FSD-2.6`) dengan menu aktif `Antrean`, berisi form `1 Nama * (text)`, `2 NIK * (text)`, `3 Tanggal lahir (date)`, `4 Alamat (textarea)`, `5 No. telepon * (tel)`, `6 Layanan * (select)`, dan `7 Tombol Simpan & Terbitkan Antrean`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Nama | text | Ya | Maks 100 karakter |
| 2 | NIK | text | Ya | 16 digit numerik, unik — `ERR-VAL-03`, `ERR-RSV-02` |
| 3 | Tanggal lahir | date | Tidak | $\le$ hari ini |
| 4 | Alamat | textarea | Tidak | Maks 255 karakter |
| 5 | No. telepon | tel | Ya | 0/+62, min 10 digit — `ERR-VAL-02` |
| 6 | Layanan | select | Ya | Layanan aktif |
| 7 | Tombol Simpan & Terbitkan Antrean | submit | Tidak | Memicu FSD-2.6 |

#### 3.2.7 SCR-07: Antrean & Kuota Sesi
* **a. Wireframe:** Layout internal (`/app/antrean - FSD-2.7`) dengan menu aktif `Antrean`, berisi `1 Filter tanggal * (date)`, `2 Tabel antrean (table)`, `3 Tombol Batalkan / Jadwalkan Ulang`, dan `4 Form sesi (tanggal, jam, kuota, durasi) * (form)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Filter tanggal | date | Ya | Default hari ini |
| 2 | Tabel antrean | table | Tidak | Nomor, nama, layanan, estimasi, status |
| 3 | Tombol Batalkan / Jadwalkan Ulang | button | Tidak | `ERR-RSV-03` bila sudah dilayani |
| 4 | Form sesi (tanggal, jam, kuota, durasi) | form | Ya | `kuota_maks > 0` — `ERR-RSV-05` |

#### 3.2.8 SCR-08: Pencarian Pasien
* **a. Wireframe:** Layout internal (`/app/pasien - FSD-2.8`) dengan menu aktif `Pasien`, berisi `1 Kata kunci (nama/NIK) * (text)`, `2 Filter tanggal lahir (date)`, dan `3 Tabel hasil (table)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Kata kunci (nama/NIK) | text | Ya | Min 3 karakter — `ERR-VAL-01` |
| 2 | Filter tanggal lahir | date | Tidak | Format DD/MM/YYYY |
| 3 | Tabel hasil | table | Tidak | 15 baris per halaman |

#### 3.2.9 SCR-09: Profil Pasien & Riwayat
* **a. Wireframe:** Layout internal (`/app/pasien/:id - FSD-2.8, FSD-2.10, FSD-2.11`) dengan menu aktif `Pasien`, berisi `1 Banner red-flag (alert)`, `2 Centang "sudah membaca peringatan"`, `3 Riwayat kunjungan (timeline)`, `4 Form alergi/kondisi (form)`, `5 Tombol Cetak Ringkasan PDF`, dan `6 Tombol Mulai Periksa`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Banner red-flag | alert | Tidak | Merah; tampil bila ada alergi/kondisi aktif |
| 2 | Centang "sudah membaca peringatan" | checkbox | Ya (bila red-flag) | `ERR-RME-02` |
| 3 | Riwayat kunjungan | timeline | Tidak | Terbaru lebih dulu |
| 4 | Form alergi/kondisi | form | Tidak | Kategori + nama wajib — `ERR-VAL-01` |
| 5 | Tombol Cetak Ringkasan PDF | button | Tidak | Memicu FSD-2.11 |
| 6 | Tombol Mulai Periksa | button | Tidak | Navigasi ke SCR-10 |

#### 3.2.10 SCR-10: Formulir Pemeriksaan
* **a. Wireframe:** Layout internal (`/app/pasien/:id/periksa - FSD-2.9, FSD-2.10`) dengan menu aktif `Pasien`, berisi `1 Keluhan utama * (textarea)`, `2 Pemeriksaan fisik (textarea)`, `3 Diagnosis * (text)`, `4 Tindakan (text)`, `5 Resep (item, jumlah, aturan pakai) (repeater)`, `6 Catatan tambahan (textarea)`, dan `7 Tombol Simpan`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Keluhan utama | textarea | Ya | Maks 2000 karakter — `ERR-VAL-01` |
| 2 | Pemeriksaan fisik | textarea | Tidak | Maks 2000 karakter |
| 3 | Diagnosis | text | Ya | Maks 255 karakter — `ERR-VAL-01` |
| 4 | Tindakan | text | Tidak | Maks 255 karakter |
| 5 | Resep (item, jumlah, aturan pakai) | repeater | Tidak | Item aktif, `jumlah > 0` dan $\le$ stok — `ERR-INV-01`, `ERR-RME-01` |
| 6 | Catatan tambahan | textarea | Tidak | Teks bebas |
| 7 | Tombol Simpan | submit | Tidak | Memicu FSD-2.9 |

#### 3.2.11 SCR-11: Penagihan
* **a. Wireframe:** Layout internal (`/app/keuangan/tagihan - FSD-2.12`) dengan menu aktif `Keuangan`, berisi `1 Pilih kunjungan * (select)`, `2 Rincian tagihan (table)`, `3 Jumlah dibayar * (number)`, dan `4 Jalur pembayaran * (select)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Pilih kunjungan | select | Ya | Kunjungan yang memiliki tagihan |
| 2 | Rincian tagihan | table | Tidak | Baca saja (jasa + obat/produk) |
| 3 | Jumlah dibayar | number | Ya | > 0 dan $\le$ sisa tagihan — `ERR-FIN-01` |
| 4 | Jalur pembayaran | select | Ya | `MANDIRI` / `BPJS` / `ASURANSI` |

#### 3.2.12 SCR-12: Rekap Pendapatan
* **a. Wireframe:** Layout internal (`/app/keuangan/rekap - FSD-2.13`) dengan menu aktif `Keuangan`, berisi `1 Jenis periode`, `2 Tanggal / bulan * (date)`, dan `3 Tabel & grafik rekap (chart)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Jenis periode | radio | Ya | Harian / Bulanan |
| 2 | Tanggal / bulan | date | Ya | Awal $\le$ akhir, maks 366 hari — `ERR-VAL-01` |
| 3 | Tabel & grafik rekap | chart | Tidak | Format Rupiah |

#### 3.2.13 SCR-13: Inventaris Obat & Produk
* **a. Wireframe:** Layout internal (`/app/inventaris - FSD-2.14`) dengan menu aktif `Inventaris`, berisi `1 Nama item * (text)`, `2 Kategori * (select)`, `3 Stok awal / jumlah restock * (number)`, `4 Stok minimum * (number)`, `5 Tanggal kedaluwarsa (date)`, `6 Harga beli (number)`, dan `7 Badge status (badge)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Nama item | text | Ya | Maks 100 karakter |
| 2 | Kategori | select | Ya | `OBAT` / `PRODUK_KESEHATAN` |
| 3 | Stok awal / jumlah restock | number | Ya | $\ge$ 0 / > 0 — `ERR-VAL-01` |
| 4 | Stok minimum | number | Ya | $\ge$ 0 |
| 5 | Tanggal kedaluwarsa | date | Tidak | $\ge$ hari ini |
| 6 | Harga beli | number | Tidak | $\ge$ 0 |
| 7 | Badge status | badge | Tidak | `AMAN` / `MENIPIS` / `MENDEKATI_KEDALUWARSA` |

#### 3.2.14 SCR-14: Kelola Harga
* **a. Wireframe:** Layout internal (`/app/harga - FSD-2.15`) dengan menu aktif `Harga`, berisi `1 Item / layanan * (select)`, `2 Harga baru * (number)`, `3 Berlaku dari * (date)`, `4 Alasan perubahan * (text)`, dan `5 Tabel riwayat harga (table)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Item / layanan | select | Ya | Harus aktif — `ERR-INV-02` |
| 2 | Harga baru | number | Ya | > 0 — `ERR-PRC-01` |
| 3 | Berlaku dari | date | Ya | $\ge$ hari ini dan > `berlaku_dari` harga aktif |
| 4 | Alasan perubahan | text | Ya | Maks 255 karakter |
| 5 | Tabel riwayat harga | table | Tidak | Harga lama, baru, tanggal, alasan, pengubah |

#### 3.2.15 SCR-15: Laporan Operasional
* **a. Wireframe:** Layout internal (`/app/laporan - FSD-2.16`) dengan menu aktif `Laporan`, berisi `1 Periode * (select)`, `2 Periode pembanding (select)`, `3 Grafik tren layanan & jam tersibuk (chart)`, `4 Panel efek volume vs efek harga (table)`, dan `5 Tombol Unduh PDF/Excel`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Periode | select | Ya | Harian / Bulanan |
| 2 | Periode pembanding | select | Tidak | Panjang periode sama |
| 3 | Grafik tren layanan & jam tersibuk | chart | Tidak | Data 30 hari terakhir untuk jam tersibuk |
| 4 | Panel efek volume vs efek harga | table | Tidak | Per item |
| 5 | Tombol Unduh PDF/Excel | button | Tidak | `ERR-SYS-02` bila gagal |

#### 3.2.16 SCR-16: Kelola Konten Publik
* **a. Wireframe:** Layout internal (`/app/konten - FSD-2.17`) dengan menu aktif `Konten`, berisi `1 Tipe konten * (select)`, `2 Judul * (text)`, `3 Isi (textarea)`, `4 Gambar (file)`, dan `5 Terbitkan (checkbox/toggle)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Tipe konten | select | Ya | `GALERI` / `TESTIMONI` / `PROFIL` / `LAYANAN` / `KONTAK` |
| 2 | Judul | text | Ya | Maks 150 karakter — `ERR-VAL-01` |
| 3 | Isi | textarea | Tidak | Testimoni hanya inisial nama |
| 4 | Gambar | file | Tidak | jpg/png/webp $\le$ 2 MB — `ERR-VAL-04` |
| 5 | Terbitkan | toggle | Ya | Default aktif |

#### 3.2.17 SCR-17: Log Notifikasi
* **a. Wireframe:** Layout internal (`/app/notifikasi - FSD-2.18`) dengan menu aktif `Notifikasi`, berisi `1 Filter status (select)`, `2 Tabel log (table)`, dan `3 Tombol Kirim Ulang`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Filter status | select | Tidak | `ANTRE` / `TERKIRIM` / `GAGAL` |
| 2 | Tabel log | table | Tidak | Jenis, tujuan, status, waktu |
| 3 | Tombol Kirim Ulang | button | Tidak | Hanya untuk status `GAGAL` |

#### 3.2.18 SCR-18: Audit Log
* **a. Wireframe:** Layout internal (`/app/audit - FSD-2.19`) dengan menu aktif `Audit`, berisi `1 Filter pengguna (select)`, `2 Filter aksi (select)`, `3 Filter tabel (select)`, `4 Rentang waktu * (date range)`, `5 Tabel log (table)`, dan `6 Detail nilai lama vs baru (modal)`.
* **b. Tabel Spesifikasi:**

| No | Nama Field | Tipe Input | Wajib | Constraint & Validasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Filter pengguna | select | Tidak | Pengguna internal |
| 2 | Filter aksi | select | Tidak | `INSERT`, `UPDATE`, `DELETE`, `VIEW_RME`, ... |
| 3 | Filter tabel | select | Tidak | Entitas terdampak |
| 4 | Rentang waktu | date range | Ya | Awal $\le$ akhir — `ERR-VAL-01` |
| 5 | Tabel log | table | Tidak | Waktu, pengguna, aksi, entitas, IP |
| 6 | Detail nilai lama vs baru | modal | Tidak | Perbandingan JSON |

---

### 3.3 Navigation Flow
1. SCR-01 (Login) $\rightarrow$ `[SUKSES]` $\rightarrow$ SCR-05 (Dashboard Internal)
2. SCR-01 $\rightarrow$ `[GAGAL]` $\rightarrow$ tetap SCR-01 + pesan error (EF-1 s.d. EF-4 FSD-2.1)
3. SCR-01 $\rightarrow$ `[Lupa kata sandi]` $\rightarrow$ SCR-02 (Reset Kata Sandi) $\rightarrow$ `[BERHASIL]` $\rightarrow$ SCR-01
4. SCR-03 (Beranda Publik) $\rightarrow$ `[Reservasi Sekarang]` $\rightarrow$ SCR-04 (Form Reservasi) $\rightarrow$ `[SUKSES]` $\rightarrow$ halaman konfirmasi nomor antrean
5. SCR-05 `[Menu Pendaftaran/Antrean Admin]` $\rightarrow$ SCR-06 / SCR-07
6. SCR-05 `[Menu Pasien Bidan]` $\rightarrow$ SCR-08 $\rightarrow$ `[Pilih pasien]` $\rightarrow$ SCR-09 `[Mulai Periksa]` $\rightarrow$ SCR-10 $\rightarrow$ `[Simpan]` $\rightarrow$ SCR-09
7. SCR-09 $\rightarrow$ `[Banner red-flag]` $\rightarrow$ centang konfirmasi $\rightarrow$ SCR-10 (tanpa centang: tetap SCR-09 + `ERR-RME-02`)
8. SCR-05 `[Menu Keuangan Admin]` $\rightarrow$ SCR-11 / SCR-12
9. SCR-05 $\rightarrow$ `[Menu Inventaris]` $\rightarrow$ SCR-13, `[Menu Harga Admin]` $\rightarrow$ SCR-14
10. SCR-05 $\rightarrow$ `[Menu Laporan Bidan]` $\rightarrow$ SCR-15, `[Menu Audit Bidan]` $\rightarrow$ SCR-18
11. SCR-05 $\rightarrow$ `[Menu Konten Admin]` $\rightarrow$ SCR-16, `[Menu Notifikasi Admin]` $\rightarrow$ SCR-17
12. Akses menu di luar peran $\rightarrow$ tetap di halaman saat ini + `ERR-AUTH-03`, sesi berakhir $\rightarrow$ SCR-01 + `ERR-AUTH-04`

---

## FSD Bagian 4: Business Rules & Validation Logic

### 4.1 Business Rules Catalog

| Rule ID | FSD | Kategori | Pernyataan Aturan Bisnis | Prioritas |
| :--- | :--- | :--- | :--- | :--- |
| BR-01 | FSD 2.1 (Login & Verifikasi Kredensial) | Trigger | Akun dikunci 15 menit setelah 5 kali gagal login berturut-turut pada akun yang sama (FR-046) | Wajib |
| BR-02 | FSD 2.1 (Login & Verifikasi Kredensial) | Security | Kata sandi hanya diverifikasi terhadap hash bcrypt; pesan error login selalu generik dan tidak mengungkap keberadaan username | Wajib |
| BR-03 | FSD 2.1 (Login & Verifikasi Kredensial) | Audit | Setiap percobaan login (berhasil maupun gagal) dicatat ke `audit_logs` beserta alamat IP | Wajib |
| BR-04 | FSD 2.2 (Logout & Auto-Logout Sesi) | Session | Sesi berakhir otomatis setelah 30 menit tanpa aktivitas (FR-047) | Wajib |
| BR-05 | FSD 2.2 (Logout & Auto-Logout Sesi) | Security | Token yang telah di-logout tidak diperpanjang melalui `/auth/refresh` | Wajib |
| BR-06 | FSD 2.2 (Logout & Auto-Logout Sesi) | Audit | Event `LOGOUT` dan `SESSION_TIMEOUT` dicatat | Wajib |
| BR-07 | FSD 2.3 (Reset Kata Sandi via Nomor Telepon) | Security | OTP berlaku 10 menit, sekali pakai, dan disimpan dalam bentuk hash | Wajib |
| BR-08 | FSD 2.3 (Reset Kata Sandi via Nomor Telepon) | Constraint | Maksimal 3 permintaan OTP per akun per jam | Wajib |
| BR-09 | FSD 2.3 (Reset Kata Sandi via Nomor Telepon) | Audit | Event `PASSWORD_RESET` dicatat tanpa menyimpan kata sandi maupun OTP | Wajib |
| BR-10 | FSD 2.4 (Lihat Halaman Publik (Profil & Branding)) | Constraint | Hanya konten dengan `is_published = 1` yang tampil di halaman publik | Wajib |
| BR-11 | FSD 2.4 (Lihat Halaman Publik (Profil & Branding)) | Security | Halaman publik tidak pernah menampilkan data pasien maupun data medis | Wajib |
| BR-12 | FSD 2.4 (Lihat Halaman Publik (Profil & Branding)) | Performance | Halaman termuat $\le$ 5 detik pada koneksi 4G/LTE | Wajib |
| BR-13 | FSD 2.5 (Reservasi Kunjungan Online) | Constraint | Jumlah reservasi aktif per sesi tidak boleh melebihi `kuota_maks` (FR-009) | Wajib |
| BR-14 | FSD 2.5 (Reservasi Kunjungan Online) | Computation | `estimasi_jam` = `jam_mulai` sesi + (`nomor_antrean` - 1) $\times$ `durasi_per_pasien` menit (FR-006) | Wajib |
| BR-15 | FSD 2.5 (Reservasi Kunjungan Online) | Constraint | Nomor antrean unik dan berurutan mulai 1 pada setiap sesi (FR-005) | Wajib |
| BR-16 | FSD 2.5 (Reservasi Kunjungan Online) | Data | `metode_daftar = ONLINE` dicatat pada setiap reservasi (FR-010) | Wajib |
| BR-17 | FSD 2.5 (Reservasi Kunjungan Online) | Security | Endpoint cek pasien dibatasi 10 request/menit per IP dan tidak mengembalikan data medis | Wajib |
| BR-18 | FSD 2.6 (Pendaftaran Pasien Walk-in oleh Admin) | Constraint | Field wajib nama, NIK (16 digit numerik), dan telepon harus valid sebelum data disimpan (FR-002) | Wajib |
| BR-19 | FSD 2.6 (Pendaftaran Pasien Walk-in oleh Admin) | Constraint | NIK bersifat unik pada seluruh pasien (FR-003) | Wajib |
| BR-20 | FSD 2.6 (Pendaftaran Pasien Walk-in oleh Admin) | Data | `metode_daftar = MANUAL_ADMIN` dicatat pada setiap kunjungan walk-in (FR-010) | Wajib |
| BR-21 | FSD 2.6 (Pendaftaran Pasien Walk-in oleh Admin) | Audit | Pembuatan data pasien dicatat beserta nilai barunya | Wajib |
| BR-22 | FSD 2.7 (Kelola Reservasi, Antrean & Kuota Sesi) | Computation | Setelah pembatalan atau jadwal ulang, nomor antrean sesi asal disusun ulang berurutan tanpa celah dan estimasi jam dihitung ulang (FR-007) | Wajib |
| BR-23 | FSD 2.7 (Kelola Reservasi, Antrean & Kuota Sesi) | Constraint | Reservasi berstatus `DIPANGGIL` atau `SELESAI` tidak dapat dibatalkan | Wajib |
| BR-24 | FSD 2.7 (Kelola Reservasi, Antrean & Kuota Sesi) | Constraint | `kuota_maks` tidak boleh lebih kecil dari jumlah reservasi aktif pada sesi tersebut | Wajib |
| BR-25 | FSD 2.7 (Kelola Reservasi, Antrean & Kuota Sesi) | Audit | Perubahan status, sesi, dan kuota dicatat dengan nilai lama dan baru | Wajib |
| BR-26 | FSD 2.8 (Cari Riwayat & Buka Profil Pasien) | Authorization | Data RME hanya dapat dibuka peran Bidan (FR-048) | Wajib |
| BR-27 | FSD 2.8 (Cari Riwayat & Buka Profil Pasien) | Audit | Setiap pembukaan RME dicatat berisi pengguna, waktu, dan aksi `VIEW` (DR-008) | Wajib |
| BR-28 | FSD 2.8 (Cari Riwayat & Buka Profil Pasien) | Performance | 95% pencarian riwayat pasien selesai $\le$ 2 detik (target lebih ketat dari NFR-001) | Wajib |
| BR-29 | FSD 2.9 (Pemeriksaan & Pencatatan Rekam Medis) | Data | Entri kunjungan bersifat append-only dan tidak menimpa riwayat sebelumnya; diagnosis dan resep tersimpan tidak dapat diubah oleh Admin (FR-012, FR-018) | Wajib |
| BR-30 | FSD 2.9 (Pemeriksaan & Pencatatan Rekam Medis) | Constraint | Pengurangan stok atomik bersama penyimpanan kunjungan dan tidak boleh membuat stok negatif (FR-032, FR-037) | Wajib |
| BR-31 | FSD 2.9 (Pemeriksaan & Pencatatan Rekam Medis) | Computation | Harga pada tagihan memakai harga berlaku pada tanggal kunjungan dan disimpan sebagai snapshot di `tagihan_rincian` | Wajib |
| BR-32 | FSD 2.9 (Pemeriksaan & Pencatatan Rekam Medis) | Audit | Pembuatan kunjungan, resep, dan perubahan status reservasi dicatat | Wajib |
| BR-33 | FSD 2.10 (Penanganan Peringatan Keselamatan Pasien (Red-Flag)) | Constraint | Red-flag tampil setiap profil dengan alergi/kondisi aktif dibuka dan tidak tampil bila tidak ada (FR-021) | Wajib |
| BR-34 | FSD 2.10 (Penanganan Peringatan Keselamatan Pasien (Red-Flag)) | Constraint | Konfirmasi "sudah membaca peringatan" wajib sebelum formulir pemeriksaan dapat diisi (FR-023) | Wajib |
| BR-35 | FSD 2.10 (Penanganan Peringatan Keselamatan Pasien (Red-Flag)) | Data | Data alergi dan kondisi khusus bersifat permanen, hanya dapat dinonaktifkan, tidak terhapus otomatis (DR-004) | Wajib |
| BR-36 | FSD 2.10 (Penanganan Peringatan Keselamatan Pasien (Red-Flag)) | Audit | Penambahan, perubahan, konfirmasi baca, dan override dicatat | Wajib |
| BR-37 | FSD 2.11 (Cetak / Unduh Ringkasan Rekam Medis (PDF)) | Authorization | Hanya peran Bidan yang dapat mengekspor RME | Wajib |
| BR-38 | FSD 2.11 (Cetak / Unduh Ringkasan Rekam Medis (PDF)) | Audit | Setiap ekspor RME dicatat sebagai `DATA_EXPORTED` sesuai prinsip UU PDP | Wajib |
| BR-39 | FSD 2.12 (Catat Pembayaran Kunjungan & Tagihan) | Computation | `total_tagihan` = $\Sigma$ (`qty` $\times$ `harga_satuan` snapshot) untuk jasa dan obat/produk (FR-025) | Wajib |
| BR-40 | FSD 2.12 (Catat Pembayaran Kunjungan & Tagihan) | Constraint | Status `LUNAS` hanya bila `total_dibayar = total_tagihan`; pembayaran tidak boleh melebihi sisa tagihan | Wajib |
| BR-41 | FSD 2.12 (Catat Pembayaran Kunjungan & Tagihan) | Data | Setiap pembayaran terikat tepat satu tagihan/kunjungan dan mencatat waktu transaksi (DR-005) | Wajib |
| BR-42 | FSD 2.12 (Catat Pembayaran Kunjungan & Tagihan) | Audit | Pembayaran dan perubahan status tagihan dicatat | Wajib |
| BR-43 | FSD 2.13 (Rekap Pendapatan Harian & Bulanan) | Computation | Rekap bulanan = $\Sigma$ pembayaran pada tagihan berstatus `LUNAS` dalam periode; rekap harian = $\Sigma$ pembayaran pada hari tersebut (FR-027, FR-028) | Wajib |
| BR-44 | FSD 2.13 (Rekap Pendapatan Harian & Bulanan) | Data | Mata uang ditampilkan dalam Rupiah dan tanggal berformat DD/MM/YYYY (Design Constraint SRS 3.5) | Wajib |
| BR-45 | FSD 2.14 (Kelola Stok Obat & Produk Kesehatan) | Constraint | Stok tidak boleh bernilai negatif pada transaksi apa pun (FR-037, DR-003) | Wajib |
| BR-46 | FSD 2.14 (Kelola Stok Obat & Produk Kesehatan) | Trigger | Status `MENIPIS` bila `stok < stok_minimum`; `MENDEKATI_KEDALUWARSA` bila `tgl_kedaluwarsa` $\le$ hari ini + 3 bulan (FR-033, FR-034) | Wajib |
| BR-47 | FSD 2.14 (Kelola Stok Obat & Produk Kesehatan) | Data | `riwayat_stok` mencatat tanggal, jumlah, dan kunjungan terkait (FR-036, DR-010) | Wajib |
| BR-48 | FSD 2.14 (Kelola Stok Obat & Produk Kesehatan) | Audit | Perubahan stok, ambang minimum, dan data item dicatat dengan nilai lama dan baru | Wajib |
| BR-49 | FSD 2.15 (Kelola Harga & Riwayat Harga Obat, Produk, Layanan) | Data | Harga tidak pernah ditimpa; setiap perubahan membuat baris baru dan menutup baris lama (riwayat append-only) | Wajib |
| BR-50 | FSD 2.15 (Kelola Harga & Riwayat Harga Obat, Produk, Layanan) | Constraint | Tidak boleh ada dua harga berlaku yang tumpang tindih untuk item/layanan yang sama pada tanggal yang sama | Wajib |
| BR-51 | FSD 2.15 (Kelola Harga & Riwayat Harga Obat, Produk, Layanan) | Computation | Tagihan dan laporan memakai harga berlaku pada tanggal transaksi (snapshot di `tagihan_rincian`) | Wajib |
| BR-52 | FSD 2.15 (Kelola Harga & Riwayat Harga Obat, Produk, Layanan) | Audit | Setiap perubahan harga dicatat berisi harga lama, harga baru, dan alasan | Wajib |
| BR-53 | FSD 2.16 (Tinjau Laporan Operasional & Analisis Efek Harga) | Computation | Efek volume = (`qty_baru` - `qty_lama`) $\times$ `harga_lama`; efek harga = (`harga_baru` - `harga_lama`) $\times$ `qty_baru`; jumlah keduanya sama dengan selisih pendapatan | Wajib |
| BR-54 | FSD 2.16 (Tinjau Laporan Operasional & Analisis Efek Harga) | Computation | Jam tersibuk dihitung dari data reservasi 30 hari terakhir (FR-040) | Wajib |
| BR-55 | FSD 2.16 (Tinjau Laporan Operasional & Analisis Efek Harga) | Audit | Setiap ekspor laporan dicatat sebagai `DATA_EXPORTED` | Wajib |
| BR-56 | FSD 2.17 (Kelola Galeri & Testimoni Halaman Publik) | Constraint | Testimoni hanya memuat inisial nama dan tidak memuat data medis (kepatuhan UU PDP) | Wajib |
| BR-57 | FSD 2.17 (Kelola Galeri & Testimoni Halaman Publik) | Data | Penghapusan konten berupa soft delete sehingga dapat dipulihkan | Wajib |
| BR-58 | FSD 2.17 (Kelola Galeri & Testimoni Halaman Publik) | Audit | Perubahan konten dicatat dengan nilai lama dan baru | Wajib |
| BR-59 | FSD 2.18 (Notifikasi & Pengingat Otomatis) | Constraint | Kegagalan notifikasi tidak boleh membatalkan atau menggagalkan transaksi utama (SRS 3.6.1) | Wajib |
| BR-60 | FSD 2.18 (Notifikasi & Pengingat Otomatis) | Trigger | Pengingat H-1 pukul 08:00 WIB untuk reservasi berstatus `MENUNGGU`; ringkasan inventaris tiap Senin pukul 07:00 WIB (FR-051, FR-052) | Wajib |
| BR-61 | FSD 2.18 (Notifikasi & Pengingat Otomatis) | Data | Setiap notifikasi dicatat statusnya (`TERKIRIM`/`GAGAL`) beserta waktu pengiriman (FR-053, DR-009) | Wajib |
| BR-62 | FSD 2.19 (Lihat Audit Log Perubahan & Akses Data) | Audit | `audit_logs` bersifat append-only, tidak tersedia endpoint ubah/hapus dan `UPDATE`/`DELETE` ditolak di level database | Wajib |
| BR-63 | FSD 2.19 (Lihat Audit Log Perubahan & Akses Data) | Authorization | Hanya peran Bidan yang dapat melihat audit log | Wajib |
| BR-64 | FSD 2.19 (Lihat Audit Log Perubahan & Akses Data) | Data | Setiap log mencatat identitas pengguna, waktu, jenis aksi, entitas, nilai lama, nilai baru, dan IP (DR-008) | Wajib |

---

### 4.2 Field Validation Matrix

| Field | Tipe | Wajib | Format/Constraint | Pesan Error |
| :--- | :--- | :--- | :--- | :--- |
| `username` | string | Ya | Maks 50 karakter | Username wajib diisi |
| `password` | string | Ya | Min 8 karakter, $\ge$ 1 huruf besar, $\ge$ 1 angka | Kata sandi min 8 karakter dengan 1 huruf besar dan 1 angka |
| `no_telepon` | string | Ya | Diawali 0 atau +62, min 10 digit | Nomor telepon tidak valid |
| `nik` | string | Ya | 16 digit numerik, unik | NIK harus 16 digit angka |
| `nama` | string | Ya | Maks 100 karakter | Nama wajib diisi |
| `tgl_lahir` | date | Tidak | $\le$ hari ini | Tanggal lahir tidak boleh di masa depan |
| `kode_otp` | string | Ya | 6 digit numerik, berlaku 10 menit | Kode tidak valid atau kedaluwarsa |
| `kuota_maks` | integer | Ya | > 0 dan $\ge$ jumlah reservasi aktif | Kuota tidak valid |
| `keluhan` | text | Ya | Maks 2000 karakter | Keluhan utama wajib diisi |
| `diagnosis` | string | Ya | Maks 255 karakter | Diagnosis wajib diisi |
| `jumlah` (resep/stok) | decimal | Ya | > 0, pemakaian $\le$ stok | Jumlah tidak valid atau stok tidak mencukupi |
| `jumlah_dibayar` | decimal | Ya | > 0 dan $\le$ sisa tagihan | Jumlah pembayaran tidak valid |
| `harga_baru` | decimal | Ya | > 0, `berlaku_dari` $\ge$ hari ini | Harga harus lebih dari 0 |
| `tgl_kedaluwarsa` | date | Tidak | $\ge$ hari ini saat item dibuat | Tanggal kedaluwarsa tidak valid |
| `rentang_tanggal` | date range | Ya | Awal $\le$ akhir, maks 366 hari | Rentang tanggal tidak valid |
| `gambar_konten` | file | Tidak | jpg/png/webp, maks 2 MB | Gunakan gambar jpg/png/webp maksimal 2 MB |

---

### 4.3 RBAC Matrix (Role-Based Access Control)
Tiga tingkat akses: **Bidan/Pemilik Praktik** (tertinggi), **Admin/Staf Pendaftaran**, dan **Pasien/Pengunjung** (publik tanpa login). Seluruh pengecekan peran dilakukan di API (FR-048).

| Fungsi / Aksi | Bidan (Pemilik) | Admin | Pasien / Guest |
| :--- | :---: | :---: | :---: |
| FSD-2.1 Login & Verifikasi Kredensial | ✓ | ✓ | X |
| FSD-2.2 Logout & Auto-Logout Sesi | ✓ | ✓ | X |
| FSD-2.3 Reset Kata Sandi via Nomor Telepon | ✓ | ✓ | X |
| FSD-2.4 Lihat Halaman Publik (Profil & Branding) | X | X | ✓ |
| FSD-2.5 Reservasi Kunjungan Online | X | X | ✓ |
| FSD-2.6 Pendaftaran Pasien Walk-in oleh Admin | X | ✓ | X |
| FSD-2.7 Kelola Reservasi, Antrean & Kuota Sesi | X | ✓ | X |
| FSD-2.8 Cari Riwayat & Buka Profil Pasien | ✓ | X | X |
| FSD-2.9 Pemeriksaan & Pencatatan Rekam Medis | ✓ | X | X |
| FSD-2.10 Penanganan Peringatan Keselamatan Pasien (Red-Flag) | ✓ | X | X |
| FSD-2.11 Cetak / Unduh Ringkasan Rekam Medis (PDF) | ✓ | X | X |
| FSD-2.12 Catat Pembayaran Kunjungan & Tagihan | X | ✓ | X |
| FSD-2.13 Rekap Pendapatan Harian & Bulanan | ✓ (baca saja) | ✓ | X |
| FSD-2.14 Kelola Stok Obat & Produk Kesehatan | ✓ (baca saja) | ✓ | X |
| FSD-2.15 Kelola Harga & Riwayat Harga Obat, Produk, Layanan | ✓ (baca saja) | ✓ | X |
| FSD-2.16 Tinjau Laporan Operasional & Analisis Efek Harga | ✓ | X | X |
| FSD-2.17 Kelola Galeri & Testimoni Halaman Publik | X | ✓ | X |
| FSD-2.18 Notifikasi & Pengingat Otomatis | X | ✓ | X |
| FSD-2.19 Lihat Audit Log Perubahan & Akses Data | ✓ | X | X |

> **Catatan:** FSD-2.13, 2.14, dan 2.15 dapat dibuka Bidan dalam mode baca saja, ubah data hanya Admin. FSD-2.1 s.d. 2.3 berlaku bagi pengguna internal sebelum/sesudah login.

---

## FSD Bagian 5: Data Specification & Entity Mapping

### 5.1 Class Diagram and Entity Attribute Specification
Diagram relasi entitas mencakup 18 entitas utama: `users`, `otp_reset`, `audit_logs`, `pasien`, `layanan`, `sesi_praktik`, `log_notifikasi`, `reservasi`, `kunjungan`, `alergi_kondisi`, `item_inventaris`, `riwayat_stok`, `resep_item`, `riwayat_harga`, `tagihan`, `tagihan_rincian`, `pembayaran`, dan `konten_publik`.

#### 5.1.1 Entitas: `users`
Kredensial dan peran pengguna internal (Bidan, Admin). Dirujuk oleh: FSD-2.1, FSD-2.3, FSD-2.18.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | UUID | Ya | Ya | PRIMARY KEY |
| `username` | Text | Ya | Ya | UNIQUE |
| `nama_lengkap` | Text | Ya | Tidak | |
| `password_hash` | Text | Ya | Tidak | hash bcrypt cost 12, tidak pernah plaintext |
| `role` | Text | Ya | Tidak | `CHECK IN ('BIDAN','ADMIN')` |
| `no_telepon` | Text | Ya | Tidak | format `0xxx`/`+62xx` min 10 digit, untuk OTP |
| `is_active` | Boolean | Ya | Tidak | nonaktifkan, jangan hapus |
| `failed_attempts` | Number | Ya | Tidak | CHECK 0–5 |
| `locked_until` | Datetime | Tidak | Tidak | terisi saat akun terkunci |
| `last_login_at` | Datetime | Tidak | Tidak | diperbarui saat login sukses |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.2 Entitas: `otp_reset`
Kode OTP reset kata sandi (hash, berumur pendek). Dirujuk oleh: FSD-2.3.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `otp_id` | UUID | Ya | Ya | PRIMARY KEY |
| `user_id` | UUID | Ya | Tidak | `FK -> users(user_id) ON DELETE CASCADE` |
| `kode_hash` | Text | Ya | Tidak | hash OTP 6 digit |
| `expired_at` | Datetime | Ya | Tidak | `created_at + 10 menit` |
| `is_used` | Boolean | Ya | Tidak | sekali pakai |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.3 Entitas: `pasien`
Identitas pasien (satu profil per NIK). Dirujuk oleh: FSD-2.5, FSD-2.6, FSD-2.8, FSD-2.11.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `pasien_id` | UUID | Ya | Ya | PRIMARY KEY |
| `nik` | Text | Ya | Ya | UNIQUE, CHECK 16 digit numerik |
| `nama` | Text | Ya | Tidak | |
| `tgl_lahir` | Date | Tidak | Tidak | `CHECK <= hari ini` |
| `alamat` | Text | Tidak | Tidak | Default NULL |
| `no_telepon` | Text | Ya | Tidak | CHECK format `0xxx`/`+62xxx`, min 10 digit |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.4 Entitas: `sesi_praktik`
Sesi praktik per tanggal beserta kuota. Dirujuk oleh: FSD-2.5, FSD-2.6, FSD-2.7.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `sesi_id` | UUID | Ya | Ya | PRIMARY KEY |
| `tanggal` | Date | Ya | Tidak | |
| `jam_mulai` | Time | Ya | Tidak | |
| `jam_selesai` | Time | Ya | Tidak | `CHECK > jam_mulai` |
| `kuota_maks` | Number | Ya | Tidak | `CHECK > 0` |
| `durasi_per_pasien` | Number | Ya | Tidak | `CHECK > 0`, menit |
| `is_active` | Boolean | Ya | Tidak | Default 1 |

#### 5.1.5 Entitas: `layanan`
Daftar layanan praktik (kebidanan dan umum). Dirujuk oleh: FSD-2.4, FSD-2.5, FSD-2.6, FSD-2.9, FSD-2.15.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `layanan_id` | UUID | Ya | Ya | PRIMARY KEY |
| `nama` | Text | Ya | Ya | UNIQUE |
| `kategori` | Text | Ya | Tidak | `CHECK IN ('KEBIDANAN', 'UMUM')` |
| `deskripsi` | Text | Tidak | Tidak | Default NULL |
| `is_active` | Boolean | Ya | Tidak | Default 1 |

#### 5.1.6 Entitas: `reservasi`
Reservasi dan antrean kunjungan. Dirujuk oleh: FSD-2.5, FSD-2.6, FSD-2.7, FSD-2.9, FSD-2.16, FSD-2.18.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `reservasi_id` | UUID | Ya | Ya | PRIMARY KEY |
| `pasien_id` | UUID | Ya | Tidak | `FK -> pasien(pasien_id)` |
| `sesi_id` | UUID | Ya | Tidak | `FK -> sesi_praktik(sesi_id)` |
| `layanan_id` | UUID | Ya | Tidak | `FK -> layanan(layanan_id)` |
| `nomor_antrean` | Number | Ya | Tidak | `CHECK > 0` |
| `estimasi_jam` | Time | Ya | Tidak | dihitung sistem |
| `status` | Text | Ya | Tidak | `CHECK IN ('MENUNGGU','DIPANGGIL','SELESAI','DIBATALKAN')` |
| `metode_daftar` | Text | Ya | Tidak | `CHECK IN ('ONLINE', 'MANUAL_ADMIN')` |
| `dibuat_oleh` | UUID | Tidak | Tidak | `FK -> users(user_id)` |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.7 Entitas: `kunjungan`
Entri rekam medis per kunjungan (append-only). Dirujuk oleh: FSD-2.8, FSD-2.9, FSD-2.11, FSD-2.12, FSD-2.16.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `kunjungan_id` | UUID | Ya | Ya | PRIMARY KEY |
| `pasien_id` | UUID | Ya | Tidak | `FK -> pasien(pasien_id)` |
| `reservasi_id` | UUID | Tidak | Tidak | `FK -> reservasi(reservasi_id)` |
| `bidan_id` | UUID | Ya | Tidak | `FK -> users(user_id)` |
| `layanan_id` | UUID | Ya | Tidak | `FK -> layanan(layanan_id)` |
| `tanggal_kunjungan` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |
| `keluhan` | Text | Ya | Tidak | |
| `pemeriksaan_fisik` | Text | Tidak | Tidak | Default NULL |
| `diagnosis` | Text | Ya | Tidak | tidak dapat diubah Admin |
| `tindakan` | Text | Tidak | Tidak | Default NULL |
| `catatan_bebas` | Text | Tidak | Tidak | Default NULL |
| `koreksi_dari_id` | UUID | Tidak | Tidak | `FK -> kunjungan(kunjungan_id)` |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.8 Entitas: `resep_item`
Obat/produk pada resep suatu kunjungan. Dirujuk oleh: FSD-2.9, FSD-2.10.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `resep_id` | UUID | Ya | Ya | PRIMARY KEY |
| `kunjungan_id` | UUID | Ya | Tidak | `FK -> kunjungan(kunjungan_id)` |
| `item_id` | UUID | Ya | Tidak | `FK -> item_inventaris(item_id)` |
| `jumlah` | Number | Ya | Tidak | `CHECK > 0` |
| `aturan_pakai` | Text | Tidak | Tidak | Default NULL |

#### 5.1.9 Entitas: `alergi_kondisi`
Alergi obat, kehamilan risiko tinggi, dan penyakit bawaan (sumber red-flag). Dirujuk oleh: FSD-2.8, FSD-2.9, FSD-2.10, FSD-2.11.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `alergi_id` | UUID | Ya | Ya | PRIMARY KEY |
| `pasien_id` | UUID | Ya | Tidak | `FK -> pasien(pasien_id)` |
| `kategori` | Text | Ya | Tidak | `CHECK IN ('ALERGI_OBAT', 'KEHAMILAN_RISTI', 'PENYAKIT_BAWAAN')` |
| `nama` | Text | Ya | Tidak | |
| `item_id` | UUID | Tidak | Tidak | `FK -> item_inventaris(item_id)` |
| `keterangan` | Text | Tidak | Tidak | Default NULL |
| `is_active` | Boolean | Ya | Tidak | tidak pernah dihapus (DR-004) |
| `dicatat_oleh` | UUID | Ya | Tidak | `FK -> users(user_id)` |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.10 Entitas: `item_inventaris`
Master obat dan produk kesehatan beserta stok. Dirujuk oleh: FSD-2.9, FSD-2.10, FSD-2.14, FSD-2.15, FSD-2.18.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `item_id` | UUID | Ya | Ya | PRIMARY KEY |
| `nama` | Text | Ya | Tidak | |
| `kategori` | Text | Ya | Tidak | `CHECK IN ('OBAT', 'PRODUK_KESEHATAN')` |
| `satuan` | Text | Ya | Tidak | |
| `stok` | Number | Ya | Tidak | `CHECK >= 0` |
| `stok_minimum` | Number | Ya | Tidak | `CHECK >= 0` |
| `tgl_kedaluwarsa` | Date | Tidak | Tidak | Default NULL |
| `is_active` | Boolean | Ya | Tidak | Default 1 |

#### 5.1.11 Entitas: `riwayat_stok`
Riwayat restock dan pemakaian stok. Dirujuk oleh: FSD-2.9, FSD-2.14.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `riwayat_id` | UUID | Ya | Ya | PRIMARY KEY |
| `item_id` | UUID | Ya | Tidak | `FK -> item_inventaris(item_id)` |
| `jenis` | Text | Ya | Tidak | `CHECK IN ('RESTOCK', 'PAKAI', 'KOREKSI')` |
| `jumlah` | Number | Ya | Tidak | `CHECK > 0` |
| `harga_beli` | Number | Tidak | Tidak | `CHECK >= 0` |
| `kunjungan_id` | UUID | Tidak | Tidak | `FK -> kunjungan(kunjungan_id)` |
| `user_id` | UUID | Ya | Tidak | `FK -> users(user_id)` |
| `tanggal` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.12 Entitas: `riwayat_harga`
Harga jual obat/produk/layanan beserta masa berlaku (log perubahan harga). Dirujuk oleh: FSD-2.9, FSD-2.15, FSD-2.16.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `harga_id` | UUID | Ya | Ya | PRIMARY KEY |
| `ref_tipe` | Text | Ya | Tidak | `CHECK IN ('ITEM', 'LAYANAN')` |
| `item_id` | UUID | Tidak | Tidak | `FK -> item_inventaris(item_id)` |
| `layanan_id` | UUID | Tidak | Tidak | `FK -> layanan(layanan_id)` |
| `harga` | Number | Ya | Tidak | `CHECK > 0` |
| `berlaku_dari` | Date | Ya | Tidak | |
| `berlaku_sampai` | Date | Tidak | Tidak | NULL = masih berlaku |
| `alasan` | Text | Ya | Tidak | |
| `diubah_oleh` | UUID | Ya | Tidak | `FK -> users(user_id)` |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.13 Entitas: `tagihan`
Tagihan per kunjungan. Dirujuk oleh: FSD-2.9, FSD-2.12, FSD-2.13.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `tagihan_id` | UUID | Ya | Ya | PRIMARY KEY |
| `kunjungan_id` | UUID | Ya | Tidak | `FK -> kunjungan(kunjungan_id)` |
| `total_tagihan` | Number | Ya | Tidak | `CHECK >= 0` |
| `total_dibayar` | Number | Ya | Tidak | `CHECK >= 0` |
| `status` | Text | Ya | Tidak | `CHECK IN ('BELUM_LUNAS', 'LUNAS')` |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.14 Entitas: `tagihan_rincian`
Rincian jasa dan obat/produk pada tagihan (snapshot harga). Dirujuk oleh: FSD-2.9, FSD-2.12, FSD-2.16.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `rincian_id` | UUID | Ya | Ya | PRIMARY KEY |
| `tagihan_id` | UUID | Ya | Tidak | `FK -> tagihan(tagihan_id) ON DELETE CASCADE` |
| `item_id` | UUID | Tidak | Tidak | `FK -> item_inventaris(item_id)` |
| `layanan_id` | UUID | Tidak | Tidak | `FK -> layanan(layanan_id)` |
| `qty` | Number | Ya | Tidak | `CHECK > 0` |
| `harga_satuan` | Number | Ya | Tidak | snapshot harga berlaku |
| `subtotal` | Number | Ya | Tidak | computed column |

#### 5.1.15 Entitas: `pembayaran`
Transaksi pembayaran (penuh/sebagian). Dirujuk oleh: FSD-2.12, FSD-2.13, FSD-2.16.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `pembayaran_id` | UUID | Ya | Ya | PRIMARY KEY |
| `tagihan_id` | UUID | Ya | Tidak | `FK -> tagihan(tagihan_id)` |
| `jumlah` | Number | Ya | Tidak | `CHECK > 0` |
| `jalur` | Text | Ya | Tidak | `CHECK IN ('MANDIRI', 'BPJS', 'ASURANSI')` |
| `waktu_bayar` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |
| `dicatat_oleh` | UUID | Ya | Tidak | `FK -> users(user_id)` |

#### 5.1.16 Entitas: `konten_publik`
Konten halaman publik (profil, layanan, kontak, galeri, testimoni). Dirujuk oleh: FSD-2.4, FSD-2.17.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `konten_id` | UUID | Ya | Ya | PRIMARY KEY |
| `tipe` | Text | Ya | Tidak | `CHECK IN ('PROFIL', 'LAYANAN', 'KONTAK', 'GALERI', 'TESTIMONI')` |
| `judul` | Text | Ya | Tidak | |
| `isi` | Text | Tidak | Tidak | Default NULL |
| `media_url` | Text | Tidak | Tidak | Default NULL |
| `urutan` | Number | Ya | Tidak | Default 0 |
| `is_published` | Boolean | Ya | Tidak | soft delete = 0 |
| `updated_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.17 Entitas: `log_notifikasi`
Log pengiriman notifikasi dan pengingat. Dirujuk oleh: FSD-2.3, FSD-2.5, FSD-2.7, FSD-2.18.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `notif_id` | UUID | Ya | Ya | PRIMARY KEY |
| `jenis` | Text | Ya | Tidak | `CHECK IN ('KONFIRMASI', 'PENGINGAT_H1','PERUBAHAN', 'INVENTARIS', 'OTP')` |
| `reservasi_id` | UUID | Tidak | Tidak | `FK -> reservasi(reservasi_id)` |
| `tujuan` | Text | Ya | Tidak | nomor telepon |
| `pesan` | Text | Ya | Tidak | |
| `status` | Text | Ya | Tidak | `CHECK IN ('ANTRE', 'TERKIRIM','GAGAL')` |
| `retry_count` | Number | Ya | Tidak | CHECK 0–3 |
| `waktu_kirim` | Datetime | Tidak | Tidak | Default NULL |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

#### 5.1.18 Entitas: `audit_logs`
Jejak audit akses dan perubahan data (append-only). Dirujuk oleh: FSD-2.1, FSD-2.2, FSD-2.3, FSD-2.5, FSD-2.6, FSD-2.7, FSD-2.8, FSD-2.9, FSD-2.10, FSD-2.11, FSD-2.12, FSD-2.14, FSD-2.15, FSD-2.16, FSD-2.17, FSD-2.18, FSD-2.19.

| Atribut | Tipe Data (logis) | Wajib | Unik | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `log_id` | Number | Ya | Ya | PRIMARY KEY (urutan kronologis) |
| `user_id` | UUID | Tidak | Tidak | `FK -> users(user_id) ON DELETE SET NULL` |
| `user_ref` | Text | Tidak | Tidak | snapshot username saat aksi |
| `aksi` | Text | Ya | Tidak | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `VIEW_RME`, `INSERT`, `UPDATE`, `DELETE`, `DATA_EXPORTED`, ... |
| `entitas` | Text | Tidak | Tidak | nama tabel terdampak |
| `entitas_id` | Text | Tidak | Tidak | PK baris terdampak |
| `nilai_lama` | Text | Tidak | Tidak | JSON, `CHECK ISJSON` |
| `nilai_baru` | Text | Tidak | Tidak | JSON, `CHECK ISJSON` |
| `ip_address` | Text | Tidak | Tidak | IPv4/IPv6 |
| `created_at` | Datetime | Ya | Tidak | Default `SYSDATETIME()` |

---

### 5.2 CRUD Matrix (Tabel terhadap Fungsi)

| Tabel | Fungsi yang Merujuk (FSD) & Operasi CRUD |
| :--- | :--- |
| `users` | 2.1 (R,U), 2.3 (R,U), 2.18 (R) |
| `otp_reset` | 2.3 (C,R,U) |
| `pasien` | 2.5 (C,R), 2.6 (C,R), 2.8 (R), 2.11 (R) |
| `sesi_praktik` | 2.5 (R), 2.6 (R), 2.7 (C,R,U) |
| `layanan` | 2.4 (R), 2.5 (R), 2.6 (R), 2.9 (R), 2.15 (R), 2.16 (R), 2.18 (R) |
| `reservasi` | 2.5 (C,R), 2.6 (C), 2.7 (R,U), 2.9 (U) |
| `kunjungan` | 2.8 (R), 2.9 (C,R), 2.11 (R), 2.12 (R), 2.16 (R) |
| `resep_item` | 2.9 (C), 2.10 (R) |
| `alergi_kondisi` | 2.8 (R), 2.9 (R), 2.10 (C,R,U), 2.11 (R) |
| `item_inventaris` | 2.9 (R,U), 2.10 (R), 2.14 (C,R,U), 2.15 (R), 2.18 (R) |
| `riwayat_stok` | 2.9 (C), 2.14 (C,R) |
| `riwayat_harga` | 2.9 (R), 2.15 (C,R,U), 2.16 (R) |
| `tagihan` | 2.9 (C), 2.12 (R,U), 2.13 (R) |
| `tagihan_rincian` | 2.9 (C), 2.12 (R), 2.16 (R) |
| `pembayaran` | 2.12 (C,R), 2.13 (R), 2.16 (R) |
| `konten_publik` | 2.4 (R), 2.17 (C,R,U) |
| `log_notifikasi` | 2.3 (C), 2.5 (C), 2.7 (C), 2.18 (C,R,U) |
| `audit_logs` | 2.1 (C), 2.2 (C), 2.3 (C), 2.5 (C), 2.6 (C), 2.7 (C), 2.8 (C), 2.9 (C), 2.10 (C), 2.11 (C), 2.12 (C), 2.14 (C), 2.15 (C), 2.16 (C), 2.17 (C), 2.18 (C), 2.19 (R) |

> **Catatan:** Semua operasi C/U/D pada tabel bisnis otomatis menghasilkan baris `audit_logs` melalui trigger database (TSD Bagian 5.4).

---

## FSD Bagian 6: Error Handling & Exception Flow

| Error ID | Dipakai oleh (FSD) | Kategori | Kondisi Pemicu | Pesan kepada User | HTTP | Aksi Sistem |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ERR-VAL-01` | FSD-2.1, FSD-2.3, FSD-2.5, FSD-2.6, FSD-2.8, FSD-2.9, FSD-2.10, FSD-2.12, FSD-2.13, FSD-2.14, FSD-2.15, FSD-2.16, FSD-2.17, FSD-2.19 | Input | Field wajib kosong atau format salah | Periksa kembali isian yang ditandai | 422 | Sorot field, formulir tidak dikirim, isian dipertahankan |
| `ERR-VAL-02` | FSD-2.5, FSD-2.6 | Input | Format nomor telepon tidak valid | Nomor telepon harus diawali 0 atau +62 dan minimal 10 digit | 422 | Sorot field telepon |
| `ERR-VAL-03` | FSD-2.5, FSD-2.6 | Input | NIK bukan 16 digit numerik | NIK harus 16 digit angka | 422 | Sorot field NIK |
| `ERR-VAL-04` | FSD-2.17 | Input | Berkas bukan jpg/png/webp atau melebihi 2 MB | Gunakan gambar jpg/png/webp maksimal 2 MB | 422 | Tolak unggahan |
| `ERR-AUTH-01` | FSD-2.2 | Auth | Pengguna belum login atau token tidak valid | Anda harus login untuk mengakses halaman ini | 401 | Redirect ke login, simpan return URL |
| `ERR-AUTH-02` | FSD-2.1 | Auth | Username/kata sandi salah (percobaan 1–4) | Username atau kata sandi tidak valid | 401 | Tambah `failed_attempts`, catat `LOGIN_FAILED` |
| `ERR-AUTH-03` | FSD-2.7, FSD-2.8, FSD-2.10, FSD-2.11, FSD-2.13, FSD-2.16, FSD-2.18, FSD-2.19 | Authorization | Peran tidak memiliki akses | Anda tidak memiliki izin untuk mengakses ini | 403 | Catat `ACCESS_DENIED` di `audit_logs` |
| `ERR-AUTH-04` | FSD-2.2 | Auth | Sesi kedaluwarsa (30 menit tanpa aktivitas) | Sesi Anda telah berakhir, silakan login kembali | 401 | Redirect ke login, catat `SESSION_TIMEOUT` |
| `ERR-AUTH-05` | FSD-2.3 | Auth | OTP salah/kedaluwarsa atau batas permintaan terlampaui | Kode tidak valid atau sudah kedaluwarsa | 422 | Tolak reset, hitung percobaan |
| `ERR-LOCK-01` | FSD-2.1 | Auth | Gagal login ke-5 berturut-turut atau akun masih terkunci | Akun dikunci. Coba lagi dalam 15 menit | 403 | Set `locked_until = sekarang + 15 menit` |
| `ERR-RSV-01` | FSD-2.5, FSD-2.7 | Reservasi | Kuota sesi penuh | Kuota sesi penuh. Silakan pilih sesi berikutnya | 409 | Tampilkan sesi alternatif, batalkan transaksi |
| `ERR-RSV-02` | FSD-2.6 | Reservasi | NIK sudah terdaftar | NIK sudah terdaftar. Periksa data pasien berikut | 409 | Tampilkan data pasien lama sebagai konfirmasi |
| `ERR-RSV-03` | FSD-2.7 | Reservasi | Reservasi sudah dipanggil/selesai/tidak ditemukan | Reservasi tidak dapat diubah | 409 | Tolak perubahan |
| `ERR-RSV-04` | FSD-2.5 | Reservasi | Pasien sudah punya reservasi aktif pada sesi yang sama | Anda sudah memiliki reservasi pada sesi ini | 409 | Tampilkan reservasi yang ada |
| `ERR-RSV-05` | FSD-2.7 | Reservasi | Kuota baru lebih kecil dari reservasi aktif | Kuota tidak boleh kurang dari jumlah reservasi aktif | 422 | Tolak perubahan kuota |
| `ERR-RME-01` | FSD-2.9, FSD-2.10 | Rekam Medis | Resep memuat obat yang tercatat alergi pasien | Peringatan: obat pada resep tercatat sebagai alergi pasien | 409 | Cegah simpan hingga override/ubah resep |
| `ERR-RME-02` | FSD-2.9, FSD-2.10 | Rekam Medis | Red-flag belum dikonfirmasi | Centang "sudah membaca peringatan" terlebih dahulu | 409 | Kunci formulir pemeriksaan |
| `ERR-RME-03` | FSD-2.9 | Rekam Medis | Admin mencoba mengubah diagnosis/resep | Anda tidak berwenang mengubah rekam medis | 403 | Tolak, catat `ACCESS_DENIED` |
| `ERR-RME-04` | FSD-2.8, FSD-2.11 | Rekam Medis | Data pasien tidak ditemukan | Data pasien tidak ditemukan | 404 | Kembali ke pencarian |
| `ERR-INV-01` | FSD-2.9, FSD-2.14 | Inventaris | Pemakaian melebihi stok tersedia | Stok tidak mencukupi untuk item yang dipilih | 422 | Rollback transaksi, stok tidak berubah |
| `ERR-INV-02` | FSD-2.14, FSD-2.15 | Inventaris | Item/layanan tidak ditemukan | Item tidak ditemukan | 404 | Muat ulang daftar |
| `ERR-INV-03` | FSD-2.14 | Inventaris | Nama dan kategori item sudah ada | Item dengan nama dan kategori tersebut sudah ada | 409 | Tolak penyimpanan |
| `ERR-FIN-01` | FSD-2.12 | Keuangan | Pembayaran melebihi sisa tagihan | Jumlah pembayaran melebihi sisa tagihan | 422 | Tolak pembayaran |
| `ERR-FIN-02` | FSD-2.12 | Keuangan | Tagihan tidak ditemukan | Tagihan tidak ditemukan | 404 | Kembali ke daftar |
| `ERR-PRC-01` | FSD-2.15 | Harga | Harga $\le$ 0 atau tanggal berlaku tidak valid | Harga harus lebih dari 0 dan tanggal berlaku tidak boleh mundur | 422 | Tolak perubahan harga |
| `ERR-CNT-01` | FSD-2.17 | Konten | Konten publik tidak ditemukan | Konten tidak ditemukan | 404 | Muat ulang daftar |
| `ERR-RPT-01` | FSD-2.16 | Laporan | Tidak ada data pada periode | Data belum tersedia untuk periode ini | 404 | Tampilkan keadaan kosong |
| `ERR-NTF-01` | FSD-2.3, FSD-2.18 | Notifikasi | Layanan pesan tidak dapat dihubungi | Pesan belum terkirim, sistem akan mencoba kembali | 502 | Status `GAGAL`, retry 3x jeda 5 menit, proses utama lanjut |
| `ERR-SYS-01` | FSD-2.1, FSD-2.4, FSD-2.5, FSD-2.6, FSD-2.7, FSD-2.8, FSD-2.9, FSD-2.10, FSD-2.11, FSD-2.12, FSD-2.13, FSD-2.14, FSD-2.15, FSD-2.16, FSD-2.17, FSD-2.19 | Sistem | Koneksi database gagal | Layanan tidak tersedia. Silakan coba lagi | 503 | Rollback transaksi, log error lengkap di server |
| `ERR-SYS-02` | FSD-2.11, FSD-2.16 | Sistem | Gagal membuat berkas PDF/Excel | Berkas gagal dibuat. Silakan coba lagi | 500 | Log error di server |
| `ERR-SYS-03` | FSD-2.4 | Sistem | Terlalu banyak request (rate limit) | Terlalu banyak permintaan. Coba lagi beberapa saat | 429 | Tolak request sementara |

---

## Traceability Matrix

| FSD | Nama Fungsi | Referensi SRS | Use Case | Test Case (jumlah) |
| :--- | :--- | :--- | :--- | :--- |
| FSD-2.1 | Login & Verifikasi Kredensial | FR-045, FR-046, FR-048 | | TC-2.1-01 s.d. TC-2.1-09 (9) |
| FSD-2.2 | Logout & Auto-Logout Sesi | FR-047 | | TC-2.2-01 s.d. TC-2.2-07 (7) |
| FSD-2.3 | Reset Kata Sandi via Nomor Telepon | FR-049 | | TC-2.3-01 s.d. TC-2.3-08 (8) |
| FSD-2.4 | Lihat Halaman Publik (Profil & Branding) | FR-042, FR-043, BR-007 | | TC-2.4-01 s.d. TC-2.4-07 (7) |
| FSD-2.5 | Reservasi Kunjungan Online | FR-004, FR-005, FR-006, FR-008, FR-009, FR-010, FR-050 | UC-01 | TC-2.5-01 s.d. TC-2.5-09 (9) |
| FSD-2.6 | Pendaftaran Pasien Walk-in oleh Admin | FR-001, FR-002, FR-003, FR-005, FR-008, FR-010 | UC-02 | TC-2.6-01 s.d. TC-2.6-09 (9) |
| FSD-2.7 | Kelola Reservasi, Antrean & Kuota Sesi | FR-007, FR-009 | | TC-2.7-01 s.d. TC-2.7-09 (9) |
| FSD-2.8 | Cari Riwayat & Buka Profil Pasien | FR-015, FR-016, BR-001 | | TC-2.8-01 s.d. TC-2.8-09 (9) |
| FSD-2.9 | Pemeriksaan & Pencatatan Rekam Medis | FR-011, FR-012, FR-013, FR-014, FR-017, FR-018, FR-032 | UC-03 | TC-2.9-01 s.d. TC-2.9-11 (11) |
| FSD-2.10 | Penanganan Peringatan Keselamatan Pasien (Red-Flag) | FR-020, FR-021, FR-022, FR-023, FR-024 | UC-04 | TC-2.10-01 s.d. TC-2.10-10 (10) |
| FSD-2.11 | Cetak / Unduh Ringkasan Rekam Medis (PDF) | FR-019 | | TC-2.11-01 s.d. TC-2.11-07 (7) |
| FSD-2.12 | Catat Pembayaran Kunjungan & Tagihan | FR-025, FR-026, FR-029, FR-030 | UC-05 | TC-2.12-01 s.d. TC-2.12-09 (9) |
| FSD-2.13 | Rekap Pendapatan Harian & Bulanan | FR-027, FR-028, BR-008 | | TC-2.13-01 s.d. TC-2.13-08 (8) |
| FSD-2.14 | Kelola Stok Obat & Produk Kesehatan | FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037 | UC-06 | TC-2.14-01 s.d. TC-2.14-11 (11) |
| FSD-2.15 | Kelola Harga & Riwayat Harga Obat, Produk, Layanan | FR-054, FR-055, FR-056 (turunan UC-08, BR-004, BR-005) | UC-08 | TC-2.15-01 s.d. TC-2.15-09 (9) |
| FSD-2.16 | Tinjau Laporan Operasional & Analisis Efek Harga | FR-038, FR-039, FR-040, FR-041, FR-056 | UC-07 | TC-2.16-01 s.d. TC-2.16-09 (9) |
| FSD-2.17 | Kelola Galeri & Testimoni Halaman Publik | FR-044 | | TC-2.17-01 s.d. TC-2.17-08 (8) |
| FSD-2.18 | Notifikasi & Pengingat Otomatis | FR-050, FR-051, FR-052, FR-053, BR-006 | | TC-2.18-01 s.d. TC-2.18-09 (9) |
| FSD-2.19 | Lihat Audit Log Perubahan & Akses Data | DR-008, NFR-007, SRS 3.6.3 | | TC-2.19-01 s.d. TC-2.19-08 (8) |

---

## Glossary

| Istilah | Definisi |
| :--- | :--- |
| **FSD** | Functional Specification Document — bagaimana setiap fungsi bekerja |
| **TSD** | Technical Specification Document — bagaimana sistem dibangun |
| **RME** | Rekam Medis Elektronik |
| **Red-Flag** | Penanda otomatis alergi obat / kondisi khusus (termasuk kehamilan risiko tinggi) pada profil pasien |
| **Walk-in** | Pasien yang datang langsung tanpa reservasi |
| **Sesi praktik** | Rentang waktu praktik pada satu tanggal dengan kuota maksimum pasien |
| **Efek volume / efek harga** | Penguraian selisih pendapatan menjadi bagian akibat perubahan jumlah layanan dan bagian akibat perubahan harga |
| **Audit log** | Jejak append-only yang mencatat akses dan perubahan data (nilai lama dan baru) |
| **RBAC** | Role-Based Access Control |
| **OTP** | One-Time Password, kode sekali pakai |
| **AF/EF** | Alternative Flow / Exception Flow |
| **CR** | Change Request — perubahan formal setelah sign-off |