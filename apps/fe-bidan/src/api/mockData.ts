import { LayananItem, SesiPraktikItem, AntreanItem } from './types';

export const KLINIK_INFO = {
  nama: 'Praktik Mandiri Bidan Ria Indrasti J. S.keb',
  bidan: 'Bdn. Ria Indrasti J., S.Keb',
  sipb: 'SIPB. 503/048/SIPB/DPMPTSP/2021',
  layanan_jam: 'Layanan 24 Jam (Siaga Persalinan & Gawat Darurat Kebidanan)',
  jadwal_sesi: 'Sesi Pagi (08:00 - 12:00 WIB) & Sesi Sore (16:00 - 20:00 WIB)',
  alamat: 'Perumahan bougenvile blok FG 12b. Simpang Rimbo Kota Jambi',
  telepon: '085377998889',
  whatsapp: '085377998889',
  email: 'info@bidanriaindrasti.id',
  kota: 'Kota Jambi',
  googleMapsUrl: 'https://maps.google.com/?q=Perumahan+bougenvile+blok+FG+12b+Simpang+Rimbo+Kota+Jambi',
};

export const DEMO_ACCOUNTS = [
  {
    roleKey: 'superadmin',
    roleName: 'Superadmin IT (Audit & Keamanan)',
    badge: 'Auditor & Tata Kelola',
    username: 'superadmin.ria',
    password: 'password123',
    peran: 'SUPERADMIN' as const,
    deskripsi: 'Akses jejak Audit_Log immutable lintas unit, override darurat, manajemen akun pengguna, dan monitoring keamanan sistem.'
  },
  {
    roleKey: 'bidan',
    roleName: 'Bidan Ria (Akses RME Medis)',
    badge: 'Tenaga Medis / DPJP',
    username: 'bidan.ria',
    password: 'password123',
    peran: 'DOKTER' as const,
    deskripsi: 'Akses penuh Rekam Medis Elektronik (RME), Pemeriksaan ANC, Partograf Persalinan, Asuhan BBL 0-6 Jam, dan CPPT.'
  },
  {
    roleKey: 'admin',
    roleName: 'Admin Klinik (Operasional & Antrean)',
    badge: 'Operasional & Loket',
    username: 'admin.ria',
    password: 'password123',
    peran: 'ADMIN_LOKAL' as const,
    deskripsi: 'Akses antrean sesi harian, pendaftaran pasien, pengelolaan kuota sesi, dan inventori obat/alkes esensial.'
  },
  {
    roleKey: 'pasien',
    roleName: 'Portal Pasien (Ibu Hamil)',
    badge: 'Ibu Pasien',
    username: 'pasien.ratna',
    password: 'password123',
    peran: 'PASIEN' as const,
    deskripsi: 'Akses Buku KIA Digital, riwayat pemeriksaan kehamilan, jadwal kontrol KB, dan tiket reservasi aktif.'
  }
];

