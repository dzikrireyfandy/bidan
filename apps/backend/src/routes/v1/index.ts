import { Router } from 'express';
import authRouter from './auth.routes';
import publicRouter from './public.routes';
import masterRouter from './master.routes';
import pasienRouter from './pasien.routes';
import reservasiRouter from './reservasi.routes';
import klinisRouter from './klinis.routes';
import bayiRouter from './bayi.routes';
import inventarisRouter from './inventaris.routes';
import keuanganRouter from './keuangan.routes';
import ranapRouter from './ranap.routes';
import penunjangRouter from './penunjang.routes';
import laporanRouter from './laporan.routes';
import dashboardRouter from './dashboard.routes';
import adminRouter from './admin.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'API Kesehatan Terintegrasi',
      version: '1.0.0',
      status: 'active'
    }
  });
});

router.use(authRouter);
router.use(publicRouter);
router.use(masterRouter);
router.use(pasienRouter);
router.use(reservasiRouter);
router.use(klinisRouter);
router.use(bayiRouter);
router.use(inventarisRouter);
router.use(keuanganRouter);
router.use(ranapRouter);
router.use(penunjangRouter);
router.use(laporanRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
