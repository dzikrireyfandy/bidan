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

## 3. Arsitektur

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

## 4. Keamanan

- **CORS whitelist**: hanya `ALLOWED_ORIGINS`. Origin asing ditolak `403 ERR-AUTH-03` sebelum CORS.
- **Rate limit**: global `RATE_LIMIT_MAX` dan khusus login/reset `AUTH_RATE_LIMIT_MAX`.
  Respons menyertakan `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `Retry-After` saat 429.
  Limiter saat ini **in-memory per proses**; untuk multi-instance gunakan Redis.
- **JWT**: default 30 menit, memuat `peran`, `subPeran`, `stafId`, `pasienId`, `unitId`. Token diperpanjang otomatis bila sisa masa berlaku kurang dari 5 menit (refresh tiap 30 menit), sehingga pengguna tidak logout selama tab aktif.
- **Helmet** aktif; body JSON dibatasi 1 MB.
- **`X-Client-App`** (`BIDAN` / `RS` / `PORTAL`) dicatat pada request.

## 5. RBAC

Profil efektif:

- `SUPERADMIN`
- `ADMIN_LOKAL`
- `DOKTER`
- `STAFF:PERAWAT`
- `STAFF:RESEPSIONIS`
- `PASIEN`

Matriks lengkap per endpoint diuji di `tests/rbac-matrix.test.ts` (126 × 6 profil) dan mengikuti TSD §3.2.

## 6. Endpoint per domain

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

## 7. Test

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

## 8. Catatan operasional

- Jalankan `npm run build:backend` sebelum `pm2 reload` (`ecosystem.config.cjs` memakai `dist/`).
- `BaseRepository` dipertahankan sebagai API internal yang diuji; repository domain memakai SQL khusus.
- Perubahan kontrak API (422 + `errorId`) perlu diselaraskan dengan interceptor frontend.