export const MOCK_LAYANAN: LayananItem[] = [
  {
    layanan_id: 'LAY-01',
    nama: 'Pemeriksaan Kehamilan (ANC Terpadu)',
    kategori: 'ANC',
    deskripsi: 'Pemeriksaan komprehensif kesehatan ibu dan janin mencakup palpasi Leopold, detak jantung janin (DJJ), skrining tanda bahaya, serta pengukuran status gizi.',
    durasi_menit: 25,
    highlight: 'Pemantauan Kehamilan Holistik',
    icon: 'anc',
    cakupan: [
      'Pemeriksaan denyut jantung janin (Doppler/DJJ)',
      'Pengukuran tinggi fundus uteri & posisi janin',
      'Skrining tekanan darah & indeks massa tubuh',
      'Konseling tanda bahaya kehamilan & rujukan'
    ]
  },
  {
    layanan_id: 'LAY-02',
    nama: 'Pelayanan Persalinan Normal 24 Jam',
    kategori: 'PERSALINAN',
    deskripsi: 'Pertolongan persalinan normal siaga 24 jam dengan pendekatan asuhan sayang ibu dan bayi, ruang bersalin privat steril, dan pemantauan partograf.',
    durasi_menit: 180,
    highlight: 'Siaga 24 Jam Penuh',
    icon: 'persalinan',
    cakupan: [
      'Asuhan persalinan normal (APN) 24 jam',
      'Pemantauan kemajuan persalinan (Partograf)',
      'Ruang bersalin privat, tenang, dan higienis',
      'Manajemen nyeri alami & pendampingan keluarga'
    ]
  },
  {
    layanan_id: 'LAY-03',
    nama: 'Pelayanan Keluarga Berencana (KB)',
    kategori: 'KB',
    deskripsi: 'Konseling pemilihan metode kontrasepsi dan tindakan pemasangan atau kontrol alat kontrasepsi sesuai kondisi kesehatan dan kebutuhan keluarga.',
    durasi_menit: 20,
    highlight: 'Konseling Medis & Privasi Terjaga',
    icon: 'kb',
    cakupan: [
      'Pemasangan & kontrol IUD (AKDR)',
      'Pemasangan & pelepasan implan (Susuk KB)',
      'Pelayanan suntik KB (1 bulan & 3 bulan)',
      'Konseling pra-pemilihan kontrasepsi'
    ]
  },
  {
    layanan_id: 'LAY-04',
    nama: 'Asuhan Bayi Baru Lahir (Newborn Care)',
    kategori: 'NEWBORN',
    deskripsi: 'Pelayanan esensial bagi bayi baru lahir usia 0-6 jam untuk memastikan adaptasi kehidupan di luar rahim berjalan optimal, aman, dan sehat.',
    durasi_menit: 30,
    highlight: 'Standar Asuhan Bayi 0-6 Jam',
    icon: 'newborn',
    cakupan: [
      'Fasilitasi Inisiasi Menyusu Dini (IMD)',
      'Pencegahan perdarahan (Injeksi Vitamin K1)',
      'Pencegahan infeksi (Pemberian Salep Mata)',
      'Perawatan tali pusat steril & pencegahan hipotermia'
    ]
  },
  {
    layanan_id: 'LAY-05',
    nama: 'Kunjungan Neonatal & Pemantauan Tumbuh Kembang',
    kategori: 'NEWBORN',
    deskripsi: 'Pemeriksaan rutin bayi usia 6 jam hingga 28 hari (KN1, KN2, KN3) serta monitoring kurva pertumbuhan berat badan, panjang badan, dan lingkar kepala.',
    durasi_menit: 25,
    highlight: 'Jadwal Kontrol KN1, KN2, KN3',
    icon: 'neonatal',
    cakupan: [
      'Pemeriksaan fisik lengkap neonatus',
      'Skrining ikterus / kuning & tanda bahaya bayi',
      'Pencatatan grafik berat badan & panjang badan',
      'Evaluasi kecukupan dan teknik menyusu ASI'
    ]
  },
  {
    layanan_id: 'LAY-06',
    nama: 'Asuhan Masa Nifas (PNC) & Bimbingan Laktasi',
    kategori: 'NIFAS',
    deskripsi: 'Pemantauan pemulihan fisik dan psikis ibu pasca persalinan (KF1-KF4), perawatan jahitan jalan lahir, serta bimbingan intensif keberhasilan menyusui.',
    durasi_menit: 30,
    highlight: 'Pemulihan Ibu & Dukungan Menyusui',
    icon: 'laktasi',
    cakupan: [
      'Pemeriksaan involusi rahim & lochea',
      'Perawatan luka jalan lahir / perineum',
      'Konseling manajemen perlekatan ASI eksklusif',
      'Edukasi nutrisi & pemulihan fisik masa nifas'
    ]
  }
];

export const MOCK_SESI_HARI_INI: SesiPraktikItem[] = [
  {
    sesi_id: 'SESI-PAGI',
    nama: 'Sesi Pagi (Konsultasi & Pemeriksaan)',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    kuota_maks: 15,
    durasi_per_pasien: 15,
    terisi: 9,
    sisa_kuota: 6,
    status: 'BUKA',
    keterangan: 'Pemeriksaan Kehamilan, Kontrol KB, dan Pemeriksaan Neonatal'
  },
  {
    sesi_id: 'SESI-SORE',
    nama: 'Sesi Sore (Konsultasi & Pemeriksaan)',
    jam_mulai: '16:00',
    jam_selesai: '20:00',
    kuota_maks: 15,
    durasi_per_pasien: 15,
    terisi: 5,
    sisa_kuota: 10,
    status: 'BUKA',
    keterangan: 'Pemeriksaan Kehamilan, Nifas, dan Konseling Laktasi'
  }
];

