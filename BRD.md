# BUSINESS REQUIREMENTS DOCUMENT (BRD)

**Dokumen Kebutuhan Bisnis**  
**Sistem Digitalisasi Praktik Mandiri Bidan & Dokter Umum**  
**Versi 1.0**

* **Disusun oleh:** Tanpa Ampun - Kelompok 01
* **Daftar anggota:**
  1. Muhammad Dzikri Reyfandy
  2. Muhamamd Ghazy Hikmatiar
  3. Muhammad Naufal Hafizh Fauzia Putra
  4. Rasya Pradipta Efendi
* **Tanggal:** 11 September 2026

---

## Riwayat Revisi Dokumen

| Versi | Tanggal | Disusun Oleh | Deskripsi Perubahan |
| :--- | :--- | :--- | :--- |
| 1.0 | 11/9/2026 | Tanpa Ampun - Kelompok 01 | Draf awal dokumen |

---

## Lembar Persetujuan

| Peran | Nama | Tanda Tangan | Tanggal |
| :--- | :--- | :--- | :--- |
| Project Leader & UI/UX | Muhammad Dzikri Reyfandy | | 11/9/2026 |
| Frontend Developer | Muhamamd Ghazy Hikmatiar | | 11/9/2026 |
| Frontend Developer | Muhammad Naufal Hafizh Fauzia Putra | | 11/9/2026 |
| Backend Developer | Rasya Pradipta Effendi | | 11/9/2026 |
| Pemilik Klinik | Yurlina AM., KEB. | | 11/9/2026 |
| Dosen | Bambang Widoyono S.T., M.I.T. | | 11/9/2026 |

---

## Daftar Isi

* Riwayat Revisi Dokumen — 2
* Lembar Persetujuan — 2
* Daftar Isi — 3
* 1. Ringkasan Eksekutif (Executive Summary) — 4
* 2. Latar Belakang dan Tujuan Bisnis — 4
  * 2.1 Latar Belakang Masalah — 4
  * 2.2 Tujuan Bisnis (Business Objectives) — 5
  * 2.3 Manfaat yang Diharapkan (Business Benefits) — 5
* 3. Ruang Lingkup Proyek (Project Scope) — 6
  * 3.1 Dalam Lingkup (In Scope) — 6
  * 3.2 Luar Lingkup (Out of Scope) — 7
* 4. Identifikasi Pemangku Kepentingan (Stakeholders) — 7
* 5. Kebutuhan Bisnis (Business Requirements) — 8
  * 5.1 Kebutuhan Proses Bisnis Saat Ini (As-Is) yang ingin dilakukan perbaikan — 9
  * 5.2 Kebutuhan Proses Bisnis yang Diusulkan (To-Be) — 9
* 6. Asumsi (Assumptions) — 9
* 7. Batasan (Constraints) — 9
* 8. Risiko (Risks) — 9
* 9. Glosarium — 10
* 10. Lampiran — 11

---

## 1. Ringkasan Eksekutif (Executive Summary)

Proyek ini bertujuan untuk membangun sistem digital terpadu bagi Praktik Mandiri Bidan Yurlina, AM, KEB dan dr. Maizola Putri, yang menggabungkan layanan kebidanan dan layanan dokter umum ke dalam satu pintu pendaftaran dan satu sistem pengelolaan data. Proyek ini mengatasi permasalahan bisnis berupa rekam medis yang masih manual, pendaftaran pasien yang belum terpusat untuk dua jenis layanan, risiko keselamatan pasien akibat riwayat medis yang berpotensi terlewat, pencatatan keuangan manual, serta belum adanya sistem inventaris obat-obatan dan produk kesehatan yang tercatat rapi. Sistem yang diusulkan mencakup lima kemampuan utama, yakni:

a. pendaftaran satu pintu untuk layanan kebidanan maupun umum,  
b. rekam medis elektronik (EMR) terpadu  
c. reservasi dan antrean dengan estimasi jam kedatangan  
d. penanda otomatis ($red-flag$) untuk keselamatan pasien  
e. manajemen inventaris obat-obatan serta produk kesehatan (stok, tanggal kadaluarsa, dan peringatan stok menipis).

Indikator keberhasilan utama meliputi pasien dapat mendaftar ke layanan manapun dari satu titik pendaftaran, riwayat pasien dapat dicari dalam hitungan detik, serta stok obat dan produk dapat dipantau secara real-time.

---

## 2. Latar Belakang dan Tujuan Bisnis

### 2.1 Latar Belakang Masalah

