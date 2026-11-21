import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditContext {
  akunId?: string | null;
  userRef?: string | null;
  keterangan?: string | null;
}

const auditStore = new AsyncLocalStorage<AuditContext>();

export const runWithAudit = <T>(ctx: AuditContext, fn: () => T): T => auditStore.run(ctx, fn);

export const getAuditContext = (): AuditContext => auditStore.getStore() ?? {};