export const MOCK_ANTREAN_LIVE: AntreanItem[] = [
  {
    antrean_id: 'A-01',
    nomor_antrean: 'A-007',
    status: 'DIPERIKSA',
    waktu_estimasi: 'Sedang Berlangsung',
    nama_samaran: 'Ny. R***',
    nama_layanan: 'Pemeriksaan Kehamilan (ANC)'
  },
  {
    antrean_id: 'A-02',
    nomor_antrean: 'A-008',
    status: 'MENUNGGU',
    waktu_estimasi: '10:15 WIB',
    nama_samaran: 'Ny. D***',
    nama_layanan: 'Pelayanan KB'
  },
  {
    antrean_id: 'A-03',
    nomor_antrean: 'A-009',
    status: 'MENUNGGU',
    waktu_estimasi: '10:35 WIB',
    nama_samaran: 'Bayi Ny. S***',
    nama_layanan: 'Pemeriksaan Neonatal (KN2)'
  },
  {
    antrean_id: 'A-04',
    nomor_antrean: 'A-010',
    status: 'MENUNGGU',
    waktu_estimasi: '10:55 WIB',
    nama_samaran: 'Ny. M***',
    nama_layanan: 'Pemeriksaan Kehamilan (ANC)'
  }
];

export const MOCK_TESTIMONI = [
  {
    id: 'TESTI-01',
    nama: 'Ny. S**** (Pasien Bersalin)',
    layanan: 'Pelayanan Persalinan Normal 24 Jam',
    ulasan: 'Pelayanan Bu Bidan Ria sangat sabar dan menenangkan. Suasana kamar bersalin bersih, tenang, dan didampingi penuh kasih hingga si kecil lahir dengan selamat.',
    rating: 5,
    waktu: '2 minggu lalu'
  },
  {
    id: 'TESTI-02',
    nama: 'Ny. D**** (Pasien ANC & Nifas)',
    layanan: 'Pemeriksaan Kehamilan & Asuhan Nifas',
    ulasan: 'Penjelasan Bu Bidan sangat rinci saat pemeriksaan kehamilan. Setiap pertanyaan dijawab tuntas tanpa terburu-buru, dan asuhan nifasnya sangat membantu pemulihan saya.',
    rating: 5,
    waktu: '1 bulan lalu'
  },
  {
    id: 'TESTI-03',
    nama: 'Ny. N**** (Pasien Bayi Baru Lahir)',
    layanan: 'Kunjungan Neonatal & Tumbuh Kembang',
    ulasan: 'Pemeriksaan bayi baru lahir teliti sekali, mulai dari tali pusat sampai berat badannya dicek cermat. Kami sebagai orang tua baru merasa sangat terbantu.',
    rating: 5,
    waktu: '1 bulan lalu'
  }
];

export const MOCK_EDUKASI = [
  {
    id: 'EDU-01',
    judul: 'Tanda Bahaya Kehamilan yang Harus Segera Diperiksakan',
    kategori: 'Kehamilan',
    ringkasan: 'Mengenali tanda bahaya seperti pendarahan jalan lahir, sakit kepala hebat, bengkak mendadak, atau gerak janin berkurang untuk penanganan segera.',
    bacaan_menit: 4,
    tanggal: '12 November 2026'
  },
  {
    id: 'EDU-02',
    judul: 'Panduan Asuhan Bayi Baru Lahir di Rumah',
    kategori: 'Perawatan Bayi',
    ringkasan: 'Langkah praktis merawat tali pusat tetap kering dan bersih, menjaga kehangatan tubuh bayi, serta memastikan frekuensi buang air yang sehat.',
    bacaan_menit: 5,
    tanggal: '05 November 2026'
  },
  {
    id: 'EDU-03',
    judul: 'Manajemen Keberhasilan ASI Eksklusif bagi Ibu Bekerja',
    kategori: 'Laktasi',
    ringkasan: 'Strategi memerah, menyimpan, dan memberikan ASI perah (ASIP) secara optimal tanpa menurunkan produksi ASI ibu.',
    bacaan_menit: 6,
    tanggal: '28 Oktober 2026'
  }
];