Bidan Yurlina telah lama dikenal warga sekitar sebagai tempat rujukan layanan kebidanan sehari-hari, mulai dari pemeriksaan kehamilan, konsultasi keluarga berencana, imunisasi, hingga berbagai layanan kesehatan ibu dan anak lainnya. Di sisi lain, dr. Maizola Putri menjalankan praktik pemeriksaan dokter umum yang melayani keluhan kesehatan harian masyarakat. Selama ini kedua layanan berjalan sendiri-sendiri dalam satu tempat praktik yang sama, masing-masing dengan alur pendaftaran dan pencatatan yang terpisah.

Untuk memberikan pengalaman yang lebih mudah bagi pasien sekaligus menyederhanakan pengelolaan operasional, kedua layanan ini akan digabungkan menjadi satu praktik mandiri dengan satu pintu pendaftaran. Dengan penggabungan ini, pasien tidak lagi perlu bingung menentukan proses pendaftaran mana yang harus dituju, cukup mengakses sistem informasi yang dibuat dan diarahkan ke layanan yang sesuai, baik kebidanan maupun pemeriksaan umum.

Namun, penggabungan dua layanan ini turut memunculkan tantangan tersendiri. Rekam medis, pendaftaran pasien, dan pencatatan stok obat maupun produk kesehatan pada kedua layanan selama ini masih dikelola secara manual dan terpisah. Jika dibiarkan, kondisi ini berisiko menimbulkan duplikasi data pasien serta menyulitkan penelusuran riwayat medis antar layanan, misalnya ketika pasien yang sebelumnya diperiksa dr. Maizola ternyata juga memerlukan layanan kebidanan, atau sebaliknya. Stok obat dan produk kesehatan pun rawan habis atau kedaluwarsa tanpa disadari karena belum ada sistem pemantauan yang memadai.

Permasalahan umum yang lazim ditemukan pada praktik mandiri turut menambah kompleksitas, yakni pendaftaran yang belum terjadwal dengan baik menyebabkan pasien menumpuk pada jam-jam tertentu, riwayat alergi obat atau kondisi khusus pasien, termasuk riwayat kehamilan berisiko berpotensi tidak terbaca oleh tenaga medis yang bertugas, dan pencatatan keuangan maupun pelaporan praktik masih bergantung pada proses manual yang memakan waktu.

### 2.2 Tujuan Bisnis (Business Objectives)

| ID | Tujuan Bisnis | Indikator Keberhasilan (KPI) |
| :--- | :--- | :--- |
| BO-001 | Mendigitalkan pencatatan rekam medis pasien agar tersimpan rapi, aman, dan mudah dicari | Waktu pencarian riwayat pasien berkurang signifikan dibandingkan pencatatan manual |
| BO-002 | Mengurangi penumpukan antrean pasien melalui reservasi online dan estimasi jam kedatangan | Waktu tunggu rata-rata pasien di ruang tunggu berkurang, keluhan antrean menurun |
| BO-003 | Menurunkan risiko keselamatan pasien akibat riwayat medis (alergi/penyakit bawaan) yang terlewat | Seluruh riwayat alergi dan penyakit bawaan pasien tercatatan dan tampil otomatis saat pemeriksaan |
| BO-004 | Mempercepat dan mengotomatisasi rekapitulasi keuangan dan laporan kunjungan bulanan | Waktu penyusunan laporan bulanan berkurang dari hitungan hari menjadi hitungan menit |
| BO-005 | Membuat branding | Membuat identitas praktik mandiri |
| BO-006 | Mengelola inventaris obat-obatan dan produk kesehatan | Stok obat dan produk dapat dipantau secara real time, lengkap dengan peringatan stok menipis dan mendekati tanggal kadaluarsa |

### 2.3 Manfaat yang Diharapkan (Business Benefits)

| Manfaat | Kualitatif | Kuantitatif |
| :--- | :---: | :---: |
| Efisiensi operasional harian praktik melalui satu sistem terpadu untuk rekam medis, reservasi, keuangan, dan laporan. | ☐ | ☑ |
| Peningkatan keselamatan pasien melalui akses cepat ke riwayat alergi, diagnosis, dan resep sebelumnya | ☐ | |
| Pengalaman pasien yang lebih baik melalui pendaftaran online, estimasi jam kedatangan, dan pengingat otomatis | ☑ | ☐ |
| Visibilitas kinerja praktik yang lebih baik melalui dashboard tren diagnosis, jam tersibuk, dan performa keuangan | ☐ | ☑ |
| Nilai tambah non-finansial bagi pemilik berupa hasil kerja nyata dari kolaborasi akademik | ☑ | ☐ |
| Stok obat dan produk kesehatan tidak lagi kehabisan atau kedaluwarsa tanpa terpantau | ☐ | ☑ |

---

## 3. Ruang Lingkup Proyek (Project Scope)

### 3.1 Dalam Lingkup (In Scope)

