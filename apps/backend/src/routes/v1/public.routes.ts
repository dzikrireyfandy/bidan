import { Router } from 'express';
import { validate } from './_validate';
import { defineRoute } from './_registry';
import {
  cekPasienSchema,
  jadwalListSchema,
  kontenListSchema,
  layananListSchema,
  reservasiSchema
} from '../../validation/public';
import {
  cekPasien,
  createReservasi,
  listJadwal,
  listKonten,
  listLayanan
} from '../../controllers/public.controller';

const router = Router();

defineRoute(
  router,
  { method: 'post', path: '/public/konten/list', auth: false, profiles: [], schemas: { body: kontenListSchema } },
  validate({ body: kontenListSchema }),
  listKonten
);

defineRoute(
  router,
  { method: 'post', path: '/public/layanan/list', auth: false, profiles: [], schemas: { body: layananListSchema } },
  validate({ body: layananListSchema }),
  listLayanan
);

defineRoute(
  router,
  { method: 'post', path: '/public/jadwal/list', auth: false, profiles: [], schemas: { body: jadwalListSchema } },
  validate({ body: jadwalListSchema }),
  listJadwal
);

defineRoute(
  router,
  { method: 'post', path: '/public/sesi/list', auth: false, profiles: [], schemas: { body: jadwalListSchema } },
  validate({ body: jadwalListSchema }),
  listJadwal
);

defineRoute(
  router,
  { method: 'post', path: '/public/pasien/cek', auth: false, profiles: [], schemas: { body: cekPasienSchema } },
  validate({ body: cekPasienSchema }),
  cekPasien
);

defineRoute(
  router,
  { method: 'post', path: '/public/reservasi', auth: false, profiles: [], schemas: { body: reservasiSchema } },
  validate({ body: reservasiSchema }),
  createReservasi
);

export default router;