export interface AuditLogItem {
  log_id: number;
  waktu: string;
  user_ref: string;
  peran: string;
  aksi: string;
  tabel: string;
  id_baris: string;
  ip_address: string;
  nilai_lama: string;
  nilai_baru: string;
}

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    log_id: 10482,
    waktu: '2026-11-21 09:48:12',
    user_ref: 'Bdn. Ria Indrasti J., S.Keb',
    peran: 'DOKTER',
    aksi: 'UPDATE_RME_ANC',
    tabel: 'Pemeriksaan_ANC',
    id_baris: 'ANC-2026-0089',
    ip_address: '192.168.1.104',
    nilai_lama: '{"status": "MENUNGGU", "tfu": 22, "djj": null}',
    nilai_baru: '{"status": "SELESAI", "tfu": 24, "djj": 142, "tekanan_darah": "115/75"}'
  },
  {
    log_id: 10481,
    waktu: '2026-11-21 09:35:04',
    user_ref: 'Siti Rahma (Admin Loket)',
    peran: 'ADMIN_LOKAL',
    aksi: 'VERIFIKASI_ANTREAN',
    tabel: 'Antrean',
    id_baris: 'ANT-A007',
    ip_address: '192.168.1.102',
    nilai_lama: '{"status": "MENUNGGU"}',
    nilai_baru: '{"status": "DIPANGGIL", "ruang": "R. Periksa 1"}'
  },
  {
    log_id: 10480,
    waktu: '2026-11-21 09:12:30',
    user_ref: 'Siti Rahma (Admin Loket)',
    peran: 'ADMIN_LOKAL',
    aksi: 'CREATE_PENDAFTARAN',
    tabel: 'Reservasi',
    id_baris: 'RES-892112',
    ip_address: '192.168.1.102',
    nilai_lama: '{}',
    nilai_baru: '{"nik": "1571025509930002", "nama": "Ny. Desi W.", "layanan": "ANC", "sesi": "SESI-PAGI"}'
  },
  {
    log_id: 10479,
    waktu: '2026-11-21 08:30:15',
    user_ref: 'Ahmad Fauzi (Logistik Alkes)',
    peran: 'ADMIN_LOKAL',
    aksi: 'MUTASI_STOK_OBAT',
    tabel: 'Mutasi_Stok',
    id_baris: 'MUT-2026-0041',
    ip_address: '192.168.1.105',
    nilai_lama: '{"stok_oksitosin": 50}',
    nilai_baru: '{"stok_oksitosin": 48, "alasan": "Asuhan Persalinan Ny. S"}'
  },
  {
    log_id: 10478,
    waktu: '2026-11-21 08:00:02',
    user_ref: 'Superadmin IT',
    peran: 'SUPERADMIN',
    aksi: 'AUTH_LOGIN_SUCCESS',
    tabel: 'Akun_Pengguna',
    id_baris: 'USR-SA-01',
    ip_address: '192.168.1.100',
    nilai_lama: '{"last_login": "2026-11-20 18:04:11"}',
    nilai_baru: '{"last_login": "2026-11-21 08:00:02", "session_id": "SES-99812"}'
  },
  {
    log_id: 10477,
    waktu: '2026-11-20 20:15:40',
    user_ref: 'Bdn. Ria Indrasti J., S.Keb',
    peran: 'DOKTER',
    aksi: 'CREATE_ASUHAN_BBL',
    tabel: 'Asuhan_BBL',
    id_baris: 'BBL-2026-0034',
    ip_address: '192.168.1.104',
    nilai_lama: '{}',
    nilai_baru: '{"imd": true, "vit_k1": true, "salep_mata": true, "bb_lahir": 3200, "pb_lahir": 49}'
  }
];


export const MOCK_REKAP_KEUANGAN: import('./types').RekapKeuanganOperasional = {
  periode: 'Hari Ini (Sesi Pagi & Sore)',
  total_pendapatan: 4850000,
  total_pengeluaran_obat: 1920000,
  beban_operasional_klinik: 450000,
  laba_bersih: 2480000,
  margin_bersih_persen: 51.13,
  analisis_fluktuasi: 'Margin laba operasional tetap kuat di level 51.1% meskipun terjadi lonjakan HPP bahan obat impor Oksitosin (+18.9%) dan IUD (+10.3%). Peningkatan volume layanan persalinan normal dan efisiensi paket asuhan kebidanan berhasil mengimbangi kenaikan harga bahan baku farmasi.'
};

