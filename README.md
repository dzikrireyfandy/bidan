# Sistem Kesehatan Terintegrasi — Backend API

Backend Express + TypeScript untuk Praktik Mandiri Bidan & Rumah Sakit.
Satu API melayani dua SPA (`apps/fe-bidan`, `apps/fe-rs`) dengan **126 endpoint bisnis**.

---

## 1. Prasyarat

- Node.js 20+
- npm 10+
- SQL Server 2022/2025 (untuk menjalankan aplikasi; test otomatis memakai mock DB)

## 2. Menjalankan

```bash
npm install

# salin konfigurasi
cp apps/backend/.env.example apps/backend/.env
# sesuaikan DB_*, JWT_SECRET, ALLOWED_ORIGINS

npm run dev:backend        # tsx watch
npm run build:backend      # tsc -> apps/backend/dist
npm run typecheck:backend  # tsc --noEmit termasuk test
npm test                   # jest (backend)
```

Build seluruh workspace:

```bash
npm run build:all          # backend + fe-bidan + fe-rs
```

## 3. Konfigurasi environment

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port HTTP |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `DB_SERVER` | — | Host SQL Server |
| `DB_PORT` | `1433` | Port SQL Server |
| `DB_NAME` | — | Nama database |
| `DB_USER` / `DB_PASSWORD` | — | Kredensial database |
| `DB_ENCRYPT` | `false` | `true` untuk koneksi terenkripsi |
| `JWT_SECRET` | — | Wajib; gunakan nilai acak panjang |
| `JWT_EXPIRES_IN` | `30m` | Durasi token (`30m`, `2h`, `1800`, ...) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Daftar origin CORS dipisah koma |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Jendela rate limit global |
| `RATE_LIMIT_MAX` | `300` | Maksimum request per jendela (global) |
| `AUTH_RATE_LIMIT_MAX` | `20` | Maksimum request login/reset per jendela |
| `DEFAULT_UNIT_BIDAN_ID` | — | UUID unit bidan default (opsional) |
| `SMTP_*` | — | Konfigurasi email notifikasi (opsional) |

Saat `NODE_ENV=test`, nilai fallback aman dipakai otomatis sehingga test tidak butuh `.env`.

## 4. Arsitektur

```
src/
├─ routes/v1/*.routes.ts        # wiring route + middleware + schema
├─ controllers/*.controller.ts  # handler tipis (tanpa SQL)
├─ services/*.service.ts        # aturan bisnis, error domain
├─ repositories/*.repository.ts # seluruh SQL / stored procedure
├─ validation/*.ts              # skema zod body/query/params
├─ middleware/                  # auth, rbac, originGuard, rateLimit, errorHandler
├─ errors/                      # ApiError + kode ERR-*
├─ auth/profiles.ts             # konstanta profil RBAC
└─ http/respond.ts              # envelope respons sukses
```

Aturan yang dijaga oleh test:

- Tidak ada SQL atau import `db/pool` di `routes/` dan `controllers/`.
- Setiap route terdaftar di `routes/v1/_registry.ts` (tepat 126).
- Setiap route punya schema validasi; route ber-`:param` wajib punya `params`.
- Route `auth: true` wajib punya daftar profil.

## 5. Format respons

Sukses:

```json
{ "success": true, "data": { } }
```

Sukses dengan metadata:

```json
{ "success": true, "data": [], "meta": { } }
```

Gagal:

```json
{
  "success": false,
  "error": {
    "code": 422,
    "errorId": "ERR-VAL-01",
    "message": "Validasi body gagal",
    "details": [{ "path": ["nik"], "message": "NIK harus 16 digit angka" }]
  }
}
```

`errorId` mengikuti FSD §6. Kode utama:

| errorId | HTTP | Arti |
|---|---|---|
| `ERR-VAL-01` | 422 | Validasi request gagal |
| `ERR-AUTH-01` | 401 | Token tidak ada / tidak valid |
| `ERR-AUTH-02` | 401 | Username atau kata sandi salah |
| `ERR-AUTH-03` | 403 | Profil/origin tidak diizinkan |
| `ERR-AUTH-04` | 401 | Token kedaluwarsa |
| `ERR-AUTH-05` | 422 | OTP reset tidak valid |
| `ERR-LOCK-01` | 403 | Akun terkunci sementara |
| `ERR-RSV-01` | 409 | Kuota sesi penuh |
| `ERR-RME-04` | 404 | Data pasien tidak ditemukan |
| `ERR-INV-02` | 404 | Item/obat tidak ditemukan |
| `ERR-INV-03` | 409 | Duplikat obat |
| `ERR-FIN-01` | 422 | Pembayaran melebihi sisa tagihan |
| `ERR-FIN-02` | 404 | Tagihan tidak ditemukan |
| `ERR-PRC-01` | 422 | Harga/tanggal berlaku tidak valid |
| `ERR-CNT-01` | 404 | Konten tidak ditemukan |
| `ERR-RPT-01` | 404 | Data laporan periode kosong |
| `ERR-SYS-01` | 503 | Database tidak tersedia |
| `ERR-SYS-03` | 429 | Rate limit terlampaui |

