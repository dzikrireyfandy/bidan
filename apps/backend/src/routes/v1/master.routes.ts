import { buildCrudRouter, type CrudRoute } from './_crud';
import type { Peran } from '../../types';

const SEMUA_STAF: Peran[] = ['SUPERADMIN', 'ADMIN_LOKAL', 'DOKTER', 'STAFF'];
const ADMIN: Peran[] = ['SUPERADMIN', 'ADMIN_LOKAL'];

const routes: CrudRoute[] = [
  {
    path: '/unit-pelayanan',
    table: '[Unit_Pelayanan]',
    pk: 'unit_id',
    columns: ['rumah_sakit_id', 'induk_unit_id', 'kepala_staf_id', 'kode', 'nama', 'jenis', 'aktif'],
    read: SEMUA_STAF,
    write: ['SUPERADMIN'],
    update: false
  },
  {
    path: '/ruangan',
    table: '[Ruangan]',
    pk: 'ruangan_id',
    columns: ['unit_id', 'gedung_id', 'kode', 'nama', 'jenis', 'lantai', 'kapasitas', 'status'],
    read: SEMUA_STAF,
    write: ADMIN,
    update: false
  },
  {
    path: '/kelas-perawatan',
    table: '[Kelas_Perawatan]',
    pk: 'kelas_id',
    columns: ['kode', 'nama', 'urutan'],
    read: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    write: ADMIN,
    create: false,
    update: false
  },
  {
    path: '/layanan',
    table: '[Layanan_Medis]',
    pk: 'layanan_id',
    columns: ['unit_id', 'kode', 'nama', 'kategori', 'satuan', 'kode_icd9', 'aktif'],
    read: SEMUA_STAF,
    write: ADMIN
  },
  {
    path: '/paket-layanan',
    table: '[Paket_Layanan]',
    pk: 'paket_id',
    columns: ['kode', 'nama', 'jenis', 'aktif'],
    read: SEMUA_STAF,
    write: ADMIN,
    update: false
  },
  {
    path: '/penjamin',
    table: '[Penjamin]',
    pk: 'penjamin_id',
    columns: ['nama', 'jenis', 'no_kontrak', 'kontak', 'aktif'],
    read: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    write: ADMIN,
    create: false,
    update: false
  },
  {
    path: '/pemasok',
    table: '[Pemasok]',
    pk: 'pemasok_id',
    columns: ['nama', 'alamat', 'kontak', 'npwp', 'aktif'],
    read: ADMIN,
    write: ADMIN,
    update: false
  },
  {
    path: '/master/vaksin',
    table: '[Vaksin]',
    pk: 'vaksin_id',
    columns: ['obat_id', 'nama', 'jumlah_dosis_standar', 'usia_anjuran'],
    read: [...ADMIN, 'DOKTER', 'STAFF'],
    write: ADMIN,
    create: false,
    update: false
  },
  {
    path: '/master/metode-kb',
    table: '[Metode_KB]',
    pk: 'metode_id',
    columns: ['obat_id', 'nama', 'jenis'],
    read: [...ADMIN, 'DOKTER', 'STAFF'],
    write: ADMIN,
    create: false,
    update: false
  },
  {
    path: '/master/parameter-lab',
    table: '[Parameter_Lab]',
    pk: 'parameter_id',
    columns: ['layanan_id', 'nama', 'satuan', 'nilai_rujukan_min', 'nilai_rujukan_maks'],
    read: [...ADMIN, 'DOKTER', 'STAFF'],
    write: ADMIN,
    create: false,
    update: false
  },
  {
    path: '/pemulasaran',
    table: '[Pemulasaran_Jenazah]',
    pk: 'pemulasaran_id',
    columns: [
      'pasien_id',
      'kunjungan_id',
      'ruangan_id',
      'staf_id',
      'waktu_meninggal',
      'penyebab',
      'waktu_masuk',
      'waktu_diserahkan',
      'penerima'
    ],
    read: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    write: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    update: false
  },
  {
    path: '/aset',
    table: '[Aset]',
    pk: 'aset_id',
    columns: ['ruangan_id', 'kode', 'nama', 'kategori', 'tgl_perolehan', 'harga_perolehan', 'kondisi', 'status'],
    read: ADMIN,
    write: ADMIN,
    update: false
  },
  {
    path: '/klaim-penjamin',
    table: '[Klaim_Penjamin]',
    pk: 'klaim_id',
    columns: ['tagihan_id', 'penjamin_id', 'no_sep', 'kode_grup_tarif', 'tarif_klaim', 'status', 'tgl_ajuan', 'tgl_dibayar'],
    read: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    write: ['SUPERADMIN', 'ADMIN_LOKAL', 'STAFF'],
    create: false
  },
  {
    path: '/insiden',
    table: '[Laporan_Insiden]',
    pk: 'insiden_id',
    columns: [
      'kunjungan_id',
      'unit_id',
      'pelapor_staf_id',
      'jenis',
      'tingkat_keparahan',
      'deskripsi',
      'tindak_lanjut',
      'status',
      'tgl'
    ],
    read: SEMUA_STAF,
    write: SEMUA_STAF
  },
  {
    path: '/staf',
    table: '[Staf]',
    pk: 'staf_id',
    columns: [
      'nip',
      'nama',
      'jenis_kelamin',
      'tgl_lahir',
      'no_telepon',
      'alamat',
      'profesi_id',
      'unit_id',
      'jabatan',
      'status_kepegawaian',
      'tgl_masuk',
      'aktif',
      'email'
    ],
    read: ADMIN,
    write: ADMIN
  }
];

export default buildCrudRouter(routes);
