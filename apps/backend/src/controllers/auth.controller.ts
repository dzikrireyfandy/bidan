import { asyncHandler } from '../middleware/asyncHandler';
import respond from '../http/respond';
import { AuthService } from '../services/auth.service';
import type { EmailInput, LoginInput, ResetVerifyInput } from '../validation/auth';

const service = new AuthService();

export const login = asyncHandler(async (req, res) => {
  const body = req.validated?.body as LoginInput;
  return respond.ok(res, await service.login(body.username, body.password));
});

export const logout = asyncHandler(async (req, res) => {
  if (req.auth) {
    await service.logout(req.auth);
  }
  return respond.ok(res, { message: 'Logout berhasil' });
});

export const refresh = asyncHandler(async (req, res) => {
  if (!req.auth) {
    return respond.ok(res, { token: null });
  }
  return respond.ok(res, service.refresh(req.auth));
});

export const requestReset = asyncHandler(async (req, res) => {
  const body = req.validated?.body as EmailInput;
  return respond.ok(res, await service.requestReset(body.email));
});

export const verifyReset = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ResetVerifyInput;
  return respond.ok(res, await service.verifyReset(body.email, body.otp, body.password_baru));
});

export default {
  login,
  logout,
  refresh,
  requestReset,
  verifyReset
};