Daftar lengkap ada di `src/errors/codes.ts`.

## 6. Keamanan

- **CORS whitelist**: hanya `ALLOWED_ORIGINS`. Origin asing ditolak `403 ERR-AUTH-03` sebelum CORS.
- **Rate limit**: global `RATE_LIMIT_MAX` dan khusus login/reset `AUTH_RATE_LIMIT_MAX`.
  Respons menyertakan `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `Retry-After` saat 429.
  Limiter saat ini **in-memory per proses**; untuk multi-instance gunakan Redis.
- **JWT**: default 30 menit, memuat `peran`, `subPeran`, `stafId`, `pasienId`, `unitId`.
- **Helmet** aktif; body JSON dibatasi 1 MB.
- **`X-Client-App`** (`BIDAN` / `RS` / `PORTAL`) dicatat pada request.

## 7. RBAC

Profil efektif:

- `SUPERADMIN`
- `ADMIN_LOKAL`
- `DOKTER`
- `STAFF:PERAWAT`
- `STAFF:RESEPSIONIS`
- `PASIEN`

Matriks lengkap per endpoint diuji di `tests/rbac-matrix.test.ts` (126 × 6 profil) dan mengikuti TSD §3.2.

## 8. Endpoint per domain

| Domain | Jumlah | Prefix utama |
|---|---|---|
| Auth | 5 | `/auth/*` |
| Public | 6 | `/public/*` |
| Master | 28 | `/unit-pelayanan`, `/ruangan`, `/layanan`, `/staf`, ... |
| Pasien | 8 | `/pasien/*`, `/pasien/:id/rme/*` |
| Reservasi | 10 | `/reservasi/*`, `/jadwal/*`, `/sesi/*` |
| Klinis | 12 | `/kunjungan/*`, `/kehamilan/*`, `/anc/*`, `/persalinan/*` |
| Bayi | 5 | `/bayi/*` |
| Penunjang | 4 | `/penunjang/*`, `/lab/*`, `/radiologi/*` |
| Ranap | 14 | `/rawat-inap/*`, `/igd/*`, `/operasi/*`, `/ambulans/*` |
| Inventaris | 13 | `/obat/*`, `/batch/*`, `/resep/*`, `/gudang/*` |
| Keuangan | 7 | `/tagihan/*`, `/harga/*`, `/keuangan/*` |
| Laporan | 12 | `/laporan/*`, `/konten/*`, `/notifikasi/*`, `/audit-logs/*` |
| Admin | 2 | `/akun/*`, `/aset/:id/pemeliharaan` |
| **Total** | **126** | |

Sumber kebenaran daftar endpoint: `src/routes/v1/_registry.ts` dan `tests/routes-matrix.test.ts`.

## 9. Test

```bash
npm test
```

Cakupan saat ini:

- `routes-matrix` — 126 endpoint, sinkron registry↔router, cakupan schema, kontrak SQL.
- `rbac-matrix` — seluruh kombinasi endpoint × profil.
- `security` — 422, origin 403, CORS, rate limit 429 + header, preflight, token kedaluwarsa.
- `smoke` — seluruh endpoint dapat dijangkau.
- `services/*` — aturan bisnis per domain (keuangan, inventaris, ranap, auth, reservasi, master, klinis, bayi, pasien, penunjang, laporan, public, admin).
- `repository` / `rbac` / `health` — unit dasar.

Test memakai mock `db/pool`; integrasi ke SQL Server nyata (migrasi 97 tabel, stored procedure, trigger) belum termasuk dalam suite otomatis.

## 10. Catatan operasional

- Jalankan `npm run build:backend` sebelum `pm2 reload` (`ecosystem.config.cjs` memakai `dist/`).
- `BaseRepository` dipertahankan sebagai API internal yang diuji; repository domain memakai SQL khusus.
- Perubahan kontrak API (422 + `errorId`) perlu diselaraskan dengan interceptor frontend.