a. Halaman publik berisi branding dan profil praktik.  
b. Pendaftaran pasien dan antrean  
   Proses ini mencakup pendaftaran pasien baru maupun lama, estimasi jam kedatangan, dan pengingat otomatis. Proses pendaftaran dimulai dari pengambilan nomor antrian otomatis, reservasi, dan penyimpanan data seperti NIK, alamat, nomor telepon, dan riwayat kunjungan sebelumnya.  
c. Rekam Medis Elektronik (RME)  
   Proses ini mencatat profil pasien, riwayat kunjungan, anamnesa, diagnosa, tindakan, riwayat penyakit dan alergi pasien. Akses pada data ini diatur berdasarkan peran stakeholder.  
d. Konsultasi Dokter atau Poli  
   Proses ini meliputi penjadwalan dokter per poli, input hasil pemeriksaan dan resep obat, serta rujukan internal antar poli.  
e. Modul keuangan dan penagihan  
   Perhitungan tagihan otomatis per kunjungan dan rekap pendapatan harian  
f. Dashboard dan Laporan Operasional  
   Proses ini meliputi laporan jumlah kunjungan harian atau bulanan, pendapatan sederhana, dan pemakaian obat.  
g. Formulir pemeriksaan digital yang terhubung langsung dengan rekam medis pasien  
h. Manajemen inventaris obat-obatan dan produk kesehatan, termasuk jumlah stok dan tanggal kedaluwarsa  
i. Notifikasi  
   Pengingat jadwal kontrol kenapa pasien dan dokter melalui email

### 3.2 Luar Lingkup (Out of Scope)

a. Integrasi dengan BPJS Kesehatan  
   Proses klaim dan verifikasi dengan BPJS memerlukan akses khusus sehingga tidak bisa integrasi penuh dengan BPJS.  
b. Manajemen rantai pasok ke distributor obat  
c. Integrasi perangkat medis  
   Beberapa alat medis seperti EKG lab otomatis yang terhubung dengan sistem memerlukan driver dan protokol komunikasi khusus di setiap alat.  
d. Manajemen aset non-medis  
   Aset-aset dalam klinik tidak masuk ke dalam sistem, karena tidak berkaitan langsung dengan pelayanan klinik.

---

## 4. Identifikasi Pemangku Kepentingan (Stakeholders)

| Nama/Peran | Jabatan/Unit | Kepentingan terhadap Proyek | Tingkat Pengaruh |
| :--- | :--- | :--- | :--- |
| Yurlina AM., KEB. | Pemilik Klinik | Pengambilan keputusan utama dan pengguna sistem rekam medis. | Tinggi |
| Yurlina AM., KEB. | Pemilik Klinik | Pengguna utama modul reservasi, antrean, dan penagihan sehari-hari. | Tinggi |
| Yurlina AM., KEB. & dr. Maizola Putri | Pemilik Klinik | Pengguna modul rekam medis untuk mendukung pemeriksaan | sedang |
| Pasien | Pengguna Layanan Klinik | Penerima manfaat dari reservasi online dan pelayanan | Sedang |
| Tim Penyusun | Pengembang | Menyusun requiretment, merancang dan membangun sistem | Tinggi |
| Dosen Pengampu | Persetujuan akademik | Menilai dan menyetujui kelayakan dokumen serta hasil proyek | Tinggi |

---

## 5. Kebutuhan Bisnis (Business Requirements)

| ID | Kategori | Deskripsi Kebutuhan | Prioritas | Sumber |
| :--- | :--- | :--- | :--- | :--- |
| BR-001 | Rekam medis | Bisnis membutuhkan kemampuan untuk mencatat dan menyimpan profil pasien, riwayat kunjungan, diagnosis, dan resep secara digital dan mudah dicari. | Tinggi | Yurlina AM., KEB. |
| BR-002 | Rekam medis | Bisnis membutuhkan kemampuan untuk menampilkan riwayat alergi obat dan penyakit bawaan pasien secara otomatis saat pemeriksaan berlangsung. | Tinggi | Yurlina AM., KEB. |
| BR-003 | Reservasi & Antrean | Bisnis membutuhkan kemampuan bagi pasien untuk melakukan pendaftaraan online dan melihat estimasi jam kedatangan. | Tinggi | Yurlina AM., KEB. |
| BR-004 | Keuangan & Penagihan | Bisnis membutuhkan kemampuan menghitung tagihan per kunjungan secara otomatis. | Tinggi | Yurlina AM., KEB. |
| BR-005 | Laporan & Analitik | Bisnis membutuhkan kemampuan menampilkan tren diagnosis, jam tersibuk, dan performa praktik dalam satu dashboard. | Sedang | Yurlina AM., KEB. |
| BR-006 | Reservasi & Antrean | Bisnis membutuhkan kemampuan mengirim pengingat jadwal kunjungan secara otomatis. | Sedang | Yurlina AM., KEB. |
| BR-007 | Profil & Branding | Bisnis membutuhkan halaman publik yang menampilkan profil dan branding praktik. | Sedang | Yurlina AM., KEB. |
| BR-008 | Keuangan & Penagihan | Bisnis membutuhkan kemampuan menampilkan rekap pendapatan. | Sedang | Yurlina AM., KEB. |

