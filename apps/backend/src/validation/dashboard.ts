import { z } from 'zod';

export const dashboardInternalSchema = z.object({
  limit_peringatan: z.coerce.number().int().min(1).max(200).optional().default(50),
  limit_tagihan: z.coerce.number().int().min(1).max(200).optional().default(50)
});

export type DashboardInternalInput = z.infer<typeof dashboardInternalSchema>;