export const MOCK_HARGA_OBAT_LOGS: import('./types').HargaObatLogItem[] = [
  {
    harga_obat_id: 'HRO-2026-0091',
    obat_id: 'OBT-OKS-01',
    kode_obat: 'OBT-OKS-01',
    nama_obat: 'Oksitosin 10 IU / mL (Injeksi)',
    kategori: 'Uterotonika',
    hpp_beli: 22000,
    harga_jual: 35000,
    margin_rp: 13000,
    margin_persen: 37.14,
    berlaku_dari: '2026-10-01',
    berlaku_sampai: null,
    diubah_oleh: 'Ahmad Fauzi (Logistik)',
    alasan: 'Kenaikan HPP bahan baku pabrik farmasi Bio Farma sebesar 18.9% (dari Rp 18.500 menjadi Rp 22.000) akibat fluktuasi bahan baku impor. Penyesuaian harga jual dilakukan agar ketersediaan stok gawat darurat persalinan 24 jam tetap terjamin.'
  },
  {
    harga_obat_id: 'HRO-2026-0088',
    obat_id: 'ALKES-IUD-01',
    kode_obat: 'ALKES-IUD-01',
    nama_obat: 'IUD Copper T 380A Steril',
    kategori: 'Alat Kontrasepsi',
    hpp_beli: 160000,
    harga_jual: 250000,
    margin_rp: 90000,
    margin_persen: 36.0,
    berlaku_dari: '2026-09-15',
    berlaku_sampai: null,
    diubah_oleh: 'Ahmad Fauzi (Logistik)',
    alasan: 'Penyesuaian biaya logistik jalur dingin dan distributor alkes steril nasional. Margin laba dipertahankan stabil pada rentang 36%.'
  },
  {
    harga_obat_id: 'HRO-2026-0085',
    obat_id: 'OBT-VK1-01',
    kode_obat: 'OBT-VK1-01',
    nama_obat: 'Vitamin K1 1 mg (Injeksi BBL)',
    kategori: 'Profilaksis Bayi',
    hpp_beli: 12000,
    harga_jual: 20000,
    margin_rp: 8000,
    margin_persen: 40.0,
    berlaku_dari: '2026-08-01',
    berlaku_sampai: null,
    diubah_oleh: 'Ahmad Fauzi (Logistik)',
    alasan: 'Harga stabil program profilaksis neonatal BBL, pasokan lancar dari PBF rekanan.'
  },
  {
    harga_obat_id: 'HRO-2026-0082',
    obat_id: 'OBT-GNT-01',
    kode_obat: 'OBT-GNT-01',
    nama_obat: 'Salep Mata Gentamisin 1%',
    kategori: 'Profilaksis Bayi',
    hpp_beli: 11500,
    harga_jual: 18000,
    margin_rp: 6500,
    margin_persen: 36.11,
    berlaku_dari: '2026-11-01',
    berlaku_sampai: null,
    diubah_oleh: 'Ahmad Fauzi (Logistik)',
    alasan: 'Kenaikan HPP distributor lokal dari Rp 9.500 ke Rp 11.500 karena sertifikasi kemasan steril tube baru.'
  }
];

export const MOCK_NOTIFIKASI_EMAIL: import('./types').NotifikasiEmailPasien[] = [
  {
    notif_id: 'EML-2026-0099',
    pasien_nama: 'Ny. Ratna Sari',
    email_tujuan: 'ratna.sari@gmail.com',
    jenis: 'TIKET_RESERVASI',
    subjek: 'Tiket Antrean A-007 - Praktik Mandiri Bidan Ria Indrasti',
    waktu_kirim: '2026-11-21 08:15:22',
    status: 'TERKIRIM'
  },
  {
    notif_id: 'EML-2026-0098',
    pasien_nama: 'Ny. Dewi Lestari',
    email_tujuan: 'dewi.lestari@yahoo.com',
    jenis: 'TIKET_RESERVASI',
    subjek: 'Tiket Antrean A-008 - Praktik Mandiri Bidan Ria Indrasti',
    waktu_kirim: '2026-11-21 09:12:45',
    status: 'TERKIRIM'
  },
  {
    notif_id: 'EML-2026-0097',
    pasien_nama: 'Ny. Ratna Dewi',
    email_tujuan: 'ratna.dewi@gmail.com',
    jenis: 'PENGINGAT_KONTROL_H1',
    subjek: 'Pengingat Kontrol Kehamilan Trimester 3 (H-1) - Bidan Ria',
    waktu_kirim: '2026-11-20 09:00:00',
    status: 'TERKIRIM'
  }
];