### 5.1 Kebutuhan Proses Bisnis Saat Ini (As-Is) yang ingin dilakukan perbaikan

Hasil wawancara mengonfirmasi bahwa pendaftaran dan rekam medis pada kedua layanan (kebidanan dan umum) masih dikelola secara manual dan terpisah, dan pencatatan stok obat serta produk kesehatan juga masih dilakukan seadanya tanpa sistem peringatan stok menipis atau kadaluwarsa. Laporan pendapatan disusun manual pada akhir periode.

### 5.2 Kebutuhan Proses Bisnis yang Diusulkan (To-Be)

a. Stakeholder membutuhkan kemampuan untuk mencatat dan menyimpan profil pasien, riwayat kunjungan, diagnosis, dan resep secara digital dan mudah dicari.  
b. Stakeholder membutuhkan kemampuan untuk menampilkan riwayat alergi obat dan penyakit bawaan pasien secara otomatis saat pemeriksaan berlangsung.  
c. Stakeholder membutuhkan kemampuan bagi pasien untuk melakukan pendaftaraan online dan melihat estimasi jam kedatangan.  
d. Stakeholder membutuhkan kemampuan menghitung tagihan per kunjungan secara otomatis.  
e. Stakeholder membutuhkan kemampuan menampilkan tren diagnosis, jam tersibuk, dan performa praktik dalam satu dashboard.  
f. Stakeholder membutuhkan kemampuan mengirim pengingat jadwal kunjungan secara otomatis.  
g. Stakeholder membutuhkan halaman publik yang menampilkan profil dan branding praktik.  
h. Stakeholder membutuhkan kemampuan menampilkan rekap pendapatan.

---

## 6. Asumsi (Assumptions)

a. Klinik memiliki perangkat komputer dan koneksi internet yang memadai untuk menjalankan sistem.  
b. Stakeholder memahami dan mampu beradaptasi dengan sistem informasi yang dibuat.

---

## 7. Batasan (Constraints)

a. Anggaran proyek sangat terbatas karena merupakan proyek akademik.  
b. Waktu pengembangan dibatasi oleh jadwal mata kuliah.

---

## 8. Risiko (Risks)

| Deskripsi Risiko | Dampak | Kemungkinan | Rencana Mitigasi |
| :--- | :--- | :--- | :--- |
| Staf praktik belum terbiasa mengoperasikan sistem digital | Tinggi | Tinggi | Memberikan pelatihan kepada stakeholder |
| Kebocoran atau penyalahgunaan data rekam medis pasien | Tinggi | Rendah | Menerapkan enkripsi data dan kontrol akses. |
| Pasien tidak menggunakan sistem informasi ini. | Tinggi | Tinggi | Staff diminta untuk mengarahkan pasien ke sistem informasi. |
| Kebutuhan tambahan atau detail teknis baru dapat muncul saat proses implementasi lebih lanjut | Sedang | Sedang | Melakukan validasi ulang requirement secara berkala bersama mitra selama proses pengembangan berlangsung |
| Penggabungan dua layanan berbeda (kebidanan dan umum) ke satu sistem dapat menimbulkan perbedaan kebutuhan teknis yang belum sepenuhnya terakomodasi | Sedang | Tinggi | Merancang struktur data yang cukup fleksibel untuk mengakomodasi perbedaan alur kerja masing-masing layanan |

---

## 9. Glosarium

| Istilah/Akronim | Definisi |
| :--- | :--- |
| BRD | Business Requirements Document |
| BPJS | Badan Penyelenggara Jaminan Sosial |
| EMR | Electronic Medical Record |
| EKG | Elektrokadiogram |
| Satu pintu | Sistem pendaftaran terpadu yang melayani lebih dari satu jenis layanan (kebidanan dan umum) dari satu titik pendaftaran yang sama |
| Inventaris | Catatan stok obat-obatan dan produk kesehatan, termasuk jumlah dan tanggal kedaluwarsa |

---

## 10. Lampiran

**Mockup:** Mockup Praktik Mandiri Bidan Yurlina

* **Gambar 10.1 Meeting Bersama Mitra.**  
  *(Dokumentasi rapat daring Google Meet pada pukul 6:31 PM bersama tim penyusun dan mitra dengan tampilan pratinjau antarmuka sistem)*
* **Gambar 10.2 Meeting Bersama Mitra.**  
  *(Dokumentasi presentasi daring Google Meet pada pukul 18.22 dengan materi slide "Tentang Proyek Ini" — Digitalisasi Bisnis & Kenapa Sektor Layanan Kesehatan?)*