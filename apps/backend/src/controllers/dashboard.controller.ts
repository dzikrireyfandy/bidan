import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import DashboardService from '../services/dashboard.service';
import type { DashboardInternalInput } from '../validation/dashboard';

const service = new DashboardService();

export const internalDashboard = asyncHandler(async (req, res) => {
  const body = (req.validated?.body ?? {}) as DashboardInternalInput;
  const auth = {
    peran: req.auth!.peran,
    subPeran: req.auth?.subPeran ?? null
  };
  return respond.ok(res, await service.getInternalDashboard(body, auth));
});

export default {
  internalDashboard
};
